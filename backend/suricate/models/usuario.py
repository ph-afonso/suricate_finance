"""Usuário do Suricate (M1) com o acesso do M2: senha, Google, aceite dos termos e papel."""

from datetime import datetime

from sqlalchemy import Boolean, DateTime, String, false
from sqlalchemy.orm import Mapped, mapped_column

from suricate.models.base import Base, ComDatas


class Usuario(ComDatas, Base):
    __tablename__ = "usuario"

    nome: Mapped[str] = mapped_column(String(120))
    email: Mapped[str] = mapped_column(String(254), unique=True)  # sempre em minúsculas
    apelido: Mapped[str | None] = mapped_column(String(40))
    senha_hash: Mapped[str | None] = mapped_column(String(255))  # nulo para quem só entra com Google
    google_sub: Mapped[str | None] = mapped_column(String(255), unique=True)
    email_verificado: Mapped[bool] = mapped_column(Boolean, default=False, server_default=false())
    termos_versao: Mapped[str | None] = mapped_column(String(20))
    termos_aceitos_em: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    papel: Mapped[str] = mapped_column(String(10), default="usuario", server_default="usuario")  # ou "admin"
