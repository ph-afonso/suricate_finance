"""CT30: sugestões viram issues sem dados pessoais, com limite diário (#106). GitHub simulado."""

import json

import httpx
import pytest

from suricate.services import sugestoes
from tests.conftest import cadastrar

NOVA = {
    "tipo": "melhoria",
    "titulo": "Modo noturno no relatório",
    "descricao": "Seria ótimo ter o modo noturno.",
}


@pytest.fixture
def github(monkeypatch):
    """Troca o cliente do GitHub por um falso que guarda as chamadas."""
    chamadas = []
    issues = {}

    def responder(request: httpx.Request) -> httpx.Response:
        chamadas.append(request)
        if request.url.path.endswith("/milestones"):
            return httpx.Response(200, json=[{"number": 12, "title": "Sugestões dos usuários"}])
        if request.method == "POST":
            numero = 200 + len(issues)
            issues[numero] = {"state": "open", "labels": [{"name": "triagem"}], "milestone": {"title": "x"}}
            return httpx.Response(201, json={"number": numero})
        numero = int(request.url.path.rsplit("/", 1)[1])
        return httpx.Response(200, json=issues[numero])

    original = sugestoes._github

    def falso(settings):
        cliente = original(settings)
        cliente._transport = httpx.MockTransport(responder)
        return cliente

    monkeypatch.setattr(sugestoes, "_github", falso)
    return chamadas, issues


def test_ct30_cria_issue_anonima_com_labels_e_milestone(api, github):
    chamadas, _ = github
    c = api(github_sugestoes_token="token-teste")
    pessoa = cadastrar(c)
    texto = "Meu e-mail é ana@gmail.com, cel (11) 98765-4321, CPF 123.456.789-09, cartão 4111 1111 1111 1111."
    r = c.post("/api/sugestoes", json={**NOVA, "descricao": texto, "tela": "/cartoes"})
    assert r.status_code == 201, r.text
    assert r.json()["status"] == "recebida" and r.json()["codigo"].startswith("S-")

    corpo = json.loads(chamadas[-1].content)
    assert corpo["labels"] == ["sugestao-usuario", "triagem"] and corpo["milestone"] == 12
    assert corpo["title"] == f"[Sugestão {r.json()['codigo']}] {NOVA['titulo']}"
    for dado in (
        "ana@gmail.com",
        "98765-4321",
        "123.456.789-09",
        "4111 1111",
        pessoa["email"],
        pessoa["nome"],
    ):
        assert dado not in corpo["body"]
    assert "[e-mail removido]" in corpo["body"] and "[CPF removido]" in corpo["body"]


def test_ct30_limite_de_5_por_dia(api, github):
    c = api(github_sugestoes_token="token-teste")
    cadastrar(c)
    for _ in range(5):
        assert c.post("/api/sugestoes", json=NOVA).status_code == 201
    assert c.post("/api/sugestoes", json=NOVA).status_code == 429


def test_sem_token_responde_503(api):
    c = api()
    cadastrar(c)
    assert c.post("/api/sugestoes", json=NOVA).status_code == 503


@pytest.mark.parametrize(
    ("issue", "status"),
    [
        (
            {
                "state": "open",
                "labels": [{"name": "triagem"}],
                "milestone": {"title": "Sugestões dos usuários"},
            },
            "recebida",
        ),
        ({"state": "open", "labels": [], "milestone": {"title": "M5 · Cartões"}}, "planejada"),
        ({"state": "closed", "state_reason": "completed"}, "entregue"),
        ({"state": "closed", "state_reason": "not_planned"}, "nao_sera_feita"),
    ],
)
def test_status_lido_do_github(issue, status):
    assert sugestoes.status_da_issue(issue) == status
