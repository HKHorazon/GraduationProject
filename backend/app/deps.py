from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from .db import get_db
from .models import Account
from .security import decode_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")
oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl="auth/login", auto_error=False)

EDITOR_ROLES = {"editor", "super_admin"}


def get_current_account(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
) -> Account:
    creds_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid authentication credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = decode_token(token)
    if not payload or "sub" not in payload:
        raise creds_error
    account = db.get(Account, payload["sub"])
    if account is None or not account.active:
        raise creds_error
    return account


def get_current_account_optional(
    token: str | None = Depends(oauth2_scheme_optional),
    db: Session = Depends(get_db),
) -> Account | None:
    # Same as get_current_account but never raises: returns the Account, or None
    # when there is no token / an invalid token / an inactive account.
    if not token:
        return None
    payload = decode_token(token)
    if not payload or "sub" not in payload:
        return None
    account = db.get(Account, payload["sub"])
    if account is None or not account.active:
        return None
    return account


def require_editor(account: Account = Depends(get_current_account)) -> Account:
    if account.role not in EDITOR_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Editor role required",
        )
    return account


def require_super_admin(account: Account = Depends(get_current_account)) -> Account:
    if account.role != "super_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super admin role required",
        )
    return account
