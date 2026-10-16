"""Rotas de acesso (RF01): cadastro, login, sair, termos, esqueci a senha e Google."""

from datetime import timedelta
from typing import Annotated
from urllib.parse import quote, urlparse

from fastapi import APIRouter, HTTPException, Request, Response, status
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, EmailStr, Field, StringConstraints
from sqlalchemy import select

from suricate.deps import Banco, Config, UsuarioLogado, ip_do_cliente
from suricate.models import RedefinicaoSenha, Usuario
from suricate.models.base import agora, em_utc
from suricate.seguranca import (
    COOKIE_GOOGLE,
    TERMOS_VERSAO,
    hash_senha,
    hash_token,
    normalizar_email,
    novo_token,
    senha_confere,
)
from suricate.services import acesso, email, google

router = APIRouter(prefix="/api/auth", tags=["acesso"])

Nome = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=120)]
Senha = Annotated[str, Field(min_length=8, max_length=128)]
ERRO_LOGIN = "E-mail ou senha incorretos."


class Cadastro(BaseModel):
    nome: Nome
    email: EmailStr
    senha: Senha
    aceite_termos: bool


class Login(BaseModel):
    email: EmailStr
    senha: str = Field(max_length=128)


class EmailApenas(BaseModel):
    email: EmailStr


class NovaSenha(BaseModel):
    token: str = Field(max_length=100)
    senha: Senha


def _papel(email_: str, settings) -> str:
    return "admin" if email_ in settings.admins else "usuario"


@router.post("/cadastro", status_code=status.HTTP_201_CREATED)
def cadastrar(dados: Cadastro, request: Request, response: Response, db: Banco, settings: Config) -> dict:
    if not dados.aceite_termos:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY, "Aceite os termos de uso para criar a conta."
        )
    email_ = normalizar_email(dados.email)
    if db.scalar(select(Usuario).where(Usuario.email == email_)):
        raise HTTPException(status.HTTP_409_CONFLICT, "Já existe uma conta com este e-mail. Que tal entrar?")
    usuario = Usuario(
        nome=dados.nome,
        email=email_,
        senha_hash=hash_senha(dados.senha),
        termos_versao=TERMOS_VERSAO,
        termos_aceitos_em=agora(),
        papel=_papel(email_, settings),
    )
    db.add(usuario)
    db.commit()
    acesso.abrir_sessao(db, usuario, request, response, settings)
    return acesso.resumo(db, usuario)


@router.post("/entrar")
def entrar(dados: Login, request: Request, response: Response, db: Banco, settings: Config) -> dict:
    email_, ip = normalizar_email(dados.email), ip_do_cliente(request)
    if acesso.bloqueado(db, email_, ip):
        raise HTTPException(
            status.HTTP_429_TOO_MANY_REQUESTS,
            "Muitas tentativas. Espere 15 minutos ou use “Esqueci a senha”.",
        )
    usuario = db.scalar(select(Usuario).where(Usuario.email == email_))
    if not senha_confere(dados.senha, usuario.senha_hash if usuario else None):
        acesso.registrar_tentativa(db, email_, ip, sucesso=False)
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, ERRO_LOGIN)
    acesso.registrar_tentativa(db, email_, ip, sucesso=True)
    acesso.abrir_sessao(db, usuario, request, response, settings)
    return acesso.resumo(db, usuario)


@router.post("/sair", status_code=status.HTTP_204_NO_CONTENT)
def sair(request: Request, response: Response, usuario: UsuarioLogado, db: Banco, settings: Config) -> None:
    db.delete(request.state.sessao)
    db.commit()
    acesso.apagar_cookie(response, settings)


@router.get("/eu")
def eu(usuario: UsuarioLogado, db: Banco) -> dict:
    return acesso.resumo(db, usuario)


@router.post("/termos")
def aceitar_termos(usuario: UsuarioLogado, db: Banco) -> dict:
    usuario.termos_versao = TERMOS_VERSAO
    usuario.termos_aceitos_em = agora()
    db.commit()
    return acesso.resumo(db, usuario)


@router.post("/senha/esqueci", status_code=status.HTTP_202_ACCEPTED)
def esqueci(dados: EmailApenas, db: Banco, settings: Config) -> dict:
    usuario = db.scalar(select(Usuario).where(Usuario.email == normalizar_email(dados.email)))
    if usuario:
        token, token_hash = novo_token()
        db.add(
            RedefinicaoSenha(
                usuario_id=usuario.id, token_hash=token_hash, expira_em=agora() + timedelta(hours=1)
            )
        )
        db.commit()
        link = f"{settings.app_url.rstrip('/')}/redefinir-senha?token={token}"
        try:
            email.enviar(
                settings,
                usuario.email,
                "Redefinir sua senha do Suricate",
                f"Oi, {usuario.apelido or usuario.nome}!\n\n"
                "Para criar uma senha nova, abra o link abaixo. "
                "Ele vale por 1 hora e funciona uma vez só.\n\n"
                f"{link}\n\n"
                "Se não foi você que pediu, pode ignorar este e-mail: sua senha continua a mesma.\n\nSuri",
            )
        except email.ErroEnvio as erro:
            db.rollback()
            raise HTTPException(
                status.HTTP_503_SERVICE_UNAVAILABLE,
                "Não consegui enviar o e-mail agora. Tente de novo em alguns minutos.",
            ) from erro
    return {"mensagem": "Se o e-mail tiver uma conta, enviamos um link para criar uma senha nova."}


@router.post("/senha/redefinir")
def redefinir(dados: NovaSenha, request: Request, response: Response, db: Banco, settings: Config) -> dict:
    pedido = db.scalar(select(RedefinicaoSenha).where(RedefinicaoSenha.token_hash == hash_token(dados.token)))
    if not pedido or pedido.usado_em or em_utc(pedido.expira_em) <= agora():
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Este link não vale mais. Peça um novo.")
    usuario = db.get(Usuario, pedido.usuario_id)
    usuario.senha_hash = hash_senha(dados.senha)
    pedido.usado_em = agora()
    db.commit()
    acesso.encerrar_sessoes(db, usuario)
    acesso.abrir_sessao(db, usuario, request, response, settings)
    return acesso.resumo(db, usuario)


# ---------- Google ----------


def _volta_para_login(settings, mensagem: str) -> RedirectResponse:
    # endereço relativo: a pessoa volta para o login do mesmo endereço em que está
    resposta = RedirectResponse(f"/entrar?erro={quote(mensagem)}", status.HTTP_303_SEE_OTHER)
    resposta.delete_cookie(COOKIE_GOOGLE, path="/api/auth/google")
    return resposta


def _no_endereco_do_app(request: Request, settings) -> bool:
    """O Google só devolve a pessoa para os endereços cadastrados, que são os APP_URL (decisão D4).
    Num preview de feature/* (outro endereço), o retorno cairia em outro ambiente."""
    host = request.headers.get("x-forwarded-host") or request.headers.get("host") or ""
    return host == urlparse(settings.app_url).netloc


@router.get("/google/inicio")
def google_inicio(request: Request, settings: Config) -> RedirectResponse:
    if not settings.google_configurado or not _no_endereco_do_app(request, settings):
        return _volta_para_login(
            settings, "O login com Google não está disponível neste endereço. Entre com e-mail e senha."
        )
    state, verificador, desafio = google.novo_pedido()
    resposta = RedirectResponse(google.url_autorizacao(settings, state, desafio), status.HTTP_303_SEE_OTHER)
    resposta.set_cookie(
        COOKIE_GOOGLE,
        f"{state}.{verificador}",
        max_age=600,
        httponly=True,
        secure=settings.cookie_seguro,
        samesite="lax",
        path="/api/auth/google",
    )
    return resposta


@router.get("/google/retorno")
def google_retorno(request: Request, db: Banco, settings: Config) -> RedirectResponse:
    state, _, verificador = request.cookies.get(COOKIE_GOOGLE, "").partition(".")
    code = request.query_params.get("code")
    if not code or not state or request.query_params.get("state") != state:
        return _volta_para_login(settings, "O login com Google foi cancelado ou expirou. Tente de novo.")
    try:
        identidade = google.obter_identidade(settings, code, verificador)
    except google.ErroGoogle as erro:
        return _volta_para_login(settings, str(erro))

    email_ = normalizar_email(identidade.email)
    usuario = db.scalar(select(Usuario).where(Usuario.google_sub == identidade.sub))
    if not usuario:
        usuario = db.scalar(select(Usuario).where(Usuario.email == email_))
        if usuario:  # mesma pessoa: liga o Google à conta que já existe
            usuario.google_sub = identidade.sub
            usuario.email_verificado = True
        else:
            usuario = Usuario(
                nome=identidade.nome[:120],
                email=email_,
                google_sub=identidade.sub,
                email_verificado=True,
                papel=_papel(email_, settings),
            )
            db.add(usuario)
        db.commit()

    destino = "/" if usuario.termos_versao == TERMOS_VERSAO else "/boas-vindas"
    resposta = RedirectResponse(f"{settings.app_url.rstrip('/')}{destino}", status.HTTP_303_SEE_OTHER)
    resposta.delete_cookie(COOKIE_GOOGLE, path="/api/auth/google")
    acesso.abrir_sessao(db, usuario, request, resposta, settings)
    return resposta
