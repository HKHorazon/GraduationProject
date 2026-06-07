from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..db import get_db
from ..deps import get_current_account
from ..models import Account
from ..schemas import AccountOut, Token
from ..security import create_access_token, verify_password

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
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )
    token = create_access_token(subject=account.id, role=account.role)
    return Token(access_token=token)


@router.get("/me", response_model=AccountOut)
def me(account: Account = Depends(get_current_account)):
    return account
