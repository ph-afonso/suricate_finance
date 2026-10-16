"""CT05: as migrações sobem e descem sem erro."""

from pathlib import Path

from alembic import command
from alembic.config import Config
from sqlalchemy import inspect

from suricate.config import get_settings
from suricate.db import get_engine

INI = Path(__file__).resolve().parent.parent / "alembic.ini"


def test_ct05_migracoes_sobem_e_descem(monkeypatch, db_url):
    monkeypatch.setenv("DATABASE_URL_DIRECT", db_url)
    get_settings.cache_clear()
    cfg = Config(str(INI))

    command.upgrade(cfg, "head")
    tabelas = inspect(get_engine(db_url)).get_table_names()
    assert "usuario" in tabelas

    command.downgrade(cfg, "base")
    assert "usuario" not in inspect(get_engine(db_url)).get_table_names()
    get_settings.cache_clear()
