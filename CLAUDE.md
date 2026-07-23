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

## Coding Conventions (BINDING — every model working on this repo MUST follow these exactly)

These rules exist so that any model (Fable / Opus / Sonnet) produces the same output.
When in doubt, copy the pattern from the reference file named in each rule — do not invent a new pattern.
Detailed templates live in two project skills: **backend-conventions** and **frontend-conventions**. Read the relevant one before writing code.

### Language & Domain

- **All UI-visible text is Traditional Chinese (zh-TW).** Code identifiers and most comments are English; short Chinese comments are fine where surrounding code already uses them.
- Roles: `super_admin` > `editor` > `viewer` (strings on `Account.role`). Editor check = `deps.require_editor` (accepts super_admin too); account management = `require_super_admin`.
- School years are ROC strings (`"113"`, `"114"`). Display always goes through `rocYear()` / `yearClass()` in `frontend/src/lib/year.js`.
- Internal PKs are strings: students `s{n}`, groups `g{n}`, teachers `t{n}`, accounts `u{n}` (server auto-generates when omitted). `student_id` (學號, e.g. `A11001`) is the human-facing unique ID. A group's display label is `第{number}組`.
- Page registry (sidebar label ↔ route ↔ permission key) lives in `frontend/src/stores/permissions.js` (`PAGES`): students 學生列表, groups 組別列表, remove-student 學生更動, group-change 組別異動, documents 文件輸入, documents-export 文件輸出, data 資料管理, audit-logs 異動紀錄; plus super_admin-only /accounts 帳號管理 and /permissions 權限設定.
- Seed logins (password `password`): `admin` super_admin · `chen`/`lin` editor · `wang`/`huang` viewer. Browsing works logged-out (names masked).

### Backend rules (reference files: `routers/students.py`, `routers/groups.py`)

1. **Every mutating endpoint** takes `actor: Account = Depends(require_editor)` (or `require_super_admin`). Read endpoints take no auth.
2. **Audit is two layers, both written before the single `db.commit()`** (helpers in `app/audit.py`):
   - `audit.dblog(...)` — ALWAYS, for every create/update/delete/import, payload = changed fields with old/new values.
   - `audit.event(...)` — ONLY for the semantic events whitelisted in `docs/異動紀錄種類.md` (group_create/rename/teachers/leader/category/delete, student_create/join/move/leave/status, teacher_create). group_id change is translated to join/move/leave; name/class fixes, number/school_year edits, account changes, and hard deletes go to db_logs only. A new event type must be added to that doc in the same change.
3. One `db.commit()` at the end of the endpoint, `db.refresh()` before returning. SQLAlchemy 2.0 style (`select()`, `db.get`, `db.scalars`).
4. PATCH uses `body.model_dump(exclude_unset=True)`; capture old values first; log only fields that actually changed.
5. Status codes: POST 201, DELETE 204, missing 404, duplicate 409, bad input 400. Error `detail` that a user will see in a form is Traditional Chinese (e.g. `學號 X 已存在`); internal ones stay English (`Student not found`).
6. Schemas follow the `Base / Create / Update / Out` pattern in `schemas.py` (`from_attributes=True` on Out). New routers register in `main.py` with prefix + tag.
7. Schema change = Alembic migration in `alembic/versions/` AND `models.py` must stay `metadata.create_all`-able on SQLite for `dev_local.py` (see the `use_alter` note on `Group.leader_id`). Update `seed.py` when shapes change.

### Frontend rules (reference files: `views/StudentsView.vue`, `stores/data.js`)

1. HTTP only through the `api` singleton (`src/lib/api.js`). Domain data only through `useDataStore`; after a mutation, update the store array in place (push / replace-by-id / filter) — never refetch everything.
2. A new page = 5 touchpoints, all required: view in `src/views/` (`<script setup>`, content wrapped in `<AppLayout>`) → lazy route in `router/index.js` → entry in `PAGES` + `DEFAULT_PERMISSIONS` (`stores/permissions.js`) → sidebar item in `AppSidebar.vue` gated by `perms.canAccess(key, auth.role)`.
3. Write-UI is hidden with `auth.isEditor` / `auth.isSuperAdmin` — UX only; the backend check is the real guard.
4. Student and group names render through the `StudentName` / `GroupName` components (they handle logged-out masking via `maskName` and editor click-through). Never print a raw student name directly.
5. Icons: `lucide-vue-next` only. No new UI/component/CSS libraries.
6. Styling: Tailwind + the shared component classes in `src/assets/main.css` (`.card .input .btn-primary .btn-secondary .btn-danger .label .id-mono`). **Every screen must look correct in BOTH themes** — dark is the default (Dark Tech), light is warm parchment (`darkMode: 'class'`). Never build a screen for one theme only.

   | Token | Dark (default) | Light (parchment) |
   |---|---|---|
   | page bg | `#0f1117` | `#ece3cf` |
   | sidebar/section | `#161b27` | `#f7f1e1` |
   | card | `#1e2535` (`dark-card`) | `#f7f1e1` |
   | border | `#2a3347` (`dark-border`) | `#ddd0b3` |
   | accent | `#00d4ff` cyan (`accent`) | `#00b3d8` / text `#0e7490` |
   | fonts | `font-display` Space Grotesk · `font-sans` DM Sans/Noto Sans TC · `font-mono` Fira Code | same |

   Table headers: `text-[10px] font-mono uppercase tracking-widest text-slate-500`. Badges: 已分組 cyan (`border-cyan-500/40 bg-cyan-400/10 text-cyan-400`), 未分組 slate, INACTIVE amber.

### Definition of Done (run these BEFORE claiming a task complete or committing)

- Frontend touched → `cd frontend && npm run build` must pass.
- Backend touched → `backend/.venv/Scripts/python.exe -m compileall -q app` must pass, then restart uvicorn (**no `--reload` on Windows** — it hangs) and smoke-test the changed endpoint.
- Full-stack verification: `/ship-local` starts backend (:8000, SQLite) + frontend (:5173).
- UI checked in both dark and light themes; all visible text zh-TW.
- No leftover `console.log`/debug prints; no secrets in the diff.
- Commit/push only through the `/git-push` flow when the user asks.

### Design docs (consult before touching the related area)

- `docs/異動紀錄種類.md` — audit event whitelist + audit_logs/db_logs design (authoritative).
- `docs/文件專區設計規劃.md` — documents 專區 form → preview → execute flow.
- `docs/schema.md`, `docs/er-model.md` — DB schema reference.
- `DEPLOY.md` — Railway/VPS deployment gotchas.

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

### Railway (current hosting) — deploy is CLI, not auto-on-push
The Railway services are **not** wired to GitHub auto-deploy. `git push origin master` only
syncs GitHub; the live site keeps serving the old build until you run `railway up`. `/ship`
handles this: after the push it runs `railway up --service <changed svc> --ci` (from the
service's subdirectory) and verifies the live bundle. See `DEPLOY.md` for the gotchas.
