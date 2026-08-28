from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..db import get_db
from ..pageperm import require_view
from ..models import AuditLog
from ..schemas import AuditLogOut

router = APIRouter()


@router.get("", response_model=list[AuditLogOut])
def list_audit_logs(
    limit: int = 200,
    db: Session = Depends(get_db),
    _=Depends(require_view("audit-logs")),
):
    limit = max(1, min(limit, 500))
    stmt = select(AuditLog).order_by(AuditLog.created_at.desc(), AuditLog.id.desc()).limit(limit)
    return db.scalars(stmt).all()
