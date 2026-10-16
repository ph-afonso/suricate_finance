"""Seed do usuário 1: cria uma vez e não duplica."""

from pathlib import Path

from alembic import command
from alembic.config import Config
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from suricate.config import get_settings
from suricate.db import get_engine
from suricate.models import Usuario
from suricate.seed import semear

INI = Path(__file__).resolve().parent.parent / "alembic.ini"


def test_seed_cria_o_usuario_1_uma_vez(monkeypatch, db_url):
    monkeypatch.setenv("DATABASE_URL_DIRECT", db_url)
    get_settings.cache_clear()
    command.upgrade(Config(str(INI)), "head")
    try:
        with Session(get_engine(db_url)) as s:
            assert semear(s) is True
            assert semear(s) is False
            assert s.scalar(select(func.count()).select_from(Usuario)) == 1
    finally:
        command.downgrade(Config(str(INI)), "base")
        get_settings.cache_clear()
