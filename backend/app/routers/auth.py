from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import audit, pageperm
from ..db import get_db
from ..deps import get_current_account
from ..models import Account
from ..schemas import AccountOut, PasswordChange, Token
from ..security import create_access_token, hash_password, verify_password

router = APIRouter()


@router.post("/login", response_model=Token)
def login(
    form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)
):
    account = db.scalar(select(Account).where(Account.username == form.username))
    if (
        account is None
        or not account.active
        or not verify_password(form.password, account.password_hash)
    ):
        # 使用者看得到的訊息一律 zh-TW；停用的帳號也走同一句，不透露帳號存在與否。
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="帳號或密碼錯誤",
        )
    token = create_access_token(subject=account.id, role=account.role)
    return Token(access_token=token)


@router.get("/me", response_model=AccountOut)
def me(account: Account = Depends(get_current_account)):
    return account


@router.post("/change-password", status_code=status.HTTP_204_NO_CONTENT)
def change_password(
    body: PasswordChange,
    db: Session = Depends(get_db),
    account: Account = Depends(pageperm.require_edit("password")),
):
    """改自己的密碼（要舊密碼）；能不能改由 password 頁的權限決定。"""
    if not verify_password(body.old_password, account.password_hash):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "舊密碼不正確")
    account.password_hash = hash_password(body.new_password)
    # account changes go to db_logs only (audit_logs omits them by design)
    audit.dblog(db, account, "update", "accounts", account.id,
                {"changed": ["password"], "self_service": True})
    db.commit()
