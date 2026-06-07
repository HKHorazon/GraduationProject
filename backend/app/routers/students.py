from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import audit
from ..db import get_db
from ..deps import require_editor
from ..models import Account, Student
from ..schemas import StudentCreate, StudentOut, StudentUpdate

router = APIRouter()


def _next_num(db: Session) -> int:
    ids = db.scalars(select(Student.id)).all()
    nums = [int(i[1:]) for i in ids if i.startswith("s") and i[1:].isdigit()]
    return (max(nums) + 1) if nums else 1


@router.get("", response_model=list[StudentOut])
def list_students(
    school_year: str | None = None,
    db: Session = Depends(get_db),
):
    stmt = select(Student)
    if school_year:
        stmt = stmt.where(Student.school_year == school_year)
    return db.scalars(stmt).all()


@router.post("", response_model=StudentOut, status_code=status.HTTP_201_CREATED)
def create_student(
    body: StudentCreate,
    db: Session = Depends(get_db),
    actor: Account = Depends(require_editor),
):
    data = body.model_dump(by_alias=False)
    if not data.get("id"):
        data["id"] = f"s{_next_num(db)}"
    elif db.get(Student, data["id"]):
        raise HTTPException(status.HTTP_409_CONFLICT, "Student id already exists")
    if db.scalar(select(Student).where(Student.student_id == data["student_id"])):
        raise HTTPException(status.HTTP_409_CONFLICT, f"學號 {data['student_id']} 已存在")
    student = Student(**data)
    db.add(student)
    audit.record(db, actor, "create", "student", student.id,
                 f"新增學生 {student.name}（{student.student_id}）")
    db.commit()
    db.refresh(student)
    return student


@router.post("/bulk", response_model=list[StudentOut], status_code=status.HTTP_201_CREATED)
def create_students_bulk(
    body: list[StudentCreate],
    db: Session = Depends(get_db),
    actor: Account = Depends(require_editor),
):
    if not body:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "沒有可匯入的資料")

    existing = {s for (s,) in db.execute(select(Student.student_id)).all()}
    next_num = _next_num(db)
    seen: set[str] = set()
    created: list[Student] = []
    for i, row in enumerate(body, start=1):
        data = row.model_dump(by_alias=False)
        sid = data["student_id"]
        if not sid:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, f"第 {i} 列缺少學號")
        if sid in existing or sid in seen:
            raise HTTPException(status.HTTP_409_CONFLICT, f"第 {i} 列學號 {sid} 重複")
        seen.add(sid)
        data["id"] = f"s{next_num}"
        next_num += 1
        student = Student(**data)
        db.add(student)
        created.append(student)

    audit.record(db, actor, "import", "student", None, f"批次匯入 {len(created)} 位學生")
    db.commit()
    for s in created:
        db.refresh(s)
    return created


@router.patch("/{student_id}", response_model=StudentOut)
def update_student(
    student_id: str,
    body: StudentUpdate,
    db: Session = Depends(get_db),
    actor: Account = Depends(require_editor),
):
    student = db.get(Student, student_id)
    if not student:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Student not found")
    changes = body.model_dump(exclude_unset=True)
    fields = "、".join(changes.keys())
    for field, value in changes.items():
        setattr(student, field, value)
    audit.record(db, actor, "update", "student", student.id,
                 f"修改學生 {student.name}：{fields}")
    db.commit()
    db.refresh(student)
    return student


@router.delete("/{student_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_student(
    student_id: str,
    db: Session = Depends(get_db),
    actor: Account = Depends(require_editor),
):
    student = db.get(Student, student_id)
    if not student:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Student not found")
    audit.record(db, actor, "delete", "student", student.id,
                 f"刪除學生 {student.name}（{student.student_id}）")
    db.delete(student)
    db.commit()
