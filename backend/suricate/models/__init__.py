"""Tabelas do banco. Cada módulo acrescenta as suas (seção 7 da documentação técnica do M1)."""

from suricate.models.acesso import RedefinicaoSenha, Sessao, TentativaAcesso
from suricate.models.base import Base
from suricate.models.onboarding import OnboardingProgresso
from suricate.models.sugestao import Sugestao
from suricate.models.usuario import Usuario

__all__ = [
    "Base",
    "OnboardingProgresso",
    "RedefinicaoSenha",
    "Sessao",
    "Sugestao",
    "TentativaAcesso",
    "Usuario",
]
