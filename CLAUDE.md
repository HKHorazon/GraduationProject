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
    deps.py           # token -> Account (get_current_account / _optional)
    pageperm.py       # the permission matrix guards: require_edit / require_view / require_admin
    privacy.py        # mask_name (未登入／無權檢視時的姓名遮蔽)
    models.py         # SQLAlchemy ORM models
    schemas.py        # Pydantic request/response schemas
    routers/          # auth, students, groups, teachers, accounts, permissions, reviews, audit
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
Detailed templates live in project skills — read the relevant one before writing code:
**backend-conventions**（後端模板）·**frontend-conventions**（前端模板）·
**web-color**（顏色／對比度）·**web-display**（排版）·**web-excel**（Excel）·**web-docx**（Word）。

### Language & Domain

- **All UI-visible text is Traditional Chinese (zh-TW).** Code identifiers and most comments are English; short Chinese comments are fine where surrounding code already uses them.
- **Permissions are data, not code.** `permission_groups` holds freely creatable groups (`Account.role` stores the group `key`); `page_permissions` holds one `level` per (group, page) — `none` < `view` < `edit`. Two groups are builtin and undeletable: `guest` (every request with no token) and the `is_admin` group (full access + 帳號管理／權限設定). Seeded groups: guest 未登入訪客 · viewer 檢視者 · editor 編輯者 · super_admin 系統管理員 — the middle two are ordinary, deletable groups. There is no hardcoded role check anywhere: guards are `pageperm.require_edit(*pages)` / `require_view(*pages)` / `require_admin`.
- School years are ROC strings (`"113"`, `"114"`). Display always goes through `rocYear()` / `yearClass()` in `frontend/src/lib/year.js`.
- Internal PKs are strings: students `s{n}`, groups `g{n}`, teachers `t{n}`, accounts `u{n}` (server auto-generates when omitted). `student_id` (學號, e.g. `A11001`) is the human-facing unique ID. A group's display label is `第{number}組`.
- Page registry (sidebar label ↔ route ↔ permission key) lives in `frontend/src/stores/permissions.js` (`PAGES`): students 學生列表, groups 組別列表, remove-student 學生更動, group-change 組別異動, group-order 組別排序, documents 文件輸入, documents-export 文件輸出, reviews 審查評分, data 資料管理, audit-logs 異動紀錄, password 修改密碼; plus admin-only /accounts 帳號管理 and /permissions 權限設定. A page marked `editOnly: true` (remove-student, group-change, documents, data) is pure action — 唯讀 there is meaningless, so its cell cycles none ↔ edit only and its view gates on `canEdit`. The same list is mirrored in `backend/app/pageperm.py` and `backend/seed.py`.
- Seed logins (password `password`): `admin` super_admin · `chen`/`lin` editor · `wang`/`huang` viewer. Browsing works logged-out (names masked).

### Backend rules (reference files: `routers/students.py`, `routers/groups.py`)

1. **Every mutating endpoint** takes `actor: Account = Depends(pageperm.require_edit(*pages))` — `pages` is the set of screens that legitimately drive that endpoint, and the guard passes if ANY of them grants `edit` (e.g. `PATCH /students` is reachable from 學生列表, 學生更動, 組別異動 and 資料管理). Account/permission management uses `pageperm.require_admin`.
   **Read endpoints are never "no auth"** — pick one of three, and state which in the endpoint:
   - open + masked: `account: Account | None = Depends(get_current_account_optional)`, and when `account is None` return names through `privacy.mask_name`. Only `students`, `groups`, `teachers` — every screen pulls them via `data.loadAll()`, so gating them on one page would break the others;
   - login required: `Depends(get_current_account)`;
   - page-gated: `Depends(pageperm.require_view(*pages))` — anything carrying scores, comments or history (`reviews`, `audit-logs`). Logged-out counts as the `guest` group, so a page opened to guests stays public.

   Masking is applied on the **Pydantic** object, never on the ORM instance — `StudentOut.model_validate(s).model_copy(update={"name": mask_name(s.name)})`. Mutating the ORM object writes the masked name back to the DB on flush (see the comment in `routers/students.py:62`).
2. **Audit is two layers, both written before the single `db.commit()`** (helpers in `app/audit.py`):
   - `audit.dblog(...)` — ALWAYS, for every create/update/delete/import, payload = changed fields with old/new values.
   - `audit.event(...)` — ONLY for the semantic events whitelisted in `docs/異動紀錄種類.md` (group_create/rename/teachers/leader/category/delete, student_create/join/move/leave/status, teacher_create). group_id change is translated to join/move/leave; name/class fixes, number/school_year edits, account changes, and hard deletes go to db_logs only. A new event type must be added to that doc in the same change.
3. One `db.commit()` at the end of the endpoint, `db.refresh()` before returning. SQLAlchemy 2.0 style (`select()`, `db.get`, `db.scalars`).
4. PATCH uses `body.model_dump(exclude_unset=True)`; capture old values first; log only fields that actually changed.
5. Status codes: POST 201, DELETE 204, missing 404, duplicate 409, bad input 400. Error `detail` that a user will see in a form is Traditional Chinese (e.g. `學號 X 已存在`); internal ones stay English (`Student not found`).
6. Schemas follow the `Base / Create / Update / Out` pattern in `schemas.py` (`from_attributes=True` on Out). New routers register in `main.py` with prefix + tag.
7. Schema change = Alembic migration in `alembic/versions/` AND `models.py` must stay `metadata.create_all`-able on SQLite for `dev_local.py` (see the `use_alter` note on `Group.leader_id`). Update `seed.py` when shapes change.
8. **PK generation stays server-side.** Each router keeps a private `_next_num(db)` that scans existing PKs and returns `max+1` (`routers/students.py:44`); the endpoint builds `f"s{_next_num(db)}"` when the body omits `id`. A client-supplied `id` is allowed only after a `db.get(...)` existence check → 409. Never use UUIDs, autoincrement, or `len(rows)+1`.
9. **Uniqueness is checked in the endpoint, not left to the DB.** `db.scalar(select(Model).where(...))` before insert → 409 with a zh-TW detail naming the value (`學號 {sid} 已存在`). Do not rely on catching `IntegrityError`.
10. **Bulk import** (`POST /{resource}/bulk`): reject an empty body with 400 `沒有可匯入的資料`; validate every row *before* the first `db.add`, including duplicates *within* the payload (`seen` set); row errors are 1-indexed zh-TW (`第 {i} 列學號 {sid} 重複`). Audit = one `audit.dblog(..., "import", table, None, {"count": n, ...})` plus one `audit.event` per created row. Still one `db.commit()`.
11. **Routers hold endpoints and their private `_helpers` only.** Anything shared crosses through a module in `app/` (`audit.py`, `privacy.py`, `security.py`, `deps.py`) — a router must never import another router. A helper needed by a second router moves up to `app/` in the same change.
12. **Response shape is always a schema from `schemas.py`** via `response_model=` — never a hand-built `dict` or a raw ORM object without a declared model. 204 endpoints return `None`.

### Frontend rules (reference files: `views/StudentsView.vue`, `stores/data.js`)

1. HTTP only through the `api` singleton (`src/lib/api.js`). Domain data only through `useDataStore`; after a mutation, update the store array in place (push / replace-by-id / filter) — never refetch everything.
2. A new page = 5 touchpoints, all required: view in `src/views/` (`<script setup>`, content wrapped in `<AppLayout>`) → lazy route in `router/index.js` → entry in `PAGES` + `DEFAULT_PERMISSIONS` (`stores/permissions.js`) → sidebar item in `AppSidebar.vue` gated by `perms.canAccess(key, auth.role)`.
3. Write-UI is hidden with `perms.canEdit('<page-key>', auth.role)`; whole-page access with `perms.canAccess(...)` (`<NoAccess>` in `components/common/`). `auth.isAdmin` only for 帳號管理／權限設定. **Never branch on a role string** (`role === 'editor'`) — that was the bug where granting a page did nothing. UX only; the backend check is the real guard.
4. Student and group names render through the `StudentName` / `GroupName` components (they handle logged-out masking via `maskName` and editor click-through). Never print a raw student name directly.
5. Icons: `lucide-vue-next` only. No new UI/component/CSS libraries.
6. Styling: Tailwind + the shared component classes in `src/assets/main.css` (`.card .input .btn-primary .btn-secondary .btn-danger .label .id-mono`). **Every screen must look correct in BOTH themes** — dark is the default (Dark Tech), light is Tech Grey（灰底帶一點藍）(`darkMode: 'class'`). Never build a screen for one theme only.

   **顏色與排版有各自的 skill，動手前必讀 —— 不要靠記憶配色：**
   - **`web-color`** — 唯一色票、已量測的對比度、禁止事項。摘要：弱化文字一律 `text-slate-600 dark:text-slate-400`；淺色模式的狀態文字用 `-700`/`-800` 級（`cyan-800`/`red-700`/`amber-800`/`emerald-800`/`blue-700`），**亮青 `#00b3d8` 不能當文字也不能配白字**；`.vue` 內禁止原始 hex；每個 `bg-`/`text-`/`border-` 都要有 `dark:` 對子；禁止再加 `main.css` 的 `!important` 補丁。違規用 `node scripts/check-colors.mjs` 掃得出來。
   - **`web-display`** — 頁面骨架、間距／字級尺標、表格／表單／篩選列／彈窗／空狀態的固定寫法、圖示尺寸、z-index 三階、RWD 檢查點。

   色票**只有 `web-color` 一份**（這裡不再複製一張表——複製過的那張已經跟實際配色走鐘過一次：
   淺色早就從羊皮紙換成 Tech Grey 灰藍，CLAUDE.md 卻還寫著 `#ece3cf`）。
   字型固定：`font-display` Space Grotesk · `font-sans` DM Sans/Noto Sans TC · `font-mono` Fira Code。

   Table headers: `text-[10px] font-mono uppercase tracking-widest text-slate-600 dark:text-slate-400`. Badges: 已分組 cyan, 未分組 slate, INACTIVE amber — 兩個主題的完整寫法見 `web-color`。

7. **File generation uses the two libraries already installed**: Excel = `xlsx-js-style` (styling included — never add `sheetjs`/`exceljs`), Word = `docx`. Both have their own binding skill, read it before writing generation code:
   - **`web-excel`** — 檔名／工作表命名、`!cols` 欄寬、樣式常數、`!merges` 雙層表頭、匯入 `sheet_to_json(ws, { defval: '' })` + 逐列 `_error` 預覽。
   - **`web-docx`** — **只能用 `WidthType.DXA`**（`PERCENTAGE` 會產生 Word 判定毀損的檔案）、twips 版面換算、中文字型要 `eastAsia`、字級是半點、`tableHeader`/`cantSplit` 跨頁重印、`URL.revokeObjectURL` 必收。
   - 產出的 Excel/Word 是**紙本**：固定白底黑字，與畫面主題無關。
8. **Sheet/document layout logic lives in `src/lib/*.js`, not in the view** (`lib/reviewSheet.js`, `lib/attendanceYearDoc.js`), written as pure functions taking a `ctx` — no store, no DOM. The view only gathers state, calls `build…()`, and triggers the download. Such a lib ships one runnable self-check next to it — `lib/test_reviewSheet.mjs` is the pattern: plain `node:assert/strict`, round-trip (build → write → read → parse), run with `node src/lib/test_xxx.mjs`, no test framework.
9. **Dialogs are hand-rolled in the view**: a `fixed inset-0` overlay + `.card` panel (`AccountsView.vue`, `GroupsView.vue`). No modal component, no dialog library. A destructive action confirms with the native `confirm()` and a zh-TW question that names the object and its side effects (`確定刪除「X」？該審查的所有評分會一併刪除。`).
10. **Feedback is local refs rendered inline**, next to the action that produced it: `const message = ref('')` / `const error = ref('')`, cleared at the start of each action. No toast library, no global notification store, no `alert()`.
11. **Every list/table needs an empty state** — a centered row `<td :colspan="n" class="px-4 py-10 text-center text-sm text-slate-400">尚無…</td>`. When a filter is active the text says 沒有符合的… instead of 尚無…, so "no data" and "no match" stay distinguishable.
12. Imports use the `@/` alias (`@/lib/api`, `@/stores/data`) — no `../../` chains. Pages are flat in `src/views/`; multi-step 異動 flows go in `src/views/changes/`.

### Definition of Done (run these BEFORE claiming a task complete or committing)

- Frontend touched → `cd frontend && npm run build` **and** `node scripts/check-colors.mjs` must both pass.
- Backend touched → `backend/.venv/Scripts/python.exe -m compileall -q app` must pass, then restart uvicorn (**no `--reload` on Windows** — it hangs) and smoke-test the changed endpoint.
- Auth/permissions touched → `backend/.venv/Scripts/python.exe backend/test_pageperm.py` against a running local backend must pass (it exercises guest/viewer/editor/admin, level changes taking effect, and group CRUD).
- `frontend/src/lib/` touched → its self-check must pass (`cd frontend && node src/lib/test_reviewSheet.mjs`); new logic there ships its own.
- A read endpoint touched → verify it **logged out** as well as logged in (masking / 401 / 403 is the point of rule 1).
- Full-stack verification: `/ship-local` starts backend (:8000, SQLite) + frontend (:5173).
- UI checked in both dark and light themes; all visible text zh-TW.
- No leftover `console.log`/debug prints; no secrets in the diff.
- Commit/push only through the `/git-push` flow when the user asks.

### Design docs (consult before touching the related area)

- `docs/異動紀錄種類.md` — audit event whitelist + audit_logs/db_logs design (authoritative).
- `docs/文件專區設計規劃.md` — documents 專區 form → preview → execute flow.
- `docs/er-model.md` — DB schema reference (mermaid ER, 由 models.py 整理).
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
