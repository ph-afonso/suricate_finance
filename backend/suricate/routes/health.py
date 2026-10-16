"""GET /api/health: prova que a API e o banco estão no ar (CT01–CT03)."""

from typing import Annotated, Literal

from fastapi import APIRouter, Depends, Response, status
from pydantic import BaseModel

from suricate.config import Settings, get_settings
from suricate.db import verificar_banco

router = APIRouter(prefix="/api", tags=["saúde"])


class Saude(BaseModel):
    status: Literal["ok", "erro"]
    ambiente: str
    versao: str
    banco: Literal["ok", "indisponível", "não configurado"]


@router.get("/health", response_model=Saude)
def health(response: Response, settings: Annotated[Settings, Depends(get_settings)]) -> Saude:
    if not settings.database_url:
        banco = "não configurado"
    else:
        try:
            verificar_banco(settings.database_url)
            banco = "ok"
        except Exception:  # qualquer falha de conexão vira "indisponível", sem expor detalhes
            banco = "indisponível"
    if banco != "ok":
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    return Saude(
        status="ok" if banco == "ok" else "erro",
        ambiente=settings.app_env,
        versao=settings.app_version,
        banco=banco,
    )
