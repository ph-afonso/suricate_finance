"""Cria a aplicação FastAPI. Todas as rotas ficam sob /api, que é onde a Vercel entrega a função."""

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from suricate import __version__
from suricate.config import get_settings
from suricate.routes import auth, health, onboarding, status, sugestoes, usuario
from suricate.seguranca import CABECALHO_CSRF

METODOS_QUE_ALTERAM = {"POST", "PUT", "PATCH", "DELETE"}


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

    @app.middleware("http")
    async def protecao_csrf(request: Request, chamar_rota):
        # Outro site não consegue enviar este cabeçalho sem CORS, e a API não libera CORS (CT23)
        if request.method in METODOS_QUE_ALTERAM and request.headers.get(CABECALHO_CSRF) != "1":
            return JSONResponse({"detail": "Requisição recusada."}, status_code=403)
        return await chamar_rota(request)

    for modulo in (health, status, auth, onboarding, usuario, sugestoes):
        app.include_router(modulo.router)
    return app


app = create_app()
