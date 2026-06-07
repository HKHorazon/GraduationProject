"""Local dev runner WITHOUT Docker/Postgres.

Uses a SQLite file as a stand-in database so the full app can run on a machine
that only has Python. Production still uses Postgres via docker-compose — this
file is only a convenience for local demos.

Usage:
    DATABASE_URL is forced to sqlite here, then:
        python dev_local.py          # create tables + seed, then exit
        uvicorn app.main:app --reload --port 8000   # (run with same env)
"""
import os

os.environ.setdefault("DATABASE_URL", "sqlite:///./local_dev.db")

from app.db import Base, engine  # noqa: E402
from app import models  # noqa: F401,E402  (register models on Base.metadata)


def init_and_seed() -> None:
    Base.metadata.create_all(engine)
    from seed import seed

    seed()


if __name__ == "__main__":
    init_and_seed()
