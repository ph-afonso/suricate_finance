"""Dados fictícios do usuário 1 para o banco de desenvolvimento (tarefa #112).

Uso: DATABASE_URL_DIRECT=... SEED_SENHA=... python -m suricate.seed
Só roda com APP_ENV=development, para nunca tocar em produção ou pré-produção.
A senha de teste vem de SEED_SENHA (segredo do ambiente development no GitHub), nunca do código.
"""

import os
import sys

from sqlalchemy import select
from sqlalchemy.orm import Session

from suricate.config import get_settings
from suricate.db import get_engine
from suricate.models import Usuario
from suricate.models.base import agora
from suricate.seguranca import TERMOS_VERSAO, hash_senha

USUARIO_1 = {"nome": "Usuário 1 (fictício)", "email": "usuario1@exemplo.suricate"}


def semear(sessao: Session, senha: str | None = None) -> bool:
    """Cria o usuário 1 se ele ainda não existir. Devolve True quando criou.

    Com senha, o usuário 1 já entra com os termos aceitos; a senha é atualizada a cada execução.
    """
    usuario = sessao.scalar(select(Usuario).where(Usuario.email == USUARIO_1["email"]))
    criou = usuario is None
    if criou:
        usuario = Usuario(**USUARIO_1)
        sessao.add(usuario)
    if senha:
        usuario.senha_hash = hash_senha(senha)
        usuario.termos_versao, usuario.termos_aceitos_em = TERMOS_VERSAO, agora()
    sessao.commit()
    return criou


def main() -> None:
    settings = get_settings()
    if settings.app_env != "development":
        sys.exit(f"Seed recusado: APP_ENV={settings.app_env}. Ele só roda em development.")
    url = settings.database_url_direct or settings.database_url
    if not url:
        sys.exit("Defina DATABASE_URL_DIRECT (ou DATABASE_URL).")
    with Session(get_engine(url)) as sessao:
        criou = semear(sessao, os.environ.get("SEED_SENHA"))
        print("Usuário 1 criado." if criou else "Usuário 1 já existia.")


if __name__ == "__main__":
    main()
