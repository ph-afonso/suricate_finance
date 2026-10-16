"""A limpeza diária só apaga contas de teste antigas, nunca contas de verdade."""

from datetime import timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from suricate.db import get_engine
from suricate.limpeza_e2e import limpar
from suricate.models import Base, Usuario
from suricate.models.base import agora


def test_apaga_so_contas_de_teste_com_mais_de_uma_hora(db_url):
    engine = get_engine(db_url)
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    antes = agora() - timedelta(hours=2)
    try:
        with Session(engine) as s:
            s.add_all(
                [
                    Usuario(nome="Velha", email="e2e+velha@teste.suricate.app", criado_em=antes),
                    Usuario(nome="Recente", email="e2e+recente@teste.suricate.app", criado_em=agora()),
                    Usuario(nome="Real", email="pessoa@teste.suricate.app", criado_em=antes),
                ]
            )
            s.commit()
            assert limpar(s) == 1
            assert set(s.scalars(select(Usuario.nome))) == {"Recente", "Real"}
    finally:
        Base.metadata.drop_all(engine)
