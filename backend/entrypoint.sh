#!/bin/sh
set -e

echo "Running database migrations..."
alembic upgrade head

echo "Seeding database (idempotent)..."
python seed.py

echo "Starting API server..."
# 0.0.0.0 so Railway's public edge (IPv4) can reach us; $PORT is injected by
# Railway, falls back to 8000 for docker-compose / local.
# ponytail: public-edge path. For Railway *private* networking you'd need --host ::
# (IPv6) + an nginx runtime resolver — skipped; revisit if traffic must stay internal.
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
