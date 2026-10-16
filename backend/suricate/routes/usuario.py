"""Perfil e exclusão da conta (RF04, D3 da documentação técnica do M2)."""

from typing import Annotated

from fastapi import APIRouter, HTTPException, Response, status
from pydantic import BaseModel, Field, StringConstraints

from suricate.deps import Banco, Config, UsuarioAtivo, UsuarioLogado
from suricate.seguranca import senha_confere
from suricate.services import acesso

router = APIRouter(prefix="/api/usuario", tags=["perfil"])


class Perfil(BaseModel):
    nome: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=120)] | None = None
    apelido: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=40)] | None = (
        None
    )


class Exclusao(BaseModel):
    senha: str | None = Field(default=None, max_length=128)
    confirmacao: str | None = Field(default=None, max_length=20)


@router.patch("")
def editar(dados: Perfil, usuario: UsuarioAtivo, db: Banco) -> dict:
    if dados.nome is not None:
        usuario.nome = dados.nome
    if dados.apelido is not None:
        usuario.apelido = dados.apelido
    db.commit()
    return acesso.resumo(db, usuario)


@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
def excluir(dados: Exclusao, response: Response, usuario: UsuarioLogado, db: Banco, settings: Config) -> None:
    """Apaga a conta e, pelo ON DELETE CASCADE, sessões, cadastro guiado e sugestões."""
    if usuario.senha_hash:
        if not senha_confere(dados.senha or "", usuario.senha_hash):
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Senha incorreta.")
    elif (dados.confirmacao or "").strip().upper() != "EXCLUIR":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Digite EXCLUIR para confirmar.")
    db.delete(usuario)
    db.commit()
    acesso.apagar_cookie(response, settings)
