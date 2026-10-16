"""Fixtures da API.

O banco de teste vem de TEST_DATABASE_URL (Postgres na pipeline). Sem ela, usa um SQLite temporário,
para os testes rodarem em qualquer máquina.
"""

import os
import uuid
from collections.abc import Callable, Iterator

import pytest
from fastapi.testclient import TestClient

from suricate.config import Settings, get_settings
from suricate.db import get_engine
from suricate.main import create_app
from suricate.models import Base
from suricate.services import email

VARIAVEIS = (
    "APP_ENV",
    "APP_VERSION",
    "APP_URL",
    "DATABASE_URL",
    "DATABASE_URL_DIRECT",
    "ADMIN_EMAILS",
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
    "SMTP_HOST",
    "GITHUB_SUGESTOES_TOKEN",
)


@pytest.fixture
def db_url(tmp_path) -> str:
    return os.environ.get("TEST_DATABASE_URL") or f"sqlite+pysqlite:///{tmp_path / 'teste.db'}"


@pytest.fixture
def cliente(monkeypatch) -> Iterator[Callable[..., TestClient]]:
    """Fábrica de clientes: cada teste escolhe as variáveis de ambiente da API."""

    def fabricar(**env: str) -> TestClient:
        for chave in VARIAVEIS:
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


@pytest.fixture
def api(cliente, db_url) -> Iterator[Callable[..., TestClient]]:
    """Clientes da API com as tabelas criadas e o cabeçalho X-Suricate; cada um com seus cookies."""
    engine = get_engine(db_url)
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    email.CAIXA_DE_SAIDA.clear()

    def novo(**env: str) -> TestClient:
        c = cliente(database_url=db_url, app_env="test", **env)
        c.headers["X-Suricate"] = "1"
        return c

    yield novo
    Base.metadata.drop_all(engine)


def novo_email() -> str:
    return f"pessoa-{uuid.uuid4().hex[:8]}@teste.suricate.app"


def cadastrar(c: TestClient, email_: str | None = None, senha: str = "senha-forte-123") -> dict:
    r = c.post(
        "/api/auth/cadastro",
        json={
            "nome": "Pessoa de Teste",
            "email": email_ or novo_email(),
            "senha": senha,
            "aceite_termos": True,
        },
    )
    assert r.status_code == 201, r.text
    return r.json()
