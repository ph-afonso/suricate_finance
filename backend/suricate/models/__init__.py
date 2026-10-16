"""Tabelas do banco. Cada módulo acrescenta as suas (seção 7 da documentação técnica do M1)."""

from suricate.models.base import Base
from suricate.models.usuario import Usuario

__all__ = ["Base", "Usuario"]
