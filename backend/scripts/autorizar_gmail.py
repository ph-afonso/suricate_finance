"""Gera a autorização (refresh token) para o Suricate enviar e-mails pela API do Gmail.

Uso (na pasta backend, com a porta 9001 livre):  .venv/Scripts/python scripts/autorizar_gmail.py

1. Pede o ID e a chave secreta do cliente OAuth "Suricate Web" (Google Cloud › Clientes).
2. Abre o navegador para você entrar com a conta do Gmail do Suricate e permitir "enviar e-mail".
3. Mostra a autorização, que vai na Vercel como GMAIL_REFRESH_TOKEN (tipo Secret).

O retorno usa http://localhost:9001/api/auth/google/retorno, que já está cadastrado no cliente.
Nada é guardado em arquivo.
"""

import getpass
import secrets
import webbrowser
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import parse_qs, urlencode, urlparse

import httpx

RETORNO = "http://localhost:9001/api/auth/google/retorno"
ESCOPO = "https://www.googleapis.com/auth/gmail.send"

client_id = input("ID do cliente (termina em .apps.googleusercontent.com): ").strip()
client_secret = getpass.getpass("Chave secreta do cliente (não aparece ao digitar): ").strip()
conta = input("Gmail do Suricate: ").strip()
state = secrets.token_urlsafe(16)

url = "https://accounts.google.com/o/oauth2/v2/auth?" + urlencode(
    {
        "client_id": client_id,
        "redirect_uri": RETORNO,
        "response_type": "code",
        "scope": ESCOPO,
        "access_type": "offline",  # é o que faz o Google devolver o refresh token
        "prompt": "consent",
        "login_hint": conta,
        "state": state,
    }
)
resultado: dict = {}


class Retorno(BaseHTTPRequestHandler):
    def do_GET(self):  # noqa: N802 - nome exigido pelo http.server
        consulta = parse_qs(urlparse(self.path).query)
        resultado.update({k: v[0] for k, v in consulta.items()})
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.end_headers()
        self.wfile.write(b"<h2>Pronto! Pode fechar esta aba e voltar ao terminal.</h2>")

    def log_message(self, *args):
        pass


print("\nAbrindo o navegador. Entre com o Gmail do Suricate e permita o envio de e-mails.")
print("Se o Google avisar que o app não foi verificado: Avançado › Acessar Suricate Finance.")
print(f"Se o navegador não abrir, copie este endereço:\n{url}\n")
webbrowser.open(url)
HTTPServer(("localhost", 9001), Retorno).handle_request()

if resultado.get("state") != state or "code" not in resultado:
    raise SystemExit(f"Autorização não concluída: {resultado.get('error', 'resposta inesperada')}")

r = httpx.post(
    "https://oauth2.googleapis.com/token",
    data={
        "code": resultado["code"],
        "client_id": client_id,
        "client_secret": client_secret,
        "redirect_uri": RETORNO,
        "grant_type": "authorization_code",
    },
    timeout=15,
)
if r.status_code != 200:
    raise SystemExit(f"O Google recusou a troca: {r.text[:300]}")
token = r.json().get("refresh_token")
if not token:
    raise SystemExit(
        "O Google não devolveu o refresh token. Rode de novo (o prompt=consent força a entrega)."
    )
print("Autorização gerada. Cole na Vercel como GMAIL_REFRESH_TOKEN (Production e Preview):\n")
print(token)
