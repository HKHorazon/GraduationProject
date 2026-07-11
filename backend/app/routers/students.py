from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import audit
from ..db import get_db
from ..deps import get_current_account_optional, require_editor
from ..models import Account, Group, Student
from ..privacy import mask_name
from ..schemas import StudentCreate, StudentOut, StudentUpdate

router = APIRouter()

STATUS_LABEL = {"active": "在學", "inactive": "休退學"}


def _group_label(db: Session, group_id: str | None) -> str:
    if not group_id:
        return ""
    g = db.get(Group, group_id)
    return f"第{g.number}組" if g else group_id


def _record_membership_events(
    db: Session, actor: Account, student: Student,
    old_group: str | None, new_group: str | None,
) -> None:
    """Translate a group_id change into a human event (join / move / leave)."""
    name = f"{student.name}（{student.student_id}）"
    if old_group is None and new_group is not None:
        audit.event(db, actor, "student_join",
                    f"{name} 加入 {_group_label(db, new_group)}",
                    student_id=student.id, group_id=new_group)
    elif old_group is not None and new_group is None:
        audit.event(db, actor, "student_leave",
                    f"{name} 離開 {_group_label(db, old_group)}",
                    student_id=student.id, group_id=old_group)
    elif old_group != new_group:
        audit.event(db, actor, "student_move",
                    f"{name}：{_group_label(db, old_group)} → {_group_label(db, new_group)}",
                    student_id=student.id, group_id=new_group)


def _next_num(db: Session) -> int:
    ids = db.scalars(select(Student.id)).all()
    nums = [int(i[1:]) for i in ids if i.startswith("s") and i[1:].isdigit()]
    return (max(nums) + 1) if nums else 1


@router.get("", response_model=list[StudentOut])
def list_students(
    school_year: str | None = None,
    db: Session = Depends(get_db),
    account: Account | None = Depends(get_current_account_optional),
):
    stmt = select(Student)
    if school_year:
        stmt = stmt.where(Student.school_year == school_year)
    students = db.scalars(stmt).all()
    if account is not None:
        return students
    # 未登入：伺服器端遮蔽姓名個資。不可直接改動 ORM 物件（session flush 會把
    # 遮蔽後的姓名寫回 DB）——改在 Pydantic 物件上覆寫 name。
    return [
        StudentOut.model_validate(s).model_copy(update={"name": mask_name(s.name)})
        for s in students
    ]


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
    audit.event(db, actor, "student_create",
                f"新增 {student.name}（{student.student_id}，{student.school_year}學年 {student.class_ or ''}班）",
                student_id=student.id)
    audit.dblog(db, actor, "create", "students", student.id, data)
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

    # one human event per student (匯入 = 多筆新增學生), one raw import record
    for s in created:
        audit.event(db, actor, "student_create",
                    f"新增 {s.name}（{s.student_id}，{s.school_year}學年 {s.class_ or ''}班）",
                    student_id=s.id)
    audit.dblog(db, actor, "import", "students", None,
                {"count": len(created), "student_ids": [s.student_id for s in created]})
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
    old = {f: getattr(student, f) for f in changes}

    for field, value in changes.items():
        setattr(student, field, value)

    # semantic events: only group membership and status changes are shown;
    # plain data fixes (name/class/...) go to db_logs only
    if "group_id" in changes and old["group_id"] != changes["group_id"]:
        _record_membership_events(db, actor, student, old["group_id"], changes["group_id"])
    if "status" in changes and old["status"] != changes["status"]:
        audit.event(db, actor, "student_status",
                    f"{student.name}（{student.student_id}）："
                    f"{STATUS_LABEL.get(old['status'], old['status'])} → "
                    f"{STATUS_LABEL.get(changes['status'], changes['status'])}",
                    student_id=student.id)

    audit.dblog(db, actor, "update", "students", student.id,
                {f: {"old": old[f], "new": changes[f]} for f in changes})
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
    # hard delete is technical-only: recorded in db_logs, not in the timeline
    audit.dblog(db, actor, "delete", "students", student.id,
                {"student_id": student.student_id, "name": student.name})
    db.delete(student)
    db.commit()
