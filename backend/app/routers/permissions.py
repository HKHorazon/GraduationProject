from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import audit
from ..db import get_db
from ..models import Account, PagePermission, PermissionGroup
from ..pageperm import PAGE_KEYS, require_admin
from ..schemas import (
    PermissionGroupCreate,
    PermissionGroupUpdate,
    PermissionMatrix,
    PermLevel,
)

router = APIRouter()

_KEY_OK = set("abcdefghijklmnopqrstuvwxyz0123456789_-")


def _matrix(db: Session) -> PermissionMatrix:
    groups = db.scalars(
        select(PermissionGroup).order_by(PermissionGroup.sort, PermissionGroup.key)
    ).all()
    perms: dict[str, dict[str, str]] = {g.key: {} for g in groups}
    for row in db.scalars(select(PagePermission)).all():
        perms.setdefault(row.group_key, {})[row.page_key] = row.level
    return PermissionMatrix(groups=groups, perms=perms)


def _get_group(db: Session, key: str) -> PermissionGroup:
    group = db.get(PermissionGroup, key)
    if group is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Permission group not found")
    return group


def _next_key(db: Session, label: str) -> str:
    """Slug from the label when it is ASCII-safe, otherwise group{n}."""
    slug = "".join(c for c in label.lower().replace(" ", "_") if c in _KEY_OK)
    if slug and db.get(PermissionGroup, slug) is None:
        return slug
    nums = [
        int(g.key[5:]) for g in db.scalars(select(PermissionGroup)).all()
        if g.key.startswith("group") and g.key[5:].isdigit()
    ]
    return f"group{max(nums, default=0) + 1}"


# ---------- 權限矩陣 ----------
@router.get("", response_model=PermissionMatrix)
def get_permissions(db: Session = Depends(get_db)):
    # public: the frontend needs the map before login to know what a guest sees.
    return _matrix(db)


@router.put("", response_model=PermissionMatrix)
def update_permissions(
    body: dict[str, dict[str, PermLevel]],
    db: Session = Depends(get_db),
    actor: Account = Depends(require_admin),
):
    """Replace the whole matrix: {group_key: {page_key: level}}."""
    changed: dict[str, dict] = {}
    for group_key, pages in body.items():
        group = db.get(PermissionGroup, group_key)
        if group is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, f"分組 {group_key} 不存在")
        if group.is_admin:
            continue  # 管理員分組固定全權，不存進表裡
        for page_key, level in pages.items():
            # level 由 PermLevel 擋掉；page_key 只能是註冊過的頁面，
            # 免得前後端頁面清單走鐘時把垃圾 key 寫進表裡。
            if page_key not in PAGE_KEYS:
                raise HTTPException(status.HTTP_400_BAD_REQUEST, f"未知的頁面 {page_key}")
            row = db.get(PagePermission, {"group_key": group_key, "page_key": page_key})
            if row is None:
                db.add(PagePermission(group_key=group_key, page_key=page_key, level=level))
                changed.setdefault(group_key, {})[page_key] = {"old": None, "new": level}
            elif row.level != level:
                changed.setdefault(group_key, {})[page_key] = {"old": row.level, "new": level}
                row.level = level
    # 權限異動只進 db_logs，不是白名單事件（見 docs/異動紀錄種類.md）。
    if changed:
        audit.dblog(db, actor, "update", "page_permissions", None, changed)
    db.commit()
    return _matrix(db)


# ---------- 分組 ----------
@router.post("/groups", response_model=PermissionMatrix, status_code=status.HTTP_201_CREATED)
def create_group(
    body: PermissionGroupCreate,
    db: Session = Depends(get_db),
    actor: Account = Depends(require_admin),
):
    label = body.label.strip()
    if not label:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "分組名稱不可空白")
    if db.scalar(select(PermissionGroup).where(PermissionGroup.label == label)):
        raise HTTPException(status.HTTP_409_CONFLICT, f"分組「{label}」已存在")
    key = body.key or _next_key(db, label)
    if db.get(PermissionGroup, key):
        raise HTTPException(status.HTTP_409_CONFLICT, f"分組代碼 {key} 已存在")
    top = db.scalars(select(PermissionGroup)).all()
    group = PermissionGroup(
        key=key,
        label=label,
        is_admin=body.is_admin,
        builtin=False,
        sort=max((g.sort for g in top if not g.builtin), default=0) + 1,
    )
    db.add(group)
    audit.dblog(db, actor, "create", "permission_groups", key,
                {"label": label, "is_admin": body.is_admin})
    db.commit()
    return _matrix(db)


@router.patch("/groups/{key}", response_model=PermissionMatrix)
def update_group(
    key: str,
    body: PermissionGroupUpdate,
    db: Session = Depends(get_db),
    actor: Account = Depends(require_admin),
):
    group = _get_group(db, key)
    changes = body.model_dump(exclude_unset=True)
    if "label" in changes:
        label = (changes["label"] or "").strip()
        if not label:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "分組名稱不可空白")
        dup = db.scalar(select(PermissionGroup).where(PermissionGroup.label == label))
        if dup is not None and dup.key != key:
            raise HTTPException(status.HTTP_409_CONFLICT, f"分組「{label}」已存在")
        changes["label"] = label
    if "is_admin" in changes and group.builtin and group.is_admin and not changes["is_admin"]:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "內建管理員分組不可取消管理權")
    old = {f: getattr(group, f) for f in changes}
    for field, value in changes.items():
        setattr(group, field, value)
    if changes:
        audit.dblog(db, actor, "update", "permission_groups", key,
                    {f: {"old": old[f], "new": changes[f]} for f in changes})
    db.commit()
    return _matrix(db)


@router.delete("/groups/{key}", response_model=PermissionMatrix)
def delete_group(
    key: str,
    db: Session = Depends(get_db),
    actor: Account = Depends(require_admin),
):
    group = _get_group(db, key)
    if group.builtin:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"「{group.label}」是內建分組，不可刪除")
    in_use = db.scalars(select(Account).where(Account.role == key)).all()
    if in_use:
        names = "、".join(a.username for a in in_use[:5])
        more = f" 等 {len(in_use)} 個帳號" if len(in_use) > 5 else ""
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            f"分組「{group.label}」仍有帳號使用（{names}{more}），請先改掉這些帳號的分組",
        )
    for row in db.scalars(
        select(PagePermission).where(PagePermission.group_key == key)
    ).all():
        db.delete(row)
    db.delete(group)
    audit.dblog(db, actor, "delete", "permission_groups", key, {"label": group.label})
    db.commit()
    return _matrix(db)
