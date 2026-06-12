"""Helpers to record audit entries within the current DB transaction.

Two layers:
- `event(...)`  → audit_logs: human-readable semantic events shown in 異動紀錄.
- `dblog(...)`  → db_logs: raw technical record of every write (not shown in UI).

Call them before the endpoint's `db.commit()` so the log rows commit together
with the change they describe.
"""
import json

from sqlalchemy.orm import Session

from .models import Account, AuditLog, DbLog


def event(
    db: Session,
    actor: Account,
    event_key: str,
    summary: str,
    *,
    student_id: str | None = None,
    teacher_id: str | None = None,
    group_id: str | None = None,
) -> None:
    db.add(
        AuditLog(
            actor=actor.username,
            event=event_key,
            summary=summary,
            student_id=student_id,
            teacher_id=teacher_id,
            group_id=group_id,
        )
    )


def dblog(
    db: Session,
    actor: Account,
    method: str,
    table_name: str,
    record_id: str | None,
    payload: dict | None = None,
) -> None:
    db.add(
        DbLog(
            actor=actor.username,
            method=method,
            table_name=table_name,
            record_id=record_id,
            payload=json.dumps(payload, ensure_ascii=False, default=str) if payload else None,
        )
    )
