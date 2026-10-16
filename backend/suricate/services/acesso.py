"""Sessões e limite de tentativas de login (seção 3 da documentação técnica do M2)."""

from datetime import timedelta

from fastapi import Request, Response
from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from suricate.config import Settings
from suricate.models import OnboardingProgresso, Sessao, TentativaAcesso, Usuario
from suricate.models.base import agora
from suricate.seguranca import COOKIE_SESSAO, DIAS_SESSAO, TERMOS_VERSAO, novo_token

JANELA = timedelta(minutes=15)
MAX_ERROS_EMAIL = 5
MAX_ERROS_IP = 30


def bloqueado(db: Session, email: str, ip: str) -> bool:
    desde = agora() - JANELA
    erros = (
        select(func.count())
        .select_from(TentativaAcesso)
        .where(TentativaAcesso.sucesso.is_(False), TentativaAcesso.criado_em >= desde)
    )
    por_email = db.scalar(erros.where(TentativaAcesso.email == email)) or 0
    por_ip = db.scalar(erros.where(TentativaAcesso.ip == ip)) or 0
    return por_email >= MAX_ERROS_EMAIL or por_ip >= MAX_ERROS_IP


def registrar_tentativa(db: Session, email: str, ip: str, sucesso: bool) -> None:
    db.add(TentativaAcesso(email=email, ip=ip, sucesso=sucesso, criado_em=agora()))
    if sucesso:
        # limpeza: tentativas com mais de um dia não servem para nada
        db.execute(delete(TentativaAcesso).where(TentativaAcesso.criado_em < agora() - timedelta(days=1)))
    db.commit()


def abrir_sessao(
    db: Session, usuario: Usuario, request: Request, response: Response, settings: Settings
) -> None:
    token, token_hash = novo_token()
    db.add(
        Sessao(
            usuario_id=usuario.id,
            token_hash=token_hash,
            expira_em=agora() + timedelta(days=DIAS_SESSAO),
            ultimo_uso_em=agora(),
            dispositivo=(request.headers.get("user-agent") or "")[:120] or None,
        )
    )
    db.commit()
    response.set_cookie(
        COOKIE_SESSAO,
        token,
        max_age=DIAS_SESSAO * 24 * 3600,
        httponly=True,
        secure=settings.cookie_seguro,
        samesite="lax",
        path="/",
    )


def encerrar_sessoes(db: Session, usuario: Usuario, exceto: Sessao | None = None) -> None:
    consulta = delete(Sessao).where(Sessao.usuario_id == usuario.id)
    if exceto:
        consulta = consulta.where(Sessao.id != exceto.id)
    db.execute(consulta)
    db.commit()


def apagar_cookie(response: Response, settings: Settings) -> None:
    response.delete_cookie(
        COOKIE_SESSAO, path="/", secure=settings.cookie_seguro, httponly=True, samesite="lax"
    )


def resumo(db: Session, usuario: Usuario) -> dict:
    """O que o front precisa saber logo depois do login."""
    progresso = db.scalar(select(OnboardingProgresso).where(OnboardingProgresso.usuario_id == usuario.id))
    return {
        "id": str(usuario.id),
        "nome": usuario.nome,
        "apelido": usuario.apelido,
        "email": usuario.email,
        "papel": usuario.papel,
        "tem_senha": bool(usuario.senha_hash),
        "tem_google": bool(usuario.google_sub),
        "termos_pendentes": usuario.termos_versao != TERMOS_VERSAO,
        "onboarding": {
            "etapa_atual": progresso.etapa_atual if progresso else 0,
            "concluido": bool(progresso and progresso.concluido_em),
        },
    }
