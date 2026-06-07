---
name: ship-local
description: Start the full local stack (FastAPI backend + Vite frontend) and display the URLs. Use when the user types /ship-local.
---

# Ship Local

Start the **whole app locally**: FastAPI backend (port 8000, SQLite stand-in DB)
and the Vite frontend (5173). This machine has no Docker/Postgres, so the backend
runs against a local SQLite file — behavior is identical to the Docker/Postgres
production setup.

Project root: `d:\Projects_Others\GraduationProject`
Frontend lives in `frontend/`, backend in `backend/`.
Backend venv python: `backend\.venv\Scripts\python.exe`
Local DB file: `backend\local_dev.db`

## Steps

### 1. First-time setup (skip if already done)
- If `backend\.venv` is missing, create it and install deps:
  ```powershell
  cd "d:\Projects_Others\GraduationProject\backend"
  python -m venv .venv
  .\.venv\Scripts\python.exe -m pip install -q -r requirements.txt
  
  ```
  (Note: `requirements.txt` lists `psycopg`/`alembic` for Postgres. The SQLite dev
  run does not need them — if a wheel fails to build on this machine, install just
  the subset: `fastapi "uvicorn[standard]" sqlalchemy pydantic-settings "python-jose[cryptography]" bcrypt python-multipart`.)
- If `backend\local_dev.db` is missing, create tables + seed:
  ```powershell
  cd "d:\Projects_Others\GraduationProject\backend"
  $env:DATABASE_URL="sqlite:///./local_dev.db"; .\.venv\Scripts\python.exe dev_local.py
  ```
  To also load richer fake data: `.\.venv\Scripts\python.exe seed_fake.py`

### 2. Start the BACKEND (always restart so latest code runs)
- Free port 8000 first (kill any prior uvicorn, including orphaned reload workers):
  ```powershell
  Get-CimInstance Win32_Process -Filter "Name='python.exe'" |
    Where-Object { $_.CommandLine -like '*uvicorn*' } |
    ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
  ```
  If `Get-NetTCPConnection -LocalPort 8000` still shows a Listen owned by a dead
  PID, find the live owner via `Get-CimInstance Win32_Process -Filter "Name='python.exe'"`
  (look at ParentProcessId) and kill it.
- Start it in the **background** (no `--reload` — WatchFiles hangs on Windows here):
  ```bash
  cd "d:/Projects_Others/GraduationProject/backend" && \
  DATABASE_URL="sqlite:///./local_dev.db" JWT_SECRET="dev-secret" CORS_ORIGINS="http://localhost:5173" \
  ./.venv/Scripts/python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
  ```
- Confirm: `Invoke-RestMethod http://127.0.0.1:8000/health` returns `{status: ok}`.

### 3. Start the FRONTEND
- Start a **new** Vite dev server in the background (from `frontend/`):
  ```bash
  cd "d:/Projects_Others/GraduationProject/frontend" && npm run dev
  ```
- Wait ~4s, then scan ports 5173–5182 and pick the **highest** one returning HTTP 200
  (that's the newest server). Vite proxies `/api` → `http://localhost:8000`.

### 4. Report
Show both URLs and the test logins.

## Final Message

> Local stack running:
> - **Frontend (open this): http://localhost:PORT/**
> - Backend API docs: http://localhost:8000/docs
>
> Logins (password `password`): `admin` (super_admin) · `chen` (editor) · `wang` (viewer).
> Browsing works without logging in.

## Notes
- Backend has no `--reload`: after changing **backend** code, re-run step 2 to restart it.
- Frontend changes hot-reload automatically (no restart needed).
- To reset data: delete `backend\local_dev.db`, then redo step 1's DB seed.
