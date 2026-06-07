# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A graduation project management system for teachers to manage students and project group assignments. Most users can only view; a small number of editors can make changes. A Vue SPA talks to a self-built FastAPI backend over Postgres. The whole stack (frontend + backend + DB) is containerized with Docker Compose so it runs identically on a cloud VPS now and on a self-hosted server later.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vue 3 + Vite (served by nginx container) |
| Styling | TailwindCSS |
| Backend | Python + FastAPI + SQLAlchemy (Alembic migrations) |
| Database | PostgreSQL 16 (official image) |
| Auth & Permissions | FastAPI-issued JWT + role check (editor vs. viewer) |
| Orchestration | Docker Compose |
| Hosting | Cloud VPS (DigitalOcean / Vultr) now → self-hosted server later |

> Portability is the guiding constraint: avoid cloud-vendor-specific services. Everything must run via `docker compose up` on any Linux host.

## Project Structure

Monorepo: `frontend/` (Vue) and `backend/` (FastAPI) are siblings; the root holds
only orchestration/config.

```
frontend/             # Vue app
  src/
    assets/           # Static assets
    components/        # Reusable Vue components
    lib/              # api.js — single API client (JWT, calls /api/*)
    router/           # Vue Router (history mode)
    stores/           # Pinia stores (auth, data, permissions, theme)
    views/            # Page-level components
  index.html
  package.json
  vite.config.js      # base '/', dev proxy /api -> :8000
  tailwind.config.js  postcss.config.js
  Dockerfile          # builds Vue, serves via nginx
  nginx.conf          # SPA fallback + /api proxy to backend

backend/              # FastAPI app
  app/
    main.py           # app + router registration + CORS
    config.py         # env-driven settings (pydantic-settings)
    db.py             # SQLAlchemy engine, session, Base
    security.py       # bcrypt hashing + JWT
    deps.py           # auth guards: get_current_account / require_editor / require_super_admin
    models.py         # SQLAlchemy ORM models
    schemas.py        # Pydantic request/response schemas
    routers/          # auth, students, groups, teachers, accounts
  alembic/            # DB migrations (entrypoint runs `upgrade head`)
  seed.py             # base seed data
  seed_fake.py        # extra fake data for demos
  dev_local.py        # SQLite dev runner (no Docker/Postgres)
  entrypoint.sh       # migrate + seed + uvicorn (container)
  Dockerfile  requirements.txt

docker-compose.yml    # frontend + backend + db
.env.example          # copy to .env and fill in
```

## Common Commands

```bash
# --- Whole stack (Docker, production-like) ---
cp .env.example .env          # first time only
docker compose up --build     # frontend(:8080) + backend(:8000) + db(:5432, localhost-only)
docker compose down
docker compose logs -f backend

# --- Local dev WITHOUT Docker (this machine has no Docker/Postgres) ---
# Use /ship-local, or manually:
#   backend (SQLite stand-in DB):
cd backend && python -m venv .venv && .venv/Scripts/python.exe -m pip install -r requirements.txt
$env:DATABASE_URL="sqlite:///./local_dev.db"; .venv/Scripts/python.exe dev_local.py   # create + seed
.venv/Scripts/python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000          # no --reload on Windows
#   frontend:
cd frontend && npm install && npm run dev    # Vite :5173, proxies /api -> :8000

# --- DB migrations (Alembic, Postgres) ---
cd backend
alembic revision --autogenerate -m "message"
alembic upgrade head

# --- Data portability (move between hosts) ---
docker compose exec db pg_dump -U app graduation > backup.sql
# restore: cat backup.sql | docker compose exec -T db psql -U app graduation
```

## Key Architecture Notes

### Frontend → Backend
The frontend never talks to the DB directly. It calls the backend over `/api/*`. In production nginx proxies `/api/` to the `backend` container (see `frontend/nginx.conf`); in dev Vite proxies `/api` to `http://localhost:8000` (`frontend/vite.config.js`). Keep one API client singleton in `frontend/src/lib/api.js` — do not scatter `fetch` base URLs.

### Backend
- FastAPI app lives in `backend/app`; register routers in `app/main.py`.
- Settings come from env via `pydantic-settings` (`app/config.py`) — never hardcode secrets or connection strings.
- DB access through SQLAlchemy sessions (`app/db.py`, `get_db` dependency). Schema changes go through Alembic migrations, never manual `CREATE TABLE` in app code.

### Environment Variables
Copy `.env.example` to `.env` (gitignored) at the repo root; Compose reads it. Backend reads the same values via `pydantic-settings`. Key vars: `POSTGRES_USER/PASSWORD/DB`, `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGINS`. Never commit real secrets.

### Vue Router
Use **history mode** (`createWebHistory`). nginx has SPA fallback (`try_files ... /index.html`) so deep links work. (Hash mode is no longer required since we self-host instead of GitHub Pages.)

### Auth & Role-Based Access
- The backend issues a JWT on login (`JWT_SECRET`); the frontend stores it and sends it as `Authorization: Bearer <token>`.
- A user's role (editor vs. viewer) is stored in the DB and embedded in the token / looked up per request.
- Enforce access **server-side** with a FastAPI dependency that checks the role on every mutating endpoint — do not rely on frontend guards alone. The frontend only shows/hides UI for UX.

### Permissions Model
- **Viewer** (default): read-only access to students, projects, groups.
- **Editor**: can create, update, delete records.
- Enforced by a backend role-check dependency on write endpoints.

## Deployment (Docker on a VPS / self-hosted server)

The same compose file runs everywhere — that's the point.

```bash
# on the server
git clone <repo> && cd GraduationProject
cp .env.example .env          # set strong POSTGRES_PASSWORD + JWT_SECRET
docker compose up -d --build
```

Put a reverse proxy (the included nginx, or host-level Caddy/Traefik) in front for TLS.
Moving to your own hardware later = clone repo + copy `.env` + restore `pg_dump` + `docker compose up`. No vendor lock-in.
