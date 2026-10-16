"""CT01–CT04: rota de saúde e documentação automática."""


def test_ct01_banco_disponivel(cliente, db_url):
    r = cliente(app_env="development", database_url=db_url).get("/api/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok", "ambiente": "development", "versao": "0.1.0", "banco": "ok"}


def test_ct02_banco_indisponivel(cliente):
    url = "postgresql://ninguem:senha@127.0.0.1:1/inexistente"
    r = cliente(database_url=url).get("/api/health")
    assert r.status_code == 503
    assert r.json()["status"] == "erro"
    assert r.json()["banco"] == "indisponível"


def test_ct02_banco_nao_configurado(cliente):
    r = cliente().get("/api/health")
    assert r.status_code == 503
    assert r.json()["banco"] == "não configurado"


def test_ct03_ambiente_e_versao_vem_das_variaveis(cliente, db_url):
    r = cliente(app_env="staging", app_version="0.1.0-rc.1", database_url=db_url).get("/api/health")
    assert r.json()["ambiente"] == "staging"
    assert r.json()["versao"] == "0.1.0-rc.1"


def test_ct04_documentacao_fora_da_producao(cliente):
    assert cliente(app_env="development").get("/api/docs").status_code == 200


def test_ct04_documentacao_escondida_em_producao(cliente):
    c = cliente(app_env="production")
    assert c.get("/api/docs").status_code == 404
    assert c.get("/api/openapi.json").status_code == 404
