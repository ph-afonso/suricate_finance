"""Senhas, tokens e cookie de sessão (seção 3 da documentação técnica do M2)."""

import hashlib
import secrets

from pwdlib import PasswordHash

COOKIE_SESSAO = "suricate_sessao"
COOKIE_GOOGLE = "suricate_google"  # state e verificador PKCE enquanto a pessoa está no Google
CABECALHO_CSRF = "X-Suricate"
DIAS_SESSAO = 30
TERMOS_VERSAO = "2026-10"

_hash = PasswordHash.recommended()  # argon2id


def hash_senha(senha: str) -> str:
    return _hash.hash(senha)


def senha_confere(senha: str, senha_hash: str | None) -> bool:
    if not senha_hash:
        # conta só com Google: gasta o mesmo tempo, para não revelar que ela existe
        _hash.hash(senha)
        return False
    return _hash.verify(senha, senha_hash)


def novo_token() -> tuple[str, str]:
    """Devolve (token, hash). O token vai para a pessoa; o banco guarda só o hash."""
    token = secrets.token_urlsafe(32)
    return token, hash_token(token)


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def normalizar_email(email: str) -> str:
    return email.strip().lower()
