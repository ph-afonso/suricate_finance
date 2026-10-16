"""GET /api/status: dados da página de status (RF46). Público e sem dados de usuários (CT15)."""

from typing import Annotated

from fastapi import APIRouter, Depends

from suricate.config import Settings, get_settings
from suricate.services.status import Status, montar_status

router = APIRouter(prefix="/api", tags=["status"])


@router.get("/status", response_model=Status)
def status(settings: Annotated[Settings, Depends(get_settings)]) -> Status:
    return montar_status(settings)
