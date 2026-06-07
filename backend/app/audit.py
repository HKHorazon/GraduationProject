"""Helper to record an audit-log entry within the current DB transaction.

Call `record(...)` before the endpoint's `db.commit()` so the log row commits
together with the change it describes.
"""
from sqlalchemy.orm import Session

from .models import Account, AuditLog


def record(
    db: Session,
    actor: Account,
    action: str,
    entity: str,
    entity_id: str | None,
    summary: str,
) -> None:
    db.add(
        AuditLog(
            actor=actor.username,
            action=action,
            entity=entity,
            entity_id=entity_id,
            summary=summary,
        )
    )
