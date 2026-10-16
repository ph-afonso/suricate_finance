"""CT05: as migrações sobem e descem sem erro, e batem com os modelos."""

from pathlib import Path

from alembic import command
from alembic.config import Config
from sqlalchemy import inspect

from suricate.config import get_settings
from suricate.db import get_engine

INI = Path(__file__).resolve().parent.parent / "alembic.ini"
TABELAS = {"usuario", "sessao", "redefinicao_senha", "tentativa_acesso", "onboarding_progresso", "sugestao"}


def test_ct05_migracoes_sobem_e_descem(monkeypatch, db_url):
    monkeypatch.setenv("DATABASE_URL_DIRECT", db_url)
    get_settings.cache_clear()
    cfg = Config(str(INI))

    command.upgrade(cfg, "head")
    try:
        assert set(inspect(get_engine(db_url)).get_table_names()) >= TABELAS
        command.check(cfg)  # falha se algum modelo mudou sem migração
    finally:
        command.downgrade(cfg, "base")
    assert not TABELAS & set(inspect(get_engine(db_url)).get_table_names())
    get_settings.cache_clear()
