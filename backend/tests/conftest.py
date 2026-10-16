"""Fixtures da API.

O banco de teste vem de TEST_DATABASE_URL (Postgres na pipeline). Sem ela, usa um SQLite temporário,
para os testes rodarem em qualquer máquina.
"""

import os
from collections.abc import Callable, Iterator

import pytest
from fastapi.testclient import TestClient

from suricate.config import Settings, get_settings
from suricate.db import get_engine
from suricate.main import create_app


@pytest.fixture
def db_url(tmp_path) -> str:
    return os.environ.get("TEST_DATABASE_URL") or f"sqlite+pysqlite:///{tmp_path / 'teste.db'}"


@pytest.fixture
def cliente(monkeypatch) -> Iterator[Callable[..., TestClient]]:
    """Fábrica de clientes: cada teste escolhe as variáveis de ambiente da API."""

    def fabricar(**env: str) -> TestClient:
        for chave in ("APP_ENV", "APP_VERSION", "DATABASE_URL", "DATABASE_URL_DIRECT"):
            monkeypatch.delenv(chave, raising=False)
        for chave, valor in env.items():
            monkeypatch.setenv(chave.upper(), valor)
        get_settings.cache_clear()
        app = create_app()
        app.dependency_overrides[get_settings] = lambda: Settings(_env_file=None)
        return TestClient(app)

    yield fabricar
    get_settings.cache_clear()
    get_engine.cache_clear()
