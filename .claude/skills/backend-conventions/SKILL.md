---
name: backend-conventions
description: FastAPI backend conventions and endpoint template for this repo. MUST be read before adding or modifying any backend endpoint, model, schema, router, or migration. Guarantees identical output across models (Fable/Opus/Sonnet).
---

# Backend Conventions

Reference implementations — when unsure, copy from these, never invent:
- CRUD + audit: `backend/app/routers/students.py`, `backend/app/routers/groups.py`
- Audit helpers: `backend/app/audit.py` (docstring explains the two layers)
- Auth guards: `backend/app/deps.py`

## Endpoint template (the ONLY accepted shape)

```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import audit
from ..db import get_db
from ..pageperm import require_edit
from ..models import Account, Thing
from ..schemas import ThingCreate, ThingOut, ThingUpdate

router = APIRouter()  # registered in main.py: app.include_router(x.router, prefix="/things", tags=["things"])


@router.get("", response_model=list[ThingOut])
def list_things(db: Session = Depends(get_db)):          # reads: pick a guard, see rule 1
    return db.scalars(select(Thing)).all()


@router.post("", response_model=ThingOut, status_code=status.HTTP_201_CREATED)
def create_thing(
    body: ThingCreate,
    db: Session = Depends(get_db),
    actor: Account = Depends(require_edit("things", "data")),   # writes: ALWAYS a page guard
):
    if db.get(Thing, body.id):
        raise HTTPException(status.HTTP_409_CONFLICT, "Thing id already exists")
    thing = Thing(**body.model_dump())
    db.add(thing)
    audit.event(db, actor, "thing_create", f"新增 …（人話描述，含關鍵欄位）", ...)  # ONLY if whitelisted
    audit.dblog(db, actor, "create", "things", thing.id, body.model_dump())        # ALWAYS
    db.commit()                                            # exactly ONE commit, at the end
    db.refresh(thing)
    return thing


@router.patch("/{thing_id}", response_model=ThingOut)
def update_thing(
    thing_id: str,
    body: ThingUpdate,
    db: Session = Depends(get_db),
    actor: Account = Depends(require_edit("things", "data")),
):
    thing = db.get(Thing, thing_id)
    if not thing:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Thing not found")
    changes = body.model_dump(exclude_unset=True)          # PATCH = exclude_unset
    old = {f: getattr(thing, f) for f in changes}          # capture old values FIRST
    for field, value in changes.items():
        setattr(thing, field, value)
    # semantic audit.event(...) only for real, whitelisted changes (compare old vs new)
    audit.dblog(db, actor, "update", "things", thing.id,
                {f: {"old": old[f], "new": changes[f]} for f in changes})
    db.commit()
    db.refresh(thing)
    return thing
```

DELETE returns `status.HTTP_204_NO_CONTENT` and still writes `audit.dblog` before commit.

## Hard rules

1. **Auth**: the `/permissions` matrix is the only authority — `permission_groups` (freely editable; `Account.role` holds the group key) x `page_permissions` (`none` < `view` < `edit`). Guards live in `app/pageperm.py`:
   - writes → `require_edit(*pages)`, where `pages` is every screen that legitimately drives the endpoint (the check is an OR). Always needs a login.
   - page-specific reads (scores, history) → `require_view(*pages)`; no token counts as the `guest` group.
   - `students` / `groups` / `teachers` reads stay open — every screen pulls them via `data.loadAll()`, so they hide the personal part instead: `pageperm.hides_names(db, account, page)` (未登入 or level `none`) → return `mask_name`d copies of the **Pydantic** objects, never the ORM ones.
   - account + permission management → `require_admin` (any group flagged `is_admin`).
   Never a write endpoint without an `actor`. Never compare `account.role` to a string.
2. **Audit, two layers, both before commit**:
   - `audit.dblog()` — every write, no exceptions (including account changes and hard deletes).
   - `audit.event()` — only event keys whitelisted in `docs/異動紀錄種類.md`:
     `group_create / group_rename / group_teachers / group_leader / group_category / group_delete / student_create / student_join / student_move / student_leave / student_status / teacher_create`.
     `group_id` change → translate to join/move/leave (see `_record_membership_events` in students.py). Name/class fixes, `number`/`school_year` edits, account changes, hard deletes → db_logs only. New event key ⇒ update that doc in the same change.
   - Summaries are Traditional Chinese human sentences with `舊值 → 新值`, students shown as `姓名（學號）`, groups as `第N組`.
3. **Errors**: 404 missing / 409 duplicate / 400 bad input. `detail` shown to a form user → zh-TW (`學號 A11001 已存在`); internal → English (`Student not found`).
4. **Schemas** (`schemas.py`): `Base / Create / Update / Out` classes; `Create.id: str | None = None` when the server auto-generates (`s{n}`, `t{n}` pattern — see `_next_num`); `Out` has `model_config = ConfigDict(from_attributes=True)`; `Update` fields all `| None = None`.
5. **Style**: SQLAlchemy 2.0 (`select()`, `db.get`, `db.scalars`); no raw SQL; settings only via `app/config.py` (pydantic-settings), never hardcoded.
6. **Migrations**: any model change gets an Alembic revision in `alembic/versions/` (numbered `NNNN_slug.py` like existing ones) AND must keep `Base.metadata.create_all` working on SQLite for `dev_local.py` (circular FKs need `use_alter`, cf. `Group.leader_id`). Update `seed.py` if the shape changes.

## Verify before done

```powershell
cd d:\Projects_Others\GraduationProject\backend
.venv\Scripts\python.exe -m compileall -q app
```

Then restart the local backend (NO `--reload` — WatchFiles hangs on this Windows machine) and smoke-test the endpoint, e.g. via http://127.0.0.1:8000/docs or `/ship-local`. Editor login for testing: `chen` / `password`.
