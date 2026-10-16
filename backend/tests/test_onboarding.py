"""CT27 e CT28: validação das etapas, conquistas, pular, retomar e refazer (RF03, RF04)."""

import uuid

from tests.conftest import cadastrar

CONTA, CARTAO, ALUGUEL, CARRO = (str(uuid.uuid4()) for _ in range(4))

RESPOSTAS = {
    "boas_vindas": {"apelido": "Phe", "objetivo": "quitar_divida"},
    "renda": {"dia": 15, "valor_medio": 5200, "fim_de_semana": "antecipa", "atrasa": False, "outras": []},
    "contas": {
        "contas": [{"id": CONTA, "nome": "Conta Familiar", "banco": "Inter", "tipo": "familiar", "saldo": 0}]
    },
    "cartoes": {
        "cartoes": [{"id": CARTAO, "nome": "Leroy Pay", "limite": 3000, "fechamento": 1, "vencimento": 10}]
    },
    "contas_fixas": {
        "fixas": [{"id": ALUGUEL, "descricao": "Aluguel", "dia": 5, "valor": 1800, "nao_pode_atrasar": True}],
        "parcelas": [{"id": CARRO, "descricao": "Carro", "valor": 900, "total": 48, "pagas": 20}],
    },
    "familia": {
        "divide": True,
        "com_quem": "Agatha",
        "percentual_outro": 40,
        "conta_familiar_id": CONTA,
        "cartao_casal_id": CARTAO,
        "divididos": [ALUGUEL],
    },
    "objetivos": {
        "metas": ["Quitar o carro", "Reserva de emergência"],
        "limite_cartao": 1000,
        "limite_debito": 300,
    },
}


def _logado(api):
    c = api()
    cadastrar(c)
    return c


def test_ct28_as_7_etapas_dao_as_7_conquistas(api):
    c = _logado(api)
    inicio = c.get("/api/onboarding").json()
    assert inicio["etapa_atual"] == 0 and [e["status"] for e in inicio["etapas"]] == ["nao_feita"] * 7
    for i, (chave, respostas) in enumerate(RESPOSTAS.items()):
        r = c.put(f"/api/onboarding/etapas/{chave}", json=respostas)
        assert r.status_code == 200, r.text
        assert r.json()["etapa_atual"] == i + 1
    final = c.post("/api/onboarding/concluir").json()
    assert final["concluido"] and len(final["conquistas"]) == 7
    assert final["etapas"][4]["respostas"]["parcelas"][0]["pagas"] == 20
    eu = c.get("/api/auth/eu").json()
    assert eu["apelido"] == "Phe" and eu["onboarding"]["concluido"]


def test_ct28_pular_nao_da_conquista_e_retoma_na_proxima(api):
    c = _logado(api)
    c.put("/api/onboarding/etapas/boas_vindas", json=RESPOSTAS["boas_vindas"])
    r = c.post("/api/onboarding/etapas/renda/pular").json()
    assert r["etapa_atual"] == 2 and r["etapas"][1]["status"] == "pulada"
    assert r["conquistas"] == ["Primeiro passo"]
    # sai e volta: retoma na etapa 3 (RF04)
    assert c.get("/api/onboarding").json()["etapa_atual"] == 2


def test_ct28_refazer_mantem_a_conquista_e_troca_as_respostas(api):
    c = _logado(api)
    c.put("/api/onboarding/etapas/cartoes", json=RESPOSTAS["cartoes"])
    novo = {"cartoes": [{"id": CARTAO, "nome": "Nubank", "limite": 5000, "fechamento": 3, "vencimento": 12}]}
    r = c.put("/api/onboarding/etapas/cartoes", json=novo).json()
    assert r["etapas"][3]["respostas"]["cartoes"][0]["nome"] == "Nubank"
    assert r["conquistas"] == ["Vigia do cartão"]
    # pular uma etapa já concluída não apaga o que foi feito
    r = c.post("/api/onboarding/etapas/cartoes/pular").json()
    assert r["etapas"][3]["status"] == "concluida"


def _erro(c, chave, respostas):
    r = c.put(f"/api/onboarding/etapas/{chave}", json=respostas)
    assert r.status_code == 422, r.text
    return r.json()["detail"]


def test_ct27_respostas_invalidas(api):
    c = _logado(api)
    renda = RESPOSTAS["renda"]
    assert _erro(c, "renda", {**renda, "dia": 32})[0]["loc"][-1] == "dia"
    assert _erro(c, "renda", {**renda, "atrasa": True})  # atrasa sem dizer quantos dias
    parcela = {"id": CARRO, "descricao": "Carro", "valor": 900, "total": 10, "pagas": 11}
    assert _erro(c, "contas_fixas", {"fixas": [], "parcelas": [parcela]})
    assert _erro(c, "familia", {**RESPOSTAS["familia"], "percentual_outro": 120})
    assert _erro(c, "boas_vindas", {"apelido": "Phe", "objetivo": "outro"})  # "Outros" sem texto
    assert c.get("/api/onboarding").json()["conquistas"] == []
    assert c.put("/api/onboarding/etapas/inventada", json={}).status_code == 404


def test_ct27_familia_so_aponta_para_itens_que_existem(api):
    c = _logado(api)
    detalhe = _erro(c, "familia", RESPOSTAS["familia"])  # contas, cartões e fixas ainda não cadastrados
    assert {d["loc"][0] for d in detalhe} == {"conta_familiar_id", "cartao_casal_id", "divididos"}
    for chave in ("contas", "cartoes", "contas_fixas"):
        c.put(f"/api/onboarding/etapas/{chave}", json=RESPOSTAS[chave])
    assert c.put("/api/onboarding/etapas/familia", json=RESPOSTAS["familia"]).status_code == 200


def test_familia_sem_divisao_limpa_os_campos(api):
    c = _logado(api)
    r = c.put("/api/onboarding/etapas/familia", json={"divide": False, "com_quem": "Alguém", "divididos": []})
    assert r.json()["etapas"][5]["respostas"]["com_quem"] is None
