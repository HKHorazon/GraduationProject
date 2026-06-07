from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import audit
from ..db import get_db
from ..deps import require_super_admin
from ..models import Account
from ..schemas import AccountCreate, AccountOut, AccountUpdate
from ..security import hash_password

router = APIRouter()


def _next_id(db: Session) -> str:
    ids = db.scalars(select(Account.id)).all()
    nums = [int(i[1:]) for i in ids if i.startswith("u") and i[1:].isdigit()]
    return f"u{(max(nums) + 1) if nums else 1}"


@router.get("", response_model=list[AccountOut])
def list_accounts(db: Session = Depends(get_db), _=Depends(require_super_admin)):
    return db.scalars(select(Account)).all()


@router.post("", response_model=AccountOut, status_code=status.HTTP_201_CREATED)
def create_account(
    body: AccountCreate,
    db: Session = Depends(get_db),
    actor: Account = Depends(require_super_admin),
):
    if db.scalar(select(Account).where(Account.username == body.username)):
        raise HTTPException(status.HTTP_409_CONFLICT, "Username already exists")
    account = Account(
        id=_next_id(db),
        username=body.username,
        password_hash=hash_password(body.password),
        role=body.role,
        active=body.active,
        teacher_id=body.teacher_id,
    )
    db.add(account)
    audit.record(db, actor, "create", "account", account.id,
                 f"新增帳號 {account.username}（{account.role}）")
    db.commit()
    db.refresh(account)
    return account


@router.patch("/{account_id}", response_model=AccountOut)
def update_account(
    account_id: str,
    body: AccountUpdate,
    db: Session = Depends(get_db),
    actor: Account = Depends(require_super_admin),
):
    account = db.get(Account, account_id)
    if not account:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Account not found")
    data = body.model_dump(exclude_unset=True)
    changed = [k for k in data.keys()]
    if "password" in data:
        password = data.pop("password")
        if password:
            account.password_hash = hash_password(password)
    for field, value in data.items():
        setattr(account, field, value)
    audit.record(db, actor, "update", "account", account.id,
                 f"修改帳號 {account.username}：{'、'.join(changed)}")
    db.commit()
    db.refresh(account)
    return account


@router.delete("/{account_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_account(
    account_id: str,
    db: Session = Depends(get_db),
    actor: Account = Depends(require_super_admin),
):
    account = db.get(Account, account_id)
    if not account:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Account not found")
    audit.record(db, actor, "delete", "account", account.id, f"刪除帳號 {account.username}")
    db.delete(account)
    db.commit()
