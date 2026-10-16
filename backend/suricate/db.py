"""Acesso ao Postgres do Neon.

Cada requisição pode cair numa função nova na Vercel, então não há pool próprio: a conexão
usa o pool do Neon (PgBouncer) e o SQLAlchemy roda com NullPool.
"""

from collections.abc import Iterator
from functools import lru_cache

from sqlalchemy import Engine, create_engine, event, text
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import NullPool


def normalizar_url(url: str) -> str:
    """O Neon entrega `postgres://` ou `postgresql://`; o SQLAlchemy precisa do driver psycopg 3."""
    for prefixo in ("postgres://", "postgresql://"):
        if url.startswith(prefixo):
            return "postgresql+psycopg://" + url[len(prefixo) :]
    return url


@lru_cache
def get_engine(url: str) -> Engine:
    url = normalizar_url(url)
    connect_args = {"connect_timeout": 5} if url.startswith("postgresql") else {}
    engine = create_engine(url, poolclass=NullPool, connect_args=connect_args)
    if url.startswith("sqlite"):
        # o SQLite só respeita ON DELETE CASCADE com as chaves estrangeiras ligadas
        event.listen(engine, "connect", lambda con, _: con.execute("pragma foreign_keys=on"))
    return engine


def verificar_banco(url: str) -> None:
    """Levanta exceção se o banco não responder."""
    with get_engine(url).connect() as conexao:
        conexao.execute(text("select 1"))


def sessao(url: str) -> Iterator[Session]:
    fabrica = sessionmaker(bind=get_engine(url), expire_on_commit=False)
    with fabrica() as s:
        yield s
