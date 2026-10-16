"""Usuário do Suricate. Senha e login com Google entram no M2."""

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from suricate.models.base import Base, ComDatas


class Usuario(ComDatas, Base):
    __tablename__ = "usuario"

    nome: Mapped[str] = mapped_column(String(120))
    email: Mapped[str] = mapped_column(String(254), unique=True)
