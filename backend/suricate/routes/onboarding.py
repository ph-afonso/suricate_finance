"""Rotas do cadastro guiado (RF03, RF04). Cada usuário só enxerga o próprio progresso (RF02)."""

from typing import Annotated, Any

from fastapi import APIRouter, Body, HTTPException, status
from fastapi.exceptions import RequestValidationError
from pydantic import ValidationError

from suricate.deps import Banco, UsuarioAtivo
from suricate.services import onboarding

router = APIRouter(prefix="/api/onboarding", tags=["cadastro guiado"])


@router.get("")
def ver(usuario: UsuarioAtivo, db: Banco) -> dict[str, Any]:
    progresso = onboarding.progresso_de(db, usuario)
    db.commit()
    return onboarding.visao(progresso)


@router.put("/etapas/{chave}")
def salvar(
    chave: str, usuario: UsuarioAtivo, db: Banco, respostas: Annotated[dict[str, Any], Body()]
) -> dict[str, Any]:
    try:
        progresso = onboarding.salvar_etapa(db, usuario, chave, respostas)
    except onboarding.EtapaInexistente as erro:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Etapa não encontrada.") from erro
    except ValidationError as erro:
        db.rollback()
        raise RequestValidationError(erro.errors(include_url=False)) from erro
    return onboarding.visao(progresso)


@router.post("/etapas/{chave}/pular")
def pular(chave: str, usuario: UsuarioAtivo, db: Banco) -> dict[str, Any]:
    try:
        progresso = onboarding.pular_etapa(db, usuario, chave)
    except onboarding.EtapaInexistente as erro:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Etapa não encontrada.") from erro
    return onboarding.visao(progresso)


@router.post("/concluir")
def concluir(usuario: UsuarioAtivo, db: Banco) -> dict[str, Any]:
    return onboarding.visao(onboarding.concluir(db, usuario))
