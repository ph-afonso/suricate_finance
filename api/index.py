"""Entrada da Vercel: expõe o app FastAPI. O código fica em backend/; este é o único arquivo .py de api/."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

from suricate.main import app  # noqa: E402

__all__ = ["app"]
