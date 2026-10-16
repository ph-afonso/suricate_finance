"""Configurações lidas das variáveis de ambiente (seção 6 da documentação técnica do M1)."""

from functools import lru_cache
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict

from suricate import __version__

Ambiente = Literal["production", "staging", "development", "test"]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_env: Ambiente = "development"
    app_version: str = __version__
    database_url: str | None = None
    database_url_direct: str | None = None

    # Página de status (RF46): "Nome=https://endereço" separados por ";"
    status_ambientes: str = ""
    vercel_api_token: str | None = None
    vercel_project_id: str | None = None
    vercel_automation_bypass_secret: str | None = None
    github_repo: str = "ph-afonso/suricate_finance"
    github_status_token: str | None = None

    # Acesso (M2, seção 9 da documentação técnica do M2)
    app_url: str = "http://localhost:9001"  # endereço público do app, para links de e-mail e o Google
    admin_emails: str = ""  # e-mails separados por vírgula que recebem o papel "admin"
    google_client_id: str | None = None
    google_client_secret: str | None = None
    smtp_host: str | None = None
    smtp_porta: int = 587
    smtp_usuario: str | None = None
    smtp_senha: str | None = None
    email_remetente: str | None = None
    github_sugestoes_token: str | None = None

    @property
    def ambientes_monitorados(self) -> list[tuple[str, str]]:
        pares = []
        for parte in self.status_ambientes.split(";"):
            nome, _, url = parte.partition("=")
            if nome.strip() and url.strip():
                pares.append((nome.strip(), url.strip().rstrip("/")))
        return pares

    @property
    def admins(self) -> set[str]:
        return {e.strip().lower() for e in self.admin_emails.split(",") if e.strip()}

    @property
    def cookie_seguro(self) -> bool:
        return self.app_url.startswith("https://")

    @property
    def google_configurado(self) -> bool:
        return bool(self.google_client_id and self.google_client_secret)

    @property
    def em_producao(self) -> bool:
        return self.app_env == "production"


@lru_cache
def get_settings() -> Settings:
    return Settings()
