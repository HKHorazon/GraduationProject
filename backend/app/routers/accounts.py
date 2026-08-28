from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import audit
from ..db import get_db
from ..pageperm import GUEST_GROUP, require_admin
from ..models import Account, PermissionGroup
from ..schemas import AccountCreate, AccountOut, AccountUpdate
from ..security import hash_password

router = APIRouter()


def _check_group(db: Session, key: str | None) -> None:
    """role 存的是 permission_groups.key —— 不存在的分組直接擋掉，
    否則帳號會落到一個誰都查不到的分組（pageperm 會給 none）。"""
    if key is None:
        return
    group = db.get(PermissionGroup, key)
    if group is None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"權限分組 {key} 不存在")
    if group.key == GUEST_GROUP:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "「未登入訪客」不能指派給帳號")


def _is_admin(db: Session, key: str | None) -> bool:
    group = db.get(PermissionGroup, key) if key else None
    return group is not None and group.is_admin


def _next_id(db: Session) -> str:
    ids = db.scalars(select(Account.id)).all()
    nums = [int(i[1:]) for i in ids if i.startswith("u") and i[1:].isdigit()]
    return f"u{(max(nums) + 1) if nums else 1}"


@router.get("", response_model=list[AccountOut])
def list_accounts(db: Session = Depends(get_db), _=Depends(require_admin)):
    return db.scalars(select(Account)).all()


@router.post("", response_model=AccountOut, status_code=status.HTTP_201_CREATED)
def create_account(
    body: AccountCreate,
    db: Session = Depends(get_db),
    actor: Account = Depends(require_admin),
):
    if db.scalar(select(Account).where(Account.username == body.username)):
        raise HTTPException(status.HTTP_409_CONFLICT, "Username already exists")
    _check_group(db, body.role)
    account = Account(
        id=_next_id(db),
        username=body.username,
        password_hash=hash_password(body.password),
        role=body.role,
        active=body.active,
        teacher_id=body.teacher_id,
    )
    db.add(account)
    # account changes never appear in the human timeline — db_logs only
    audit.dblog(db, actor, "create", "accounts", account.id,
                {"username": account.username, "role": account.role})
    db.commit()
    db.refresh(account)
    return account


@router.patch("/{account_id}", response_model=AccountOut)
def update_account(
    account_id: str,
    body: AccountUpdate,
    db: Session = Depends(get_db),
    actor: Account = Depends(require_admin),
):
    account = db.get(Account, account_id)
    if not account:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Account not found")
    data = body.model_dump(exclude_unset=True)
    if "role" in data:
        _check_group(db, data["role"])
    # 不能對自己動手：自我停用或自我降級都會讓最後一個管理員把自己鎖在外面。
    # 別人還是可以降你的權（要刪也是先改分組），所以系統永遠留得住至少一個管理員。
    if account.id == actor.id:
        if data.get("active") is False:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "不能停用自己的帳號")
        new_role = data.get("role", account.role)
        if new_role != account.role and not _is_admin(db, new_role):
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST, "不能把自己移出管理員分組；請由其他管理員調整"
            )
    changed = [k for k in data.keys()]
    if "password" in data:
        password = data.pop("password")
        if password:
            account.password_hash = hash_password(password)
    for field, value in data.items():
        setattr(account, field, value)
    audit.dblog(db, actor, "update", "accounts", account.id,
                {"username": account.username, "fields": changed})
    db.commit()
    db.refresh(account)
    return account


@router.delete("/{account_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_account(
    account_id: str,
    db: Session = Depends(get_db),
    actor: Account = Depends(require_admin),
):
    account = db.get(Account, account_id)
    if not account:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Account not found")
    if _is_admin(db, account.role):
        # 管理員帳號一律不可刪：刪光了就沒人能進帳號管理／權限設定，系統鎖死。
        # 真要刪，先把它改到別的分組。
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            f"「{account.username}」是管理員帳號，不可刪除；請先改成其他權限分組",
        )
    audit.dblog(db, actor, "delete", "accounts", account.id,
                {"username": account.username})
    db.delete(account)
    db.commit()
