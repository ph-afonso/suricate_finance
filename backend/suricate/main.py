"""Cria a aplicação FastAPI. Todas as rotas ficam sob /api, que é onde a Vercel entrega a função."""

from fastapi import FastAPI

from suricate import __version__
from suricate.config import get_settings
from suricate.routes import health, status


def create_app() -> FastAPI:
    settings = get_settings()
    docs = not settings.em_producao  # a documentação automática não fica exposta em produção (CT04)
    app = FastAPI(
        title="Suricate Finance",
        version=__version__,
        docs_url="/api/docs" if docs else None,
        redoc_url=None,
        openapi_url="/api/openapi.json" if docs else None,
    )
    app.include_router(health.router)
    app.include_router(status.router)
    return app


app = create_app()
