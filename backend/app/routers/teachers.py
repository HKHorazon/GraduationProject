from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import audit
from ..db import get_db
from ..deps import get_current_account_optional
from ..pageperm import hides_names, require_edit
from ..models import Account, Teacher
from ..privacy import mask_name
from ..schemas import TeacherCreate, TeacherOut

router = APIRouter()


def _next_id(db: Session) -> str:
    ids = db.scalars(select(Teacher.id)).all()
    nums = [int(i[1:]) for i in ids if i.startswith("t") and i[1:].isdigit()]
    return f"t{(max(nums) + 1) if nums else 1}"


@router.get("", response_model=list[TeacherOut])
def list_teachers(
    db: Session = Depends(get_db),
    account: Account | None = Depends(get_current_account_optional),
):
    """公開＋遮蔽：老師名字掛在「組別列表」的指導老師欄，所以跟著那頁的權限走。
    看不到組別列表的人（含未登入）拿到的是陳O明，跟組員姓名的處理一致。"""
    teachers = db.scalars(select(Teacher)).all()
    if not hides_names(db, account, "groups"):
        return teachers
    return [
        TeacherOut.model_validate(t).model_copy(update={"name": mask_name(t.name)})
        for t in teachers
    ]


@router.post("", response_model=TeacherOut, status_code=status.HTTP_201_CREATED)
def create_teacher(
    body: TeacherCreate,
    db: Session = Depends(get_db),
    actor: Account = Depends(require_edit("groups", "data")),
):
    tid = body.id or _next_id(db)
    if db.get(Teacher, tid):
        raise HTTPException(status.HTTP_409_CONFLICT, "Teacher id already exists")
    teacher = Teacher(id=tid, name=body.name)
    db.add(teacher)
    audit.event(db, actor, "teacher_create", f"新增老師 {teacher.name}",
                teacher_id=teacher.id)
    audit.dblog(db, actor, "create", "teachers", teacher.id, {"name": teacher.name})
    db.commit()
    db.refresh(teacher)
    return teacher


@router.delete("/{teacher_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_teacher(
    teacher_id: str,
    db: Session = Depends(get_db),
    actor: Account = Depends(require_edit("groups", "data")),
):
    teacher = db.get(Teacher, teacher_id)
    if not teacher:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Teacher not found")
    # teacher removal is technical-only: db_logs, not the human timeline
    audit.dblog(db, actor, "delete", "teachers", teacher.id, {"name": teacher.name})
    db.delete(teacher)
    db.commit()
