"""Progresso do cadastro guiado do Suri (RF03, RF04).

As respostas ficam em JSON por etapa (decisão D1): cada módulo seguinte importa o que precisa
para as próprias tabelas.
"""

from datetime import datetime
from typing import Any

from sqlalchemy import JSON, DateTime, Integer, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from suricate.models.base import Base, ComDatas, DoUsuario


class OnboardingProgresso(ComDatas, DoUsuario, Base):
    __tablename__ = "onboarding_progresso"
    __table_args__ = (UniqueConstraint("usuario_id"),)  # um cadastro guiado por usuário

    etapa_atual: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    # {"renda": {"status": "concluida" | "pulada", "versao": 1, "respostas": {...}, "atualizado_em": "..."}}
    etapas: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    conquistas: Mapped[list[str]] = mapped_column(JSON, default=list)
    concluido_em: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
