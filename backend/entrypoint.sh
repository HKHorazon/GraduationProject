#!/bin/sh
set -e

echo "Running database migrations..."
alembic upgrade head

echo "Seeding database (idempotent)..."
python seed.py

echo "Starting API server..."
# --host :: binds IPv6 dual-stack (Railway's private network is IPv6); $PORT is
# injected by Railway, falls back to 8000 for docker-compose / local.
exec uvicorn app.main:app --host :: --port "${PORT:-8000}"
