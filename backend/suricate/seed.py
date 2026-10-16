"""Dados fictícios do usuário 1 para o banco de desenvolvimento (tarefa #112).

Uso: DATABASE_URL_DIRECT=... python -m suricate.seed
Só roda com APP_ENV=development, para nunca tocar em produção ou pré-produção.
"""

import sys

from sqlalchemy import select
from sqlalchemy.orm import Session

from suricate.config import get_settings
from suricate.db import get_engine
from suricate.models import Usuario

USUARIO_1 = {"nome": "Usuário 1 (fictício)", "email": "usuario1@exemplo.suricate"}


def semear(sessao: Session) -> bool:
    """Cria o usuário 1 se ele ainda não existir. Devolve True quando criou."""
    if sessao.scalar(select(Usuario).where(Usuario.email == USUARIO_1["email"])):
        return False
    sessao.add(Usuario(**USUARIO_1))
    sessao.commit()
    return True


def main() -> None:
    settings = get_settings()
    if settings.app_env != "development":
        sys.exit(f"Seed recusado: APP_ENV={settings.app_env}. Ele só roda em development.")
    url = settings.database_url_direct or settings.database_url
    if not url:
        sys.exit("Defina DATABASE_URL_DIRECT (ou DATABASE_URL).")
    with Session(get_engine(url)) as sessao:
        print("Usuário 1 criado." if semear(sessao) else "Usuário 1 já existia.")


if __name__ == "__main__":
    main()
