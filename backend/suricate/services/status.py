"""Página de status (RF46, CT14, CT15): ambientes, últimos deploys e última pipeline.

Só lê informações técnicas. Nada aqui consulta dados de usuários.
"""

import time
from concurrent.futures import ThreadPoolExecutor
from datetime import UTC, datetime

import httpx
from pydantic import BaseModel

from suricate.config import Settings

RAMOS = {"main": "Produção", "staging": "Pré-produção", "develop": "Desenvolvimento"}
CACHE_SEGUNDOS = 60


class Ambiente(BaseModel):
    nome: str
    url: str
    no_ar: bool
    versao: str | None = None
    banco: str | None = None
    tempo_ms: int | None = None


class Deploy(BaseModel):
    ambiente: str
    ramo: str
    estado: str
    quando: datetime
    commit: str | None = None


class Pipeline(BaseModel):
    estado: str
    conclusao: str | None = None
    ramo: str | None = None
    quando: datetime
    url: str


class Status(BaseModel):
    atualizado_em: datetime
    ambientes: list[Ambiente]
    deploys: list[Deploy] | None
    pipeline: Pipeline | None


def checar_ambiente(cliente: httpx.Client, nome: str, url: str, bypass: str | None) -> Ambiente:
    cabecalhos = {"x-vercel-protection-bypass": bypass} if bypass else {}
    inicio = time.perf_counter()
    try:
        r = cliente.get(f"{url}/api/health", headers=cabecalhos, timeout=8)
        ms = round((time.perf_counter() - inicio) * 1000)
        corpo = r.json()
        return Ambiente(
            nome=nome,
            url=url,
            no_ar=r.status_code == 200 and corpo.get("status") == "ok",
            versao=corpo.get("versao"),
            banco=corpo.get("banco"),
            tempo_ms=ms,
        )
    except (httpx.HTTPError, ValueError):
        return Ambiente(nome=nome, url=url, no_ar=False)


def ultimos_deploys(cliente: httpx.Client, settings: Settings) -> list[Deploy] | None:
    if not (settings.vercel_api_token and settings.vercel_project_id):
        return None
    try:
        r = cliente.get(
            "https://api.vercel.com/v6/deployments",
            params={"projectId": settings.vercel_project_id, "limit": 30},
            headers={"Authorization": f"Bearer {settings.vercel_api_token}"},
            timeout=8,
        )
        r.raise_for_status()
    except httpx.HTTPError:
        return None
    vistos: dict[str, Deploy] = {}
    for d in r.json().get("deployments", []):
        meta = d.get("meta") or {}
        ramo = meta.get("githubCommitRef") or ""
        ambiente = "Produção" if d.get("target") == "production" else RAMOS.get(ramo)
        if not ambiente or ambiente in vistos:
            continue
        vistos[ambiente] = Deploy(
            ambiente=ambiente,
            ramo=ramo,
            estado=(d.get("state") or d.get("readyState") or "").lower(),
            quando=datetime.fromtimestamp(d.get("createdAt", 0) / 1000, tz=UTC),
            commit=(meta.get("githubCommitMessage") or "").splitlines()[0][:120] or None,
        )
    return [vistos[n] for n in ("Produção", "Pré-produção", "Desenvolvimento") if n in vistos]


def ultima_pipeline(cliente: httpx.Client, settings: Settings) -> Pipeline | None:
    cabecalhos = {"Accept": "application/vnd.github+json"}
    if settings.github_status_token:
        cabecalhos["Authorization"] = f"Bearer {settings.github_status_token}"
    try:
        r = cliente.get(
            f"https://api.github.com/repos/{settings.github_repo}/actions/workflows/testes.yml/runs",
            params={"per_page": 1},
            headers=cabecalhos,
            timeout=8,
        )
        r.raise_for_status()
        runs = r.json().get("workflow_runs", [])
    except (httpx.HTTPError, ValueError):
        return None
    if not runs:
        return None
    run = runs[0]
    return Pipeline(
        estado=run.get("status", ""),
        conclusao=run.get("conclusion"),
        ramo=run.get("head_branch"),
        quando=run.get("created_at"),
        url=run.get("html_url", ""),
    )


_cache: dict[str, tuple[float, Status]] = {}


def montar_status(settings: Settings, cliente: httpx.Client | None = None, usar_cache: bool = True) -> Status:
    agora = time.monotonic()
    if usar_cache and "status" in _cache and agora - _cache["status"][0] < CACHE_SEGUNDOS:
        return _cache["status"][1]
    proprio = cliente is None
    cliente = cliente or httpx.Client(follow_redirects=True)
    try:
        bypass = settings.vercel_automation_bypass_secret
        with ThreadPoolExecutor(max_workers=5) as pool:
            ambientes = list(
                pool.map(
                    lambda p: checar_ambiente(cliente, p[0], p[1], bypass), settings.ambientes_monitorados
                )
            )
            deploys = pool.submit(ultimos_deploys, cliente, settings)
            pipeline = pool.submit(ultima_pipeline, cliente, settings)
            status = Status(
                atualizado_em=datetime.now(UTC),
                ambientes=ambientes,
                deploys=deploys.result(),
                pipeline=pipeline.result(),
            )
    finally:
        if proprio:
            cliente.close()
    if usar_cache:
        _cache["status"] = (agora, status)
    return status
