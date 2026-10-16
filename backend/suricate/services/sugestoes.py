"""Sugestões que viram issues no GitHub (#106; seção 8 da documentação técnica do M2).

O repositório é público: a issue leva só um código anônimo, e o texto passa por uma máscara de
dados pessoais antes de sair daqui.
"""

import re
import secrets
from datetime import timedelta

import httpx
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from suricate import __version__
from suricate.config import Settings
from suricate.models import Sugestao, Usuario
from suricate.models.base import agora, em_utc

LIMITE_POR_DIA = 5
RELER_STATUS = timedelta(minutes=10)
MILESTONE = "Sugestões dos usuários"
TIPOS = {"melhoria": "Melhoria", "problema": "Problema", "ideia": "Ideia"}
_ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"  # sem 0/O e 1/I, para ler sem confusão

_MASCARAS = [
    (re.compile(r"[\w.+-]+@[\w-]+(\.[\w-]+)+"), "[e-mail removido]"),
    (re.compile(r"\b(?:\d[ .-]?){13,19}\b"), "[número removido]"),  # cartões
    (re.compile(r"\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b"), "[CPF removido]"),
    (re.compile(r"(?:\(?\b\d{2}\)?[ -]?)?\b9?\d{4}[ -]?\d{4}\b"), "[telefone removido]"),
]


class LimiteDiario(Exception):
    pass


class GitHubIndisponivel(Exception):
    pass


def mascarar(texto: str) -> str:
    for padrao, troca in _MASCARAS:
        texto = padrao.sub(troca, texto)
    return texto


def _novo_codigo(db: Session) -> str:
    while True:
        codigo = "S-" + "".join(secrets.choice(_ALFABETO) for _ in range(4))
        if not db.scalar(select(Sugestao).where(Sugestao.codigo == codigo)):
            return codigo


def _github(settings: Settings) -> httpx.Client:
    if not settings.github_sugestoes_token:
        raise GitHubIndisponivel("Token do GitHub não configurado.")
    return httpx.Client(
        base_url=f"https://api.github.com/repos/{settings.github_repo}",
        headers={
            "Authorization": f"Bearer {settings.github_sugestoes_token}",
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
        },
        timeout=10,
    )


def _milestone(cliente: httpx.Client) -> int | None:
    r = cliente.get("/milestones", params={"state": "open", "per_page": 100})
    r.raise_for_status()
    return next((m["number"] for m in r.json() if m["title"] == MILESTONE), None)


def criar(
    db: Session,
    settings: Settings,
    usuario: Usuario,
    tipo: str,
    titulo: str,
    descricao: str,
    tela: str | None,
) -> Sugestao:
    hoje = (
        select(func.count())
        .select_from(Sugestao)
        .where(Sugestao.usuario_id == usuario.id, Sugestao.criado_em >= agora() - timedelta(days=1))
    )
    if (db.scalar(hoje) or 0) >= LIMITE_POR_DIA:
        raise LimiteDiario

    codigo = _novo_codigo(db)
    titulo, descricao = mascarar(titulo), mascarar(descricao)
    corpo = (
        f"**Tipo:** {TIPOS[tipo]}  \n**Tela:** {tela or 'não informada'}  \n"
        f"**Versão do app:** {__version__}  \n**Código:** {codigo}\n\n{descricao}\n\n"
        "---\n_Enviada pela aba Sugestões do Suricate. Sem dados pessoais: só o código acima._"
    )
    try:
        with _github(settings) as gh:
            r = gh.post(
                "/issues",
                json={
                    "title": f"[Sugestão {codigo}] {titulo}",
                    "body": corpo,
                    "labels": ["sugestao-usuario", "triagem"],
                    "milestone": _milestone(gh),
                },
            )
            r.raise_for_status()
    except httpx.HTTPError as erro:
        raise GitHubIndisponivel(str(erro)) from erro

    sugestao = Sugestao(
        usuario_id=usuario.id,
        codigo=codigo,
        tipo=tipo,
        titulo=titulo[:120],
        tela=(tela or None) and tela[:120],
        issue_numero=r.json()["number"],
        status="recebida",
        status_lido_em=agora(),
        criado_em=agora(),
    )
    db.add(sugestao)
    db.commit()
    return sugestao


def status_da_issue(issue: dict) -> str:
    if issue["state"] == "closed":
        return "nao_sera_feita" if issue.get("state_reason") == "not_planned" else "entregue"
    labels = {rotulo["name"] for rotulo in issue.get("labels", [])}
    milestone = (issue.get("milestone") or {}).get("title")
    if "triagem" in labels or milestone in (None, MILESTONE):
        return "recebida"
    return "planejada"


def listar(db: Session, settings: Settings, usuario: Usuario) -> list[Sugestao]:
    sugestoes = list(
        db.scalars(
            select(Sugestao).where(Sugestao.usuario_id == usuario.id).order_by(Sugestao.criado_em.desc())
        )
    )
    velhas = [
        s
        for s in sugestoes
        if s.issue_numero and (not s.status_lido_em or agora() - em_utc(s.status_lido_em) > RELER_STATUS)
    ]
    if velhas and settings.github_sugestoes_token:
        try:
            with _github(settings) as gh:
                for s in velhas:
                    r = gh.get(f"/issues/{s.issue_numero}")
                    r.raise_for_status()
                    s.status, s.status_lido_em = status_da_issue(r.json()), agora()
            db.commit()
        except httpx.HTTPError:
            db.rollback()  # sem GitHub, mostra o último status conhecido
    return sugestoes
