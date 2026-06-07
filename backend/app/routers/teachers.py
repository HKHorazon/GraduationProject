from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import audit
from ..db import get_db
from ..deps import require_editor
from ..models import Account, Teacher
from ..schemas import TeacherCreate, TeacherOut

router = APIRouter()


def _next_id(db: Session) -> str:
    ids = db.scalars(select(Teacher.id)).all()
    nums = [int(i[1:]) for i in ids if i.startswith("t") and i[1:].isdigit()]
    return f"t{(max(nums) + 1) if nums else 1}"


@router.get("", response_model=list[TeacherOut])
def list_teachers(db: Session = Depends(get_db)):
    return db.scalars(select(Teacher)).all()


@router.post("", response_model=TeacherOut, status_code=status.HTTP_201_CREATED)
def create_teacher(
    body: TeacherCreate,
    db: Session = Depends(get_db),
    actor: Account = Depends(require_editor),
):
    tid = body.id or _next_id(db)
    if db.get(Teacher, tid):
        raise HTTPException(status.HTTP_409_CONFLICT, "Teacher id already exists")
    teacher = Teacher(id=tid, name=body.name)
    db.add(teacher)
    audit.record(db, actor, "create", "teacher", teacher.id, f"新增老師 {teacher.name}")
    db.commit()
    db.refresh(teacher)
    return teacher


@router.delete("/{teacher_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_teacher(
    teacher_id: str,
    db: Session = Depends(get_db),
    actor: Account = Depends(require_editor),
):
    teacher = db.get(Teacher, teacher_id)
    if not teacher:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Teacher not found")
    audit.record(db, actor, "delete", "teacher", teacher.id, f"刪除老師 {teacher.name}")
    db.delete(teacher)
    db.commit()
