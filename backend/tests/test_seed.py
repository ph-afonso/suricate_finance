"""Seed do usuário 1: cria uma vez e não duplica."""

from pathlib import Path

from alembic import command
from alembic.config import Config
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from suricate.config import get_settings
from suricate.db import get_engine
from suricate.models import Usuario
from suricate.seed import USUARIO_1, semear
from suricate.seguranca import senha_confere

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
            assert semear(s, "senha-de-teste-1") is False
            usuario = s.scalar(select(Usuario).where(Usuario.email == USUARIO_1["email"]))
            assert senha_confere("senha-de-teste-1", usuario.senha_hash) and usuario.termos_versao
    finally:
        command.downgrade(Config(str(INI)), "base")
        get_settings.cache_clear()
