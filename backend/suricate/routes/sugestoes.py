"""Aba Sugestões (#106): cria a issue no GitHub e lista as sugestões da pessoa com o status."""

from typing import Annotated, Literal

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, StringConstraints

from suricate.deps import Banco, Config, UsuarioAtivo
from suricate.models import Sugestao
from suricate.services import sugestoes

router = APIRouter(prefix="/api/sugestoes", tags=["sugestões"])


class NovaSugestao(BaseModel):
    tipo: Literal["melhoria", "problema", "ideia"]
    titulo: Annotated[str, StringConstraints(strip_whitespace=True, min_length=3, max_length=100)]
    descricao: Annotated[str, StringConstraints(strip_whitespace=True, min_length=10, max_length=2000)]
    tela: Annotated[str, StringConstraints(strip_whitespace=True, max_length=120)] | None = None


def _visao(s: Sugestao) -> dict:
    return {
        "codigo": s.codigo,
        "tipo": s.tipo,
        "titulo": s.titulo,
        "tela": s.tela,
        "status": s.status,
        "criada_em": s.criado_em.isoformat(),
    }


@router.post("", status_code=status.HTTP_201_CREATED)
def criar(dados: NovaSugestao, usuario: UsuarioAtivo, db: Banco, settings: Config) -> dict:
    try:
        s = sugestoes.criar(db, settings, usuario, dados.tipo, dados.titulo, dados.descricao, dados.tela)
    except sugestoes.LimiteDiario as erro:
        raise HTTPException(
            status.HTTP_429_TOO_MANY_REQUESTS, "Você já mandou 5 sugestões hoje. Volte amanhã!"
        ) from erro
    except sugestoes.GitHubIndisponivel as erro:
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE, "Não consegui enviar agora. Tente de novo daqui a pouco."
        ) from erro
    return _visao(s)


@router.get("")
def listar(usuario: UsuarioAtivo, db: Banco, settings: Config) -> list[dict]:
    return [_visao(s) for s in sugestoes.listar(db, settings, usuario)]
