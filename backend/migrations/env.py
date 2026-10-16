"""Ambiente do Alembic: usa a conexão direta do Neon (sem PgBouncer), que as migrações exigem."""

from alembic import context

from suricate.config import get_settings
from suricate.db import get_engine
from suricate.models import Base

settings = get_settings()
url = settings.database_url_direct or settings.database_url
if not url:
    raise SystemExit("Defina DATABASE_URL_DIRECT (ou DATABASE_URL) para rodar as migrações.")

with get_engine(url).connect() as conexao:
    context.configure(connection=conexao, target_metadata=Base.metadata, compare_type=True)
    with context.begin_transaction():
        context.run_migrations()
    conexao.commit()
