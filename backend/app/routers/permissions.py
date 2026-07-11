from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import audit
from ..db import get_db
from ..deps import require_super_admin
from ..models import Account, PagePermission
from ..schemas import PagePermission as PagePermissionSchema

router = APIRouter()

# page_key -> {viewer, editor}; the frontend registry is the source of page existence.
PermMap = dict[str, PagePermissionSchema]


def _dump(db: Session) -> dict[str, dict[str, bool]]:
    return {
        r.page_key: {"viewer": r.viewer, "editor": r.editor}
        for r in db.scalars(select(PagePermission)).all()
    }


@router.get("", response_model=PermMap)
def get_permissions(db: Session = Depends(get_db)):  # public: controls UI visibility only
    return _dump(db)


@router.put("", response_model=PermMap)
def update_permissions(
    body: PermMap,
    db: Session = Depends(get_db),
    actor: Account = Depends(require_super_admin),
):
    changed: dict[str, dict] = {}
    for page_key, perm in body.items():
        row = db.get(PagePermission, page_key)
        if row is None:
            db.add(PagePermission(page_key=page_key, viewer=perm.viewer, editor=perm.editor))
            changed[page_key] = {
                "viewer": {"old": None, "new": perm.viewer},
                "editor": {"old": None, "new": perm.editor},
            }
            continue
        entry: dict = {}
        if row.viewer != perm.viewer:
            entry["viewer"] = {"old": row.viewer, "new": perm.viewer}
            row.viewer = perm.viewer
        if row.editor != perm.editor:
            entry["editor"] = {"old": row.editor, "new": perm.editor}
            row.editor = perm.editor
        if entry:
            changed[page_key] = entry
    # Permission changes are db_logs only by design — never audit.event (see 異動紀錄種類.md).
    if changed:
        audit.dblog(db, actor, "update", "page_permissions", None, changed)
    db.commit()
    return _dump(db)
