"""Envio de e-mail por SMTP (decisão D2: Gmail do Suricate com senha de app).

Sem SMTP configurado (máquina local, testes), o e-mail vai para CAIXA_DE_SAIDA e para o log,
para quem desenvolve conseguir pegar o link.
"""

import logging
import re
import smtplib
from email.message import EmailMessage

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

    if not (settings.smtp_host and settings.smtp_usuario and settings.smtp_senha):
        CAIXA_DE_SAIDA.append(msg)
        log.warning("SMTP não configurado; e-mail para %s não enviado:\n%s", para, texto)
        return
    # a senha de app do Gmail aparece em grupos com espaços; sem eles ela vale do mesmo jeito
    senha = re.sub(r"\s", "", settings.smtp_senha)
    try:
        with smtplib.SMTP(settings.smtp_host, settings.smtp_porta, timeout=10) as smtp:
            smtp.starttls()
            smtp.login(settings.smtp_usuario.strip(), senha)
            smtp.send_message(msg)
    except (smtplib.SMTPException, OSError) as erro:
        # registra o motivo dado pelo servidor (código e texto), nunca a senha
        codigo = getattr(erro, "smtp_code", "")
        log.error(
            "Falha ao enviar e-mail por %s: %s %s %s", settings.smtp_host, type(erro).__name__, codigo, erro
        )
        raise ErroEnvio from erro
