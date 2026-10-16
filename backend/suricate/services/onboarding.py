"""Cadastro guiado do Suri em 7 etapas (RF03, RF04; seção 6 da documentação técnica do M2).

As respostas ficam em JSON por etapa (D1). Cada etapa tem um schema; a etapa Família confere se
as contas, cartões e contas fixas que ela cita existem nas respostas das etapas anteriores.
"""

import uuid
from dataclasses import dataclass
from typing import Annotated, Any, Literal

from pydantic import BaseModel, Field, StringConstraints, ValidationError, model_validator
from pydantic_core import InitErrorDetails, PydanticCustomError
from sqlalchemy import select
from sqlalchemy.orm import Session

from suricate.models import OnboardingProgresso, Usuario
from suricate.models.base import agora

VERSAO = 1

Texto = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=60)]
Dia = Annotated[int, Field(ge=1, le=31)]
Valor = Annotated[float, Field(ge=0, le=99_999_999)]
Saldo = Annotated[float, Field(ge=-99_999_999, le=99_999_999)]


class BoasVindas(BaseModel):
    apelido: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=40)]
    objetivo: Literal["sair_do_vermelho", "juntar_dinheiro", "quitar_divida", "organizar", "outro"]
    objetivo_outro: Annotated[str, StringConstraints(strip_whitespace=True, max_length=120)] | None = None

    @model_validator(mode="after")
    def outro_tem_texto(self):
        if self.objetivo == "outro" and not self.objetivo_outro:
            raise ValueError("Conte com suas palavras qual é o objetivo.")
        return self


class Entrada(BaseModel):
    id: uuid.UUID
    descricao: Texto
    dia: Dia
    valor: Valor


class Renda(BaseModel):
    dia: Dia
    valor_medio: Valor
    fim_de_semana: Literal["antecipa", "adia", "nao_muda", "nao_sei"]
    atrasa: bool = False
    dias_atraso: Annotated[int, Field(ge=1, le=31)] | None = None
    outras: list[Entrada] = Field(default_factory=list, max_length=20)

    @model_validator(mode="after")
    def atraso_tem_dias(self):
        if self.atrasa and not self.dias_atraso:
            raise ValueError("Informe quantos dias, no máximo, o salário costuma atrasar.")
        if not self.atrasa:
            self.dias_atraso = None
        return self


class Conta(BaseModel):
    id: uuid.UUID
    nome: Texto
    banco: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=40)]
    tipo: Literal["corrente", "poupanca", "investimentos", "vr_va", "dinheiro", "familiar"]
    saldo: Saldo = 0


class Contas(BaseModel):
    contas: list[Conta] = Field(default_factory=list, max_length=30)


class Cartao(BaseModel):
    id: uuid.UUID
    nome: Texto
    limite: Valor = 0
    fechamento: Dia
    vencimento: Dia


class Cartoes(BaseModel):
    cartoes: list[Cartao] = Field(default_factory=list, max_length=20)


class Fixa(BaseModel):
    id: uuid.UUID
    descricao: Texto
    dia: Dia
    valor: Valor
    nao_pode_atrasar: bool = False


class Parcela(BaseModel):
    id: uuid.UUID
    descricao: Texto
    valor: Valor
    total: Annotated[int, Field(ge=1, le=600)]
    pagas: Annotated[int, Field(ge=0, le=600)] = 0

    @model_validator(mode="after")
    def pagas_ate_o_total(self):
        if self.pagas > self.total:
            raise ValueError("As parcelas pagas não podem passar do total.")
        return self


class ContasFixas(BaseModel):
    fixas: list[Fixa] = Field(default_factory=list, max_length=40)
    parcelas: list[Parcela] = Field(default_factory=list, max_length=40)


class Familia(BaseModel):
    divide: bool
    com_quem: Annotated[str, StringConstraints(strip_whitespace=True, max_length=60)] | None = None
    percentual_outro: Annotated[float, Field(ge=0, le=100)] = 50
    conta_familiar_id: uuid.UUID | None = None
    cartao_casal_id: uuid.UUID | None = None
    divididos: list[uuid.UUID] = Field(default_factory=list, max_length=80)

    @model_validator(mode="after")
    def quem_divide(self):
        if self.divide and not self.com_quem:
            raise ValueError("Conte com quem você divide as contas.")
        if not self.divide:
            self.com_quem, self.conta_familiar_id, self.cartao_casal_id, self.divididos = None, None, None, []
        return self


class Objetivos(BaseModel):
    metas: list[Texto] = Field(default_factory=list, max_length=10)  # em ordem de prioridade
    limite_cartao: Valor | None = None
    limite_debito: Valor | None = None


@dataclass(frozen=True)
class Etapa:
    chave: str
    titulo: str
    conquista: str
    schema: type[BaseModel]


ETAPAS = (
    Etapa("boas_vindas", "Boas-vindas", "Primeiro passo", BoasVindas),
    Etapa("renda", "Sua renda", "Ponto de partida", Renda),
    Etapa("contas", "Contas bancárias", "Toca do suricato", Contas),
    Etapa("cartoes", "Cartões", "Vigia do cartão", Cartoes),
    Etapa("contas_fixas", "Contas fixas", "Nada me escapa", ContasFixas),
    Etapa("familia", "Família", "Bando unido", Familia),
    Etapa("objetivos", "Objetivos", "Olhando o horizonte", Objetivos),
)
POR_CHAVE = {e.chave: e for e in ETAPAS}


class EtapaInexistente(Exception):
    pass


def progresso_de(db: Session, usuario: Usuario) -> OnboardingProgresso:
    progresso = db.scalar(select(OnboardingProgresso).where(OnboardingProgresso.usuario_id == usuario.id))
    if not progresso:
        progresso = OnboardingProgresso(usuario_id=usuario.id, etapa_atual=0, etapas={}, conquistas=[])
        db.add(progresso)
        db.flush()
    return progresso


def _respostas(progresso: OnboardingProgresso, chave: str) -> dict[str, Any]:
    return (progresso.etapas.get(chave) or {}).get("respostas") or {}


def _conferir_familia(dados: Familia, progresso: OnboardingProgresso) -> None:
    contas = {c["id"] for c in _respostas(progresso, "contas").get("contas", [])}
    cartoes = {c["id"] for c in _respostas(progresso, "cartoes").get("cartoes", [])}
    fixas = _respostas(progresso, "contas_fixas")
    itens = {i["id"] for i in fixas.get("fixas", []) + fixas.get("parcelas", [])}
    erros: list[InitErrorDetails] = []

    def erro(campo: tuple, mensagem: str) -> None:
        erros.append({"type": PydanticCustomError("referencia", mensagem), "loc": campo, "input": None})

    if dados.conta_familiar_id and str(dados.conta_familiar_id) not in contas:
        erro(("conta_familiar_id",), "Essa conta não está nas suas contas bancárias.")
    if dados.cartao_casal_id and str(dados.cartao_casal_id) not in cartoes:
        erro(("cartao_casal_id",), "Esse cartão não está nos seus cartões.")
    for i, item in enumerate(dados.divididos):
        if str(item) not in itens:
            erro(("divididos", i), "Esse item não está nas suas contas fixas ou parcelas.")
    if erros:
        raise ValidationError.from_exception_data("Familia", erros)


def _recalcular(progresso: OnboardingProgresso) -> None:
    """A etapa atual é a primeira ainda não feita (nem concluída, nem pulada). Assim a pessoa retoma ali."""
    feitas = progresso.etapas
    progresso.etapa_atual = next((i for i, e in enumerate(ETAPAS) if e.chave not in feitas), len(ETAPAS))


def salvar_etapa(db: Session, usuario: Usuario, chave: str, dados: dict[str, Any]) -> OnboardingProgresso:
    """Valida e grava as respostas; levanta ValidationError (vira 422) ou EtapaInexistente (404)."""
    etapa = POR_CHAVE.get(chave)
    if not etapa:
        raise EtapaInexistente(chave)
    progresso = progresso_de(db, usuario)
    modelo = etapa.schema.model_validate(dados)
    if isinstance(modelo, Familia):
        _conferir_familia(modelo, progresso)
    if isinstance(modelo, BoasVindas):
        usuario.apelido = modelo.apelido

    etapas = dict(progresso.etapas)  # cópia nova: o SQLAlchemy só percebe a troca do JSON inteiro
    etapas[chave] = {
        "status": "concluida",
        "versao": VERSAO,
        "respostas": modelo.model_dump(mode="json"),
        "atualizado_em": agora().isoformat(),
    }
    progresso.etapas = etapas
    if etapa.conquista not in progresso.conquistas:
        progresso.conquistas = [*progresso.conquistas, etapa.conquista]
    _recalcular(progresso)
    db.commit()
    return progresso


def pular_etapa(db: Session, usuario: Usuario, chave: str) -> OnboardingProgresso:
    if chave not in POR_CHAVE:
        raise EtapaInexistente(chave)
    progresso = progresso_de(db, usuario)
    if chave not in progresso.etapas:  # pular não desfaz uma etapa já concluída
        progresso.etapas = {
            **progresso.etapas,
            chave: {"status": "pulada", "versao": VERSAO, "respostas": None},
        }
    _recalcular(progresso)
    db.commit()
    return progresso


def concluir(db: Session, usuario: Usuario) -> OnboardingProgresso:
    progresso = progresso_de(db, usuario)
    progresso.concluido_em = progresso.concluido_em or agora()
    db.commit()
    return progresso


def visao(progresso: OnboardingProgresso) -> dict[str, Any]:
    return {
        "etapa_atual": progresso.etapa_atual,
        "concluido": bool(progresso.concluido_em),
        "conquistas": progresso.conquistas,
        "etapas": [
            {
                "chave": e.chave,
                "titulo": e.titulo,
                "conquista": e.conquista,
                "status": (progresso.etapas.get(e.chave) or {}).get("status", "nao_feita"),
                "respostas": _respostas(progresso, e.chave) or None,
            }
            for e in ETAPAS
        ],
    }
