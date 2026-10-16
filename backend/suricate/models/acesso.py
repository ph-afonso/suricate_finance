"""Sessões, links de redefinição de senha e tentativas de login (seção 3 da documentação do M2)."""

from datetime import datetime

from sqlalchemy import Boolean, DateTime, Index, String
from sqlalchemy.orm import Mapped, mapped_column

from suricate.models.base import Base, ComDatas, DoUsuario


class Sessao(ComDatas, DoUsuario, Base):
    __tablename__ = "sessao"

    token_hash: Mapped[str] = mapped_column(String(64), unique=True)  # SHA-256 do token do cookie
    expira_em: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    ultimo_uso_em: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    dispositivo: Mapped[str | None] = mapped_column(String(120))


class RedefinicaoSenha(ComDatas, DoUsuario, Base):
    __tablename__ = "redefinicao_senha"

    token_hash: Mapped[str] = mapped_column(String(64), unique=True)
    expira_em: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    usado_em: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class TentativaAcesso(ComDatas, Base):
    """Uma tentativa de login. Sem chave para usuário: o e-mail tentado pode nem existir."""

    __tablename__ = "tentativa_acesso"
    __table_args__ = (
        Index("ix_tentativa_acesso_email_criado_em", "email", "criado_em"),
        Index("ix_tentativa_acesso_ip_criado_em", "ip", "criado_em"),
    )

    email: Mapped[str] = mapped_column(String(254))
    ip: Mapped[str] = mapped_column(String(45))
    sucesso: Mapped[bool] = mapped_column(Boolean)
