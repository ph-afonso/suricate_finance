"""Envio de e-mail por SMTP (decisão D2: Gmail do Suricate com senha de app).

Sem SMTP configurado (máquina local, testes), o e-mail vai para CAIXA_DE_SAIDA e para o log,
para quem desenvolve conseguir pegar o link.
"""

import logging
import smtplib
from email.message import EmailMessage

from suricate.config import Settings

log = logging.getLogger("suricate.email")
CAIXA_DE_SAIDA: list[EmailMessage] = []


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
    with smtplib.SMTP(settings.smtp_host, settings.smtp_porta, timeout=10) as smtp:
        smtp.starttls()
        smtp.login(settings.smtp_usuario, settings.smtp_senha)
        smtp.send_message(msg)
