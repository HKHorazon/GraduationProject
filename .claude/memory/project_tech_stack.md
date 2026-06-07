---
name: project-tech-stack
description: Tech stack and deployment decisions for the graduation project management system
metadata:
  type: project
---

Vue 3 + Vite frontend, self-built Python FastAPI backend over PostgreSQL 16, whole stack containerized with Docker Compose (frontend nginx + backend + db). Supabase and GitHub Pages were removed on 2026-06-06.

**Why:** User wants a real, long-running cloud backend in Python, and intends to self-host on their own server later. Portability is the guiding constraint — everything runs via `docker compose up` on any Linux host (cloud VPS now, e.g. DigitalOcean/Vultr, → own hardware later), with no cloud-vendor lock-in. Supabase was dropped because it ties auth/DB to a managed service; GitHub Pages dropped because it's static-only.

**How to apply:**
- Frontend never touches the DB. It calls the backend over `/api/*`. nginx proxies `/api` in prod; Vite `server.proxy` does it in dev (→ http://localhost:8000).
- One API client singleton: `src/lib/api.js` (JWT in localStorage, `Authorization: Bearer`). No scattered fetch base URLs.
- Auth = FastAPI-issued JWT (`backend/app/security.py`); roles super_admin/editor/viewer. Enforce server-side with the `require_editor` dependency on every write endpoint — frontend guards are UI only.
- Schema changes go through Alembic migrations (`backend/alembic`), never manual CREATE TABLE. Backend container entrypoint runs `alembic upgrade head` + idempotent `seed.py` on start.
- Router uses history mode (nginx SPA fallback). Vite `base: '/'`.
- Env via root `.env` (copy from `.env.example`); backend reads same values via pydantic-settings. Never commit secrets.

Key constraints:
- Role model: viewer (read-only, default) / editor / super_admin (full CRUD)
- String primary keys (s01, g1, t1, u1) to match seeded mock data
- Circular FK students.group_id ↔ groups.leader_id (handled in initial migration)
- Scale: 50–300 students
- Seeded accounts all use password "password" (dev only — change for prod)
