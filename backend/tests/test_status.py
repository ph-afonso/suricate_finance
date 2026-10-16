"""CT14 e CT15: página de status com os três ambientes, sem dados de usuários."""

import json

import httpx

from suricate.config import Settings
from suricate.services.status import montar_status

AMBIENTES = (
    "Produção=https://prod.exemplo;Pré-produção=https://staging.exemplo;Desenvolvimento=https://dev.exemplo"
)


def transporte(fora: set[str] = frozenset()) -> httpx.MockTransport:
    def responder(request: httpx.Request) -> httpx.Response:
        host = request.url.host
        if request.url.path == "/api/health":
            if host in fora:
                return httpx.Response(
                    503, json={"status": "erro", "banco": "indisponível", "versao": "0.1.0"}
                )
            return httpx.Response(200, json={"status": "ok", "banco": "ok", "versao": "0.1.0"})
        if host == "api.vercel.com":
            return httpx.Response(
                200,
                json={
                    "deployments": [
                        {
                            "target": "production",
                            "state": "READY",
                            "createdAt": 1792170000000,
                            "meta": {
                                "githubCommitRef": "main",
                                "githubCommitMessage": "Release 0.1.0\n\ndetalhes",
                            },
                        },
                        {
                            "target": None,
                            "state": "READY",
                            "createdAt": 1792160000000,
                            "meta": {"githubCommitRef": "develop", "githubCommitMessage": "M1: fundação"},
                        },
                        {
                            "target": None,
                            "state": "READY",
                            "createdAt": 1792150000000,
                            "meta": {"githubCommitRef": "feature/x", "githubCommitMessage": "ignorado"},
                        },
                    ]
                },
            )
        if host == "api.github.com":
            return httpx.Response(
                200,
                json={
                    "workflow_runs": [
                        {
                            "status": "completed",
                            "conclusion": "success",
                            "head_branch": "develop",
                            "created_at": "2026-10-16T20:00:00Z",
                            "html_url": "https://github.com/ph-afonso/suricate_finance/actions/runs/1",
                        }
                    ]
                },
            )
        return httpx.Response(404)

    return httpx.MockTransport(responder)


def settings(**extra) -> Settings:
    return Settings(
        _env_file=None, status_ambientes=AMBIENTES, vercel_api_token="t", vercel_project_id="p", **extra
    )


def test_ct14_mostra_os_tres_ambientes_e_quem_esta_fora():
    with httpx.Client(transport=transporte(fora={"staging.exemplo"})) as c:
        s = montar_status(settings(), c, usar_cache=False)
    estado = {a.nome: a.no_ar for a in s.ambientes}
    assert estado == {"Produção": True, "Pré-produção": False, "Desenvolvimento": True}
    assert all(a.versao == "0.1.0" for a in s.ambientes)
    assert [d.ambiente for d in s.deploys] == ["Produção", "Desenvolvimento"]
    assert s.deploys[0].commit == "Release 0.1.0"
    assert s.pipeline.conclusao == "success"


def test_ct14_sem_tokens_mostra_so_os_ambientes():
    sem_tokens = Settings(_env_file=None, status_ambientes=AMBIENTES)
    with httpx.Client(transport=transporte()) as c:
        s = montar_status(sem_tokens, c, usar_cache=False)
    assert len(s.ambientes) == 3
    assert s.deploys is None


def test_ct15_nao_expoe_dados_de_usuarios():
    with httpx.Client(transport=transporte()) as c:
        corpo = json.loads(montar_status(settings(), c, usar_cache=False).model_dump_json())
    assert set(corpo) == {"atualizado_em", "ambientes", "deploys", "pipeline"}
    texto = json.dumps(corpo).lower()
    for proibido in ("email", "e-mail", "nome_usuario", "usuario_id", "senha", "token"):
        assert proibido not in texto


def test_rota_status_responde(cliente, monkeypatch):
    monkeypatch.setattr("suricate.services.status.ultima_pipeline", lambda *_: None)
    monkeypatch.setattr("suricate.services.status._cache", {})
    r = cliente(status_ambientes="").get("/api/status")
    assert r.status_code == 200
    assert r.json()["ambientes"] == []
