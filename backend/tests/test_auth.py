"""CT18–CT25: cadastro, login, sessão, CSRF, força bruta, Google e esqueci a senha (RF01)."""

import re

import pytest
from sqlalchemy import select
from sqlalchemy.orm import Session

from suricate.db import get_engine
from suricate.models import Sessao, Usuario
from suricate.seguranca import COOKIE_GOOGLE, COOKIE_SESSAO
from suricate.services import email, google
from tests.conftest import cadastrar, novo_email


def test_ct18_cadastro_cria_conta_sessao_e_guarda_so_o_hash(api, db_url):
    c = api()
    email_ = novo_email()
    r = c.post(
        "/api/auth/cadastro",
        json={"nome": "Ana", "email": email_.upper(), "senha": "senha-forte-123", "aceite_termos": True},
    )
    assert r.status_code == 201
    assert r.json()["email"] == email_  # guardado em minúsculas
    assert "httponly" in r.headers["set-cookie"].lower()
    assert "samesite=lax" in r.headers["set-cookie"].lower()
    with Session(get_engine(db_url)) as s:
        usuario = s.scalar(select(Usuario).where(Usuario.email == email_))
        assert usuario.senha_hash.startswith("$argon2id$")
        assert "senha-forte-123" not in usuario.senha_hash
        sessao = s.scalar(select(Sessao))
        assert sessao.token_hash != c.cookies[COOKIE_SESSAO]  # o banco guarda só o hash do token
    assert c.get("/api/auth/eu").json()["nome"] == "Ana"


def test_ct18_cadastro_exige_aceite_e_senha_de_8(api):
    c = api()
    base = {"nome": "Ana", "email": novo_email(), "senha": "senha-forte-123", "aceite_termos": True}
    assert c.post("/api/auth/cadastro", json={**base, "aceite_termos": False}).status_code == 422
    assert c.post("/api/auth/cadastro", json={**base, "senha": "curta"}).status_code == 422
    assert c.post("/api/auth/cadastro", json={**base, "email": "não é e-mail"}).status_code == 422


def test_ct19_email_repetido_com_maiusculas_e_espacos(api):
    c = api()
    email_ = novo_email()
    cadastrar(c, email_)
    r = api().post(
        "/api/auth/cadastro",
        json={
            "nome": "Outra",
            "email": f"  {email_.upper()} ",
            "senha": "outra-senha-1",
            "aceite_termos": True,
        },
    )
    assert r.status_code == 409


def test_ct20_login_certo_e_errado(api):
    email_ = novo_email()
    cadastrar(api(), email_)
    c = api()
    errado = c.post("/api/auth/entrar", json={"email": email_, "senha": "senha-errada"})
    assert errado.status_code == 401
    inexistente = c.post("/api/auth/entrar", json={"email": novo_email(), "senha": "senha-errada"})
    assert inexistente.json()["detail"] == errado.json()["detail"]  # não revela se a conta existe
    certo = c.post("/api/auth/entrar", json={"email": email_, "senha": "senha-forte-123"})
    assert certo.status_code == 200
    assert c.get("/api/auth/eu").status_code == 200


def test_ct21_bloqueio_depois_de_5_erros(api):
    email_ = novo_email()
    cadastrar(api(), email_)
    c = api()
    for _ in range(5):
        assert c.post("/api/auth/entrar", json={"email": email_, "senha": "errada-errada"}).status_code == 401
    r = c.post("/api/auth/entrar", json={"email": email_, "senha": "senha-forte-123"})
    assert r.status_code == 429


@pytest.mark.parametrize("rota", ["/api/auth/eu", "/api/onboarding", "/api/sugestoes"])
def test_ct22_rotas_de_dados_sem_sessao(api, rota):
    assert api().get(rota).status_code == 401


def test_ct22_depois_de_sair_e_com_token_falso(api):
    c = api()
    cadastrar(c)
    assert c.post("/api/auth/sair").status_code == 204
    assert c.get("/api/auth/eu").status_code == 401
    falso = api()
    falso.cookies.set(COOKIE_SESSAO, "token-inventado")
    assert falso.get("/api/auth/eu").status_code == 401


def test_ct22_sessao_expirada(api, db_url):
    c = api()
    cadastrar(c)
    with Session(get_engine(db_url)) as s:
        from datetime import UTC, datetime

        for sessao in s.scalars(select(Sessao)):
            sessao.expira_em = datetime(2020, 1, 1, tzinfo=UTC)
        s.commit()
    assert c.get("/api/auth/eu").status_code == 401


def test_ct23_post_sem_cabecalho_csrf(api):
    c = api()
    del c.headers["X-Suricate"]
    r = c.post(
        "/api/auth/cadastro",
        json={"nome": "Ana", "email": novo_email(), "senha": "senha-forte-123", "aceite_termos": True},
    )
    assert r.status_code == 403


# ---------- Google (CT24) ----------

GOOGLE = {
    "google_client_id": "id-teste",
    "google_client_secret": "segredo",
    "app_url": "http://localhost:9001",
}


def _login_google(c, monkeypatch, identidade=None, erro=None):
    def falso(settings, code, verificador):
        assert code == "codigo-do-google" and verificador
        if erro:
            raise google.ErroGoogle(erro)
        return identidade

    monkeypatch.setattr(google, "obter_identidade", falso)
    inicio = c.get("/api/auth/google/inicio", follow_redirects=False)
    assert inicio.status_code == 303
    assert inicio.headers["location"].startswith(google.AUTORIZACAO)
    state = re.search(r"state=([^&]+)", inicio.headers["location"]).group(1)
    assert "code_challenge_method=S256" in inicio.headers["location"]
    return c.get(f"/api/auth/google/retorno?code=codigo-do-google&state={state}", follow_redirects=False)


def test_ct24_google_cria_conta_e_pede_os_termos(api, monkeypatch):
    c = api(**GOOGLE)
    r = _login_google(c, monkeypatch, google.Identidade(sub="g-1", email="Nova@Gmail.com", nome="Nova"))
    assert r.status_code == 303 and r.headers["location"].endswith("/boas-vindas")
    eu = c.get("/api/auth/eu").json()
    assert eu["email"] == "nova@gmail.com" and eu["tem_google"] and not eu["tem_senha"]
    assert c.get("/api/onboarding").status_code == 403  # termos ainda não aceitos
    assert c.post("/api/auth/termos").status_code == 200
    assert c.get("/api/onboarding").status_code == 200


def test_ct24_google_liga_a_conta_existente(api, monkeypatch):
    email_ = novo_email()
    cadastrar(api(), email_)
    c = api(**GOOGLE)
    r = _login_google(c, monkeypatch, google.Identidade(sub="g-2", email=email_, nome="Mesma"))
    assert r.headers["location"].endswith("/")
    eu = c.get("/api/auth/eu").json()
    assert eu["tem_google"] and eu["tem_senha"]


def test_ct24_google_recusa_retorno_invalido(api, monkeypatch):
    c = api(**GOOGLE)
    r = _login_google(c, monkeypatch, erro="Não foi possível confirmar sua conta Google.")
    assert "/entrar?erro=" in r.headers["location"]
    assert c.get("/api/auth/eu").status_code == 401
    # state diferente do cookie: recusado sem nem falar com o Google
    c.cookies.set(COOKIE_GOOGLE, "outro.verificador", path="/api/auth/google")
    r = c.get("/api/auth/google/retorno?code=x&state=forjado", follow_redirects=False)
    assert "/entrar?erro=" in r.headers["location"]


def test_ct24_google_sem_configuracao(api):
    r = api().get("/api/auth/google/inicio", follow_redirects=False)
    assert "/entrar?erro=" in r.headers["location"]


# ---------- Esqueci a senha (CT25) ----------


def _link(caixa) -> str:
    return re.search(r"token=(\S+)", caixa[-1].get_content()).group(1)


def test_ct25_esqueci_e_redefinir(api):
    email_ = novo_email()
    antiga = api()
    cadastrar(antiga, email_)
    c = api()
    assert c.post("/api/auth/senha/esqueci", json={"email": novo_email()}).status_code == 202
    assert email.CAIXA_DE_SAIDA == []  # e-mail inexistente: mesma resposta, nada enviado
    assert c.post("/api/auth/senha/esqueci", json={"email": email_}).status_code == 202
    token = _link(email.CAIXA_DE_SAIDA)

    r = c.post("/api/auth/senha/redefinir", json={"token": token, "senha": "senha-nova-456"})
    assert r.status_code == 200
    assert antiga.get("/api/auth/eu").status_code == 401  # as outras sessões caíram
    assert c.get("/api/auth/eu").status_code == 200
    assert (
        c.post("/api/auth/senha/redefinir", json={"token": token, "senha": "mais-uma-789"}).status_code == 400
    )
    assert (
        api().post("/api/auth/entrar", json={"email": email_, "senha": "senha-nova-456"}).status_code == 200
    )


def test_ct25_link_vencido(api, db_url):
    from datetime import UTC, datetime

    from suricate.models import RedefinicaoSenha

    email_ = novo_email()
    cadastrar(api(), email_)
    c = api()
    c.post("/api/auth/senha/esqueci", json={"email": email_})
    token = _link(email.CAIXA_DE_SAIDA)
    with Session(get_engine(db_url)) as s:
        s.scalar(select(RedefinicaoSenha)).expira_em = datetime(2020, 1, 1, tzinfo=UTC)
        s.commit()
    assert (
        c.post("/api/auth/senha/redefinir", json={"token": token, "senha": "senha-nova-456"}).status_code
        == 400
    )


def test_admin_pelo_email(api):
    email_ = novo_email()
    assert cadastrar(api(admin_emails=f"outro@x.com, {email_.upper()}"), email_)["papel"] == "admin"
    assert cadastrar(api(admin_emails=email_))["papel"] == "usuario"
