"""Acesso (senha, Google, sessões), cadastro guiado e sugestões (M2).

Revision ID: 0002
Revises: 0001
Create Date: 2026-10-16
"""

import sqlalchemy as sa
from alembic import op

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def _datas() -> list[sa.Column]:
    return [
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("criado_em", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("atualizado_em", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    ]


def _do_usuario(tabela: str) -> list:
    return [
        sa.Column("usuario_id", sa.Uuid(), nullable=False),
        sa.ForeignKeyConstraint(
            ["usuario_id"], ["usuario.id"], name=f"fk_{tabela}_usuario_id_usuario", ondelete="CASCADE"
        ),
    ]


def upgrade() -> None:
    # batch: o SQLite dos testes não altera restrições de uma tabela existente
    with op.batch_alter_table("usuario") as t:
        t.add_column(sa.Column("apelido", sa.String(length=40), nullable=True))
        t.add_column(sa.Column("senha_hash", sa.String(length=255), nullable=True))
        t.add_column(sa.Column("google_sub", sa.String(length=255), nullable=True))
        t.add_column(sa.Column("email_verificado", sa.Boolean(), server_default=sa.false(), nullable=False))
        t.add_column(sa.Column("termos_versao", sa.String(length=20), nullable=True))
        t.add_column(sa.Column("termos_aceitos_em", sa.DateTime(timezone=True), nullable=True))
        t.add_column(sa.Column("papel", sa.String(length=10), server_default="usuario", nullable=False))
        t.create_unique_constraint("uq_usuario_google_sub", ["google_sub"])

    op.create_table(
        "sessao",
        sa.Column("token_hash", sa.String(length=64), nullable=False),
        sa.Column("expira_em", sa.DateTime(timezone=True), nullable=False),
        sa.Column("ultimo_uso_em", sa.DateTime(timezone=True), nullable=False),
        sa.Column("dispositivo", sa.String(length=120), nullable=True),
        *_datas(),
        *_do_usuario("sessao"),
        sa.PrimaryKeyConstraint("id", name="pk_sessao"),
        sa.UniqueConstraint("token_hash", name="uq_sessao_token_hash"),
    )
    op.create_index("ix_sessao_usuario_id", "sessao", ["usuario_id"])

    op.create_table(
        "redefinicao_senha",
        sa.Column("token_hash", sa.String(length=64), nullable=False),
        sa.Column("expira_em", sa.DateTime(timezone=True), nullable=False),
        sa.Column("usado_em", sa.DateTime(timezone=True), nullable=True),
        *_datas(),
        *_do_usuario("redefinicao_senha"),
        sa.PrimaryKeyConstraint("id", name="pk_redefinicao_senha"),
        sa.UniqueConstraint("token_hash", name="uq_redefinicao_senha_token_hash"),
    )
    op.create_index("ix_redefinicao_senha_usuario_id", "redefinicao_senha", ["usuario_id"])

    op.create_table(
        "tentativa_acesso",
        sa.Column("email", sa.String(length=254), nullable=False),
        sa.Column("ip", sa.String(length=45), nullable=False),
        sa.Column("sucesso", sa.Boolean(), nullable=False),
        *_datas(),
        sa.PrimaryKeyConstraint("id", name="pk_tentativa_acesso"),
    )
    op.create_index("ix_tentativa_acesso_email_criado_em", "tentativa_acesso", ["email", "criado_em"])
    op.create_index("ix_tentativa_acesso_ip_criado_em", "tentativa_acesso", ["ip", "criado_em"])

    op.create_table(
        "onboarding_progresso",
        sa.Column("etapa_atual", sa.Integer(), server_default="0", nullable=False),
        sa.Column("etapas", sa.JSON(), nullable=False),
        sa.Column("conquistas", sa.JSON(), nullable=False),
        sa.Column("concluido_em", sa.DateTime(timezone=True), nullable=True),
        *_datas(),
        *_do_usuario("onboarding_progresso"),
        sa.PrimaryKeyConstraint("id", name="pk_onboarding_progresso"),
        sa.UniqueConstraint("usuario_id", name="uq_onboarding_progresso_usuario_id"),
    )
    op.create_index("ix_onboarding_progresso_usuario_id", "onboarding_progresso", ["usuario_id"])

    op.create_table(
        "sugestao",
        sa.Column("codigo", sa.String(length=10), nullable=False),
        sa.Column("tipo", sa.String(length=10), nullable=False),
        sa.Column("titulo", sa.String(length=120), nullable=False),
        sa.Column("tela", sa.String(length=120), nullable=True),
        sa.Column("issue_numero", sa.Integer(), nullable=True),
        sa.Column("status", sa.String(length=20), server_default="recebida", nullable=False),
        sa.Column("status_lido_em", sa.DateTime(timezone=True), nullable=True),
        *_datas(),
        *_do_usuario("sugestao"),
        sa.PrimaryKeyConstraint("id", name="pk_sugestao"),
        sa.UniqueConstraint("codigo", name="uq_sugestao_codigo"),
    )
    op.create_index("ix_sugestao_usuario_id", "sugestao", ["usuario_id"])


def downgrade() -> None:
    for tabela in ("sugestao", "onboarding_progresso", "redefinicao_senha", "sessao"):
        op.drop_index(f"ix_{tabela}_usuario_id", table_name=tabela)
        op.drop_table(tabela)
    op.drop_index("ix_tentativa_acesso_ip_criado_em", table_name="tentativa_acesso")
    op.drop_index("ix_tentativa_acesso_email_criado_em", table_name="tentativa_acesso")
    op.drop_table("tentativa_acesso")
    with op.batch_alter_table("usuario") as t:
        t.drop_constraint("uq_usuario_google_sub", type_="unique")
        for coluna in (
            "papel",
            "termos_aceitos_em",
            "termos_versao",
            "email_verificado",
            "google_sub",
            "senha_hash",
            "apelido",
        ):
            t.drop_column(coluna)
