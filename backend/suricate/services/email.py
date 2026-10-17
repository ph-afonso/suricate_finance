"""Envio de e-mail pelo Gmail do Suricate (decisão D2).

Caminho principal: API do Gmail com OAuth (GMAIL_REFRESH_TOKEN), por HTTPS. O Google bloqueia o
login por senha (SMTP) vindo dos servidores da Vercel, mas aceita a API. O SMTP com senha de app
fica como reserva, útil na máquina local.

Sem nenhum dos dois configurado (máquina local, testes), o e-mail vai para CAIXA_DE_SAIDA e para o log,
para quem desenvolve conseguir pegar o link.
"""

import base64
import logging
import re
import smtplib
from email.message import EmailMessage

import httpx

from suricate.config import Settings

log = logging.getLogger("suricate.email")
CAIXA_DE_SAIDA: list[EmailMessage] = []


class ErroEnvio(Exception):
    """O servidor de e-mail recusou ou caiu. A rota avisa a pessoa para tentar de novo."""


def enviar(settings: Settings, para: str, assunto: str, texto: str) -> None:
    msg = EmailMessage()
    msg["From"] = f"Suri, do Suricate Finance <{settings.email_remetente or 'nao-responda@suricate.local'}>"
    msg["To"] = para
    msg["Subject"] = assunto
    msg.set_content(texto)

    if settings.gmail_refresh_token and settings.google_configurado:
        _enviar_pela_api(settings, msg)
        return
    if not (settings.smtp_host and settings.smtp_usuario and settings.smtp_senha):
        CAIXA_DE_SAIDA.append(msg)
        log.warning("SMTP não configurado; e-mail para %s não enviado:\n%s", para, texto)
        return
    # a senha de app do Gmail aparece em grupos com espaços; sem eles ela vale do mesmo jeito
    senha = re.sub(r"\s", "", settings.smtp_senha)
    usuario = settings.smtp_usuario.strip()
    ultimo_erro: Exception | None = None
    # 587 com STARTTLS e, se o servidor fechar a conexão, 465 com SSL direto: o Gmail às vezes
    # recusa uma porta e aceita a outra quando o envio sai de servidores na nuvem
    for porta in dict.fromkeys((settings.smtp_porta, 465)):
        try:
            if porta == 465:
                conexao = smtplib.SMTP_SSL(settings.smtp_host, porta, timeout=10)
            else:
                conexao = smtplib.SMTP(settings.smtp_host, porta, timeout=10)
            with conexao as smtp:
                if porta != 465:
                    smtp.starttls()
                smtp.login(usuario, senha)
                smtp.send_message(msg)
            return
        except (smtplib.SMTPException, OSError) as erro:
            # registra o motivo dado pelo servidor (código e texto), nunca a senha
            codigo = getattr(erro, "smtp_code", "")
            log.error(
                "Falha ao enviar e-mail por %s:%s: %s %s %s",
                settings.smtp_host,
                porta,
                type(erro).__name__,
                codigo,
                erro,
            )
            ultimo_erro = erro
            if isinstance(erro, smtplib.SMTPAuthenticationError):
                break  # senha recusada: tentar outra porta não muda nada
    raise ErroEnvio from ultimo_erro


def _enviar_pela_api(settings: Settings, msg: EmailMessage) -> None:
    """Troca a autorização (refresh token) por um token de acesso e envia pela API do Gmail."""
    try:
        r = httpx.post(
            "https://oauth2.googleapis.com/token",
            data={
                "client_id": settings.google_client_id,
                "client_secret": settings.google_client_secret,
                "refresh_token": settings.gmail_refresh_token.strip(),
                "grant_type": "refresh_token",
            },
            timeout=10,
        )
        r.raise_for_status()
        token = r.json()["access_token"]
        bruto = base64.urlsafe_b64encode(msg.as_bytes()).decode()
        r = httpx.post(
            "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
            headers={"Authorization": f"Bearer {token}"},
            json={"raw": bruto},
            timeout=10,
        )
        r.raise_for_status()
    except (httpx.HTTPError, KeyError) as erro:
        # a resposta do Google diz o motivo (ex.: invalid_grant = autorização revogada ou vencida)
        detalhe = erro.response.text[:300] if isinstance(erro, httpx.HTTPStatusError) else str(erro)
        log.error("Falha ao enviar e-mail pela API do Gmail: %s %s", type(erro).__name__, detalhe)
        raise ErroEnvio from erro
