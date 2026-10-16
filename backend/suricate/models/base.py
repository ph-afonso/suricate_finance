"""Convenções de todas as tabelas: id UUID, criado_em e atualizado_em."""

import uuid
from datetime import UTC, datetime

from sqlalchemy import DateTime, ForeignKey, MetaData, Uuid, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

# Nomes previsíveis para índices e restrições, para as migrações ficarem estáveis
NOMES = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}


class Base(DeclarativeBase):
    metadata = MetaData(naming_convention=NOMES)


class ComDatas:
    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    criado_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    atualizado_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class DoUsuario:
    """Dado que pertence a um usuário (RF02): some junto quando a conta é excluída."""

    usuario_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("usuario.id", ondelete="CASCADE"), index=True)


def agora() -> datetime:
    return datetime.now(UTC)


def em_utc(momento: datetime) -> datetime:
    """O SQLite dos testes devolve datas sem fuso; o Postgres devolve com fuso. Aqui ficam iguais."""
    return momento if momento.tzinfo else momento.replace(tzinfo=UTC)
