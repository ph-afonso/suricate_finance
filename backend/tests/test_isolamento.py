"""CT26 e CT29: cada usuário vê só os próprios dados (RF02) e excluir a conta apaga tudo (D3)."""

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from suricate.db import get_engine
from suricate.models import OnboardingProgresso, Sessao, Sugestao, Usuario
from tests.conftest import cadastrar
from tests.test_onboarding import RESPOSTAS


def test_ct26_b_nao_ve_nem_altera_o_cadastro_de_a(api):
    a, b = api(), api()
    cadastrar(a)
    cadastrar(b)
    a.put("/api/onboarding/etapas/cartoes", json=RESPOSTAS["cartoes"])

    visto_por_b = b.get("/api/onboarding").json()
    assert visto_por_b["etapas"][3]["respostas"] is None
    b.put("/api/onboarding/etapas/cartoes", json={"cartoes": []})
    assert a.get("/api/onboarding").json()["etapas"][3]["respostas"]["cartoes"][0]["nome"] == "Leroy Pay"


def test_ct26_b_nao_ve_as_sugestoes_de_a(api, db_url):
    a, b = api(), api()
    id_a = cadastrar(a)["id"]
    cadastrar(b)
    with Session(get_engine(db_url)) as s:
        import uuid

        s.add(Sugestao(usuario_id=uuid.UUID(id_a), codigo="S-AAAA", tipo="ideia", titulo="Da Ana"))
        s.commit()
    assert [x["codigo"] for x in a.get("/api/sugestoes").json()] == ["S-AAAA"]
    assert b.get("/api/sugestoes").json() == []


def test_ct29_excluir_conta_apaga_tudo(api, db_url):
    c = api()
    cadastrar(c, senha="senha-forte-123")
    c.put("/api/onboarding/etapas/boas_vindas", json=RESPOSTAS["boas_vindas"])
    assert c.request("DELETE", "/api/usuario", json={"senha": "errada-errada"}).status_code == 403
    assert c.request("DELETE", "/api/usuario", json={"senha": "senha-forte-123"}).status_code == 204
    assert c.get("/api/auth/eu").status_code == 401
    with Session(get_engine(db_url)) as s:
        for tabela in (Usuario, Sessao, OnboardingProgresso):
            assert s.scalar(select(func.count()).select_from(tabela)) == 0


def test_perfil_editar(api):
    c = api()
    cadastrar(c)
    r = c.patch("/api/usuario", json={"nome": "  Phelipe  ", "apelido": "Phe"})
    assert r.json()["nome"] == "Phelipe" and r.json()["apelido"] == "Phe"
    assert c.patch("/api/usuario", json={"apelido": ""}).status_code == 422
