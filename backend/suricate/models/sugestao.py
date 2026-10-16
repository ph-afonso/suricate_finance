"""Sugestões enviadas pela aba Sugestões (#106). O texto completo fica só na issue do GitHub."""

from datetime import datetime

from sqlalchemy import DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from suricate.models.base import Base, ComDatas, DoUsuario


class Sugestao(ComDatas, DoUsuario, Base):
    __tablename__ = "sugestao"

    codigo: Mapped[str] = mapped_column(String(10), unique=True)  # ex.: S-7F3K, sem dado pessoal
    tipo: Mapped[str] = mapped_column(String(10))  # melhoria | problema | ideia
    titulo: Mapped[str] = mapped_column(String(120))
    tela: Mapped[str | None] = mapped_column(String(120))
    issue_numero: Mapped[int | None] = mapped_column(Integer)
    status: Mapped[str] = mapped_column(String(20), default="recebida", server_default="recebida")
    status_lido_em: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
