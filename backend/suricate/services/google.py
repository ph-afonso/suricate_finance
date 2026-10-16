"""Login com Google por OpenID Connect, com state e PKCE (RF01, seção 3 do M2)."""

import base64
import hashlib
import secrets
from dataclasses import dataclass
from urllib.parse import urlencode

import httpx
import jwt

from suricate.config import Settings

AUTORIZACAO = "https://accounts.google.com/o/oauth2/v2/auth"
TOKEN = "https://oauth2.googleapis.com/token"
CHAVES = "https://www.googleapis.com/oauth2/v3/certs"
EMISSORES = ("https://accounts.google.com", "accounts.google.com")

_chaves = jwt.PyJWKClient(CHAVES, cache_keys=True)


class ErroGoogle(Exception):
    """Retorno do Google inválido: a pessoa volta para o login com uma mensagem."""


@dataclass
class Identidade:
    sub: str
    email: str
    nome: str


def retorno(settings: Settings) -> str:
    return f"{settings.app_url.rstrip('/')}/api/auth/google/retorno"


def novo_pedido() -> tuple[str, str, str]:
    """Devolve (state, verificador, desafio) do PKCE."""
    verificador = secrets.token_urlsafe(48)
    desafio = base64.urlsafe_b64encode(hashlib.sha256(verificador.encode()).digest()).rstrip(b"=").decode()
    return secrets.token_urlsafe(24), verificador, desafio


def url_autorizacao(settings: Settings, state: str, desafio: str) -> str:
    parametros = {
        "client_id": settings.google_client_id,
        "redirect_uri": retorno(settings),
        "response_type": "code",
        "scope": "openid email profile",
        "state": state,
        "code_challenge": desafio,
        "code_challenge_method": "S256",
        "prompt": "select_account",
    }
    return f"{AUTORIZACAO}?{urlencode(parametros)}"


def obter_identidade(settings: Settings, code: str, verificador: str) -> Identidade:
    """Troca o code pelo id_token e valida assinatura, audiência, emissor e e-mail verificado."""
    try:
        r = httpx.post(
            TOKEN,
            data={
                "code": code,
                "client_id": settings.google_client_id,
                "client_secret": settings.google_client_secret,
                "redirect_uri": retorno(settings),
                "grant_type": "authorization_code",
                "code_verifier": verificador,
            },
            timeout=10,
        )
        r.raise_for_status()
        id_token = r.json()["id_token"]
        chave = _chaves.get_signing_key_from_jwt(id_token)
        dados = jwt.decode(
            id_token,
            chave.key,
            algorithms=["RS256"],
            audience=settings.google_client_id,
            issuer=EMISSORES,
        )
    except (httpx.HTTPError, KeyError, jwt.PyJWTError) as erro:
        raise ErroGoogle("Não foi possível confirmar sua conta Google.") from erro
    if not dados.get("email_verified"):
        raise ErroGoogle("Seu e-mail no Google ainda não foi verificado.")
    return Identidade(sub=dados["sub"], email=dados["email"], nome=dados.get("name") or dados["email"])
