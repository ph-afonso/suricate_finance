"""Dependências das rotas: banco, IP e o usuário logado (RF02)."""

from collections.abc import Iterator
from datetime import timedelta
from typing import Annotated

from fastapi import Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from suricate.config import Settings, get_settings
from suricate.db import sessao
from suricate.models import Sessao, Usuario
from suricate.models.base import agora, em_utc
from suricate.seguranca import COOKIE_SESSAO, DIAS_SESSAO, TERMOS_VERSAO, hash_token

Config = Annotated[Settings, Depends(get_settings)]


def get_db(settings: Config) -> Iterator[Session]:
    if not settings.database_url:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Banco de dados não configurado.")
    yield from sessao(settings.database_url)


Banco = Annotated[Session, Depends(get_db)]


def ip_do_cliente(request: Request) -> str:
    # Na Vercel, o primeiro endereço de X-Forwarded-For é o do cliente
    encaminhado = request.headers.get("x-forwarded-for", "")
    return (encaminhado.split(",")[0].strip() or (request.client.host if request.client else "")) or "?"


def _sessao_do_cookie(request: Request, db: Session) -> Sessao | None:
    token = request.cookies.get(COOKIE_SESSAO)
    if not token:
        return None
    registro = db.scalar(select(Sessao).where(Sessao.token_hash == hash_token(token)))
    if not registro or em_utc(registro.expira_em) <= agora():
        return None
    # renova a validade com o uso, no máximo uma vez por hora para não escrever a cada requisição
    if agora() - em_utc(registro.ultimo_uso_em) > timedelta(hours=1):
        registro.ultimo_uso_em = agora()
        registro.expira_em = agora() + timedelta(days=DIAS_SESSAO)
        db.commit()
    return registro


def usuario_logado(request: Request, db: Banco) -> Usuario:
    """Usuário dono da sessão. Sem sessão válida: 401. Toda rota de dados depende disto (RF02)."""
    registro = _sessao_do_cookie(request, db)
    usuario = db.get(Usuario, registro.usuario_id) if registro else None
    if not usuario:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Entre na sua conta para continuar.")
    request.state.sessao = registro
    return usuario


UsuarioLogado = Annotated[Usuario, Depends(usuario_logado)]


def usuario_com_termos(usuario: UsuarioLogado) -> Usuario:
    """Quem entrou com Google precisa aceitar os termos antes de usar o app."""
    if usuario.termos_versao != TERMOS_VERSAO:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Aceite os termos de uso para continuar.")
    return usuario


UsuarioAtivo = Annotated[Usuario, Depends(usuario_com_termos)]
