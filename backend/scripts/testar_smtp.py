"""Testa o login no Gmail (SMTP) da sua máquina, nas portas 587 e 465.

Uso (na pasta backend):  .venv/Scripts/python scripts/testar_smtp.py
Pede o e-mail e a senha de app no terminal; a senha não aparece na tela e não é guardada.
Opcional: informe um e-mail de destino para mandar uma mensagem de teste.
"""

import getpass
import re
import smtplib
import ssl
from email.message import EmailMessage

usuario = input("E-mail do Gmail do Suricate: ").strip()
senha = re.sub(r"\s", "", getpass.getpass("Senha de app (não aparece ao digitar): "))
destino = input("Mandar um e-mail de teste para (Enter para pular): ").strip()
print(f"\nSenha lida com {len(senha)} caracteres (a senha de app do Gmail tem 16).")


def tentar(nome, abrir):
    print(f"\n== {nome}")
    try:
        with abrir() as smtp:
            smtp.ehlo()
            if nome.startswith("587"):
                smtp.starttls(context=ssl.create_default_context())
                smtp.ehlo()
            print("Métodos de login oferecidos:", smtp.esmtp_features.get("auth", "?"))
            smtp.login(usuario, senha)
            print("LOGIN OK")
            if destino:
                msg = EmailMessage()
                msg["From"], msg["To"], msg["Subject"] = usuario, destino, "Teste do Suricate"
                msg.set_content("Se chegou, o envio pelo Gmail funciona.")
                smtp.send_message(msg)
                print("E-MAIL DE TESTE ENVIADO para", destino)
    except smtplib.SMTPAuthenticationError as e:
        print("RECUSADO pelo Gmail:", e.smtp_code, e.smtp_error.decode(errors="replace"))
    except Exception as e:  # noqa: BLE001 - mostrar qualquer falha é o objetivo do script
        print("FALHOU:", type(e).__name__, e)


tentar("587 com STARTTLS", lambda: smtplib.SMTP("smtp.gmail.com", 587, timeout=15))
tentar("465 com SSL", lambda: smtplib.SMTP_SSL("smtp.gmail.com", 465, timeout=15))
