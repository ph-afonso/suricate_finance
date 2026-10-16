"""Apaga as contas criadas pelos testes de ponta a ponta (seção 10 da documentação técnica do M2).

Uso: DATABASE_URL_DIRECT=... python -m suricate.limpeza_e2e
Só roda com APP_ENV=development e só apaga e-mails e2e+...@teste.suricate.app com mais de 1 hora,
para não atrapalhar um teste em andamento. O ON DELETE CASCADE leva junto os dados de cada conta.
"""

import sys
from datetime import timedelta

from sqlalchemy import delete
from sqlalchemy.orm import Session

from suricate.config import get_settings
from suricate.db import get_engine
from suricate.models import Usuario
from suricate.models.base import agora

PADRAO = "e2e+%@teste.suricate.app"


def limpar(sessao: Session) -> int:
    resultado = sessao.execute(
        delete(Usuario).where(Usuario.email.like(PADRAO), Usuario.criado_em < agora() - timedelta(hours=1))
    )
    sessao.commit()
    return resultado.rowcount


def main() -> None:
    settings = get_settings()
    if settings.app_env != "development":
        sys.exit(f"Limpeza recusada: APP_ENV={settings.app_env}. Ela só roda em development.")
    url = settings.database_url_direct or settings.database_url
    if not url:
        sys.exit("Defina DATABASE_URL_DIRECT (ou DATABASE_URL).")
    with Session(get_engine(url)) as sessao:
        print(f"Contas de teste apagadas: {limpar(sessao)}")


if __name__ == "__main__":
    main()
