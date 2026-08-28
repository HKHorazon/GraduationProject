"""Page-permission enforcement — the /permissions matrix is the authority.

The frontend PAGES registry says which pages exist; ``permission_groups`` says
which groups exist (freely editable, except the two builtins) and
``page_permissions`` says what each group may do on each page. Levels are
ordered ``none < view < edit``; an admin group is always ``edit``.

Every request carries a group: ``Account.role`` holds the group key, and a
request with no token is the GUEST group. That is the whole identity model —
there is no separate hardcoded role check anywhere else.

One endpoint is reached from several screens (``PATCH /students`` serves 學生列表,
學生更動, 組別異動 and 資料管理), so a guard takes the set of screens that
legitimately drive it and passes when ANY of them grants the level.

Not guarded here: ``GET /students``, ``/groups``, ``/teachers``. Every screen
loads them through ``data.loadAll()``, so gating them on one page would break
the others. Instead they stay open and hide the personal part: whoever cannot
view the page gets masked names (``hides_names`` below, used by those routers).
``GroupOut`` carries no personal name at all, so /groups needs nothing.
"""
from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from .db import get_db
from .deps import get_current_account, get_current_account_optional
from .models import Account, PagePermission, PermissionGroup

GUEST_GROUP = "guest"   # the identity of every request without a token
ORDER = {"none": 0, "view": 1, "edit": 2}
LEVELS = tuple(ORDER)

# The page registry, mirroring PAGES in frontend/src/stores/permissions.js and
# the keys of PAGE_PERMISSIONS in backend/seed.py. Only used to reject junk keys
# on PUT /permissions — page existence itself is still the frontend's business.
PAGE_KEYS = frozenset({
    "students", "groups", "remove-student", "group-change", "group-order",
    "documents", "documents-export", "reviews", "data", "audit-logs",
})


def _group(db: Session, key: str) -> PermissionGroup | None:
    return db.get(PermissionGroup, key)


def group_key_of(account: Account | None) -> str:
    return account.role if account else GUEST_GROUP


def level_of(db: Session, account: Account | None, page_key: str) -> str:
    """The account's level on one page. No account = the guest group."""
    key = group_key_of(account)
    group = _group(db, key)
    if group is not None and group.is_admin:
        return "edit"
    row = db.get(PagePermission, {"group_key": key, "page_key": page_key})
    # No row = no access. Fail closed: a group created after a page was added
    # sees nothing until an admin grants it, and the frontend (levelOf falls
    # back to "none" too) shows exactly what the server will allow.
    return row.level if row is not None else "none"


def _allows(db: Session, account: Account | None, pages: tuple[str, ...], need: str) -> bool:
    return any(ORDER[level_of(db, account, p)] >= ORDER[need] for p in pages)


def require_edit(*pages: str):
    """Write guard. Always needs a login, so a logged-out visitor can never
    write even if the guest group were set to edit."""
    def dep(
        account: Account = Depends(get_current_account),
        db: Session = Depends(get_db),
    ) -> Account:
        if not _allows(db, account, pages, "edit"):
            raise HTTPException(status.HTTP_403_FORBIDDEN, "權限不足，無法修改")
        return account
    return dep


def require_view(*pages: str):
    """Read guard. Logged-out counts as the guest group, so a page opened to
    guests stays publicly readable."""
    def dep(
        account: Account | None = Depends(get_current_account_optional),
        db: Session = Depends(get_db),
    ) -> Account | None:
        if not _allows(db, account, pages, "view"):
            raise HTTPException(status.HTTP_403_FORBIDDEN, "權限不足，無法檢視")
        return account
    return dep


def require_admin(
    account: Account = Depends(get_current_account),
    db: Session = Depends(get_db),
) -> Account:
    """Account management + permission editing. Replaces the old hardcoded
    super_admin role check: any group flagged is_admin qualifies."""
    group = _group(db, account.role)
    if group is None or not group.is_admin:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "權限不足，僅限管理員")
    return account


def hides_names(db: Session, account: Account | None, page_key: str) -> bool:
    """姓名個資要不要遮蔽：未登入，或這個分組連該頁都看不到，就一律遮。

    /students 與 /teachers 是所有頁面共用的（data.loadAll），不能整包擋掉，
    所以擋不掉的部分改成遮名字。
    """
    return account is None or level_of(db, account, page_key) == "none"
