from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import audit
from ..db import get_db
from ..deps import require_editor
from ..models import Account, Group, Teacher
from ..schemas import GroupCreate, GroupOut, GroupUpdate

router = APIRouter()


def _to_out(group: Group) -> GroupOut:
    return GroupOut(
        id=group.id,
        number=group.number,
        name=group.name,
        category=group.category,
        school_year=group.school_year,
        leader_id=group.leader_id,
        teacher_ids=[t.id for t in group.teachers],
    )


def _load_teachers(db: Session, teacher_ids: list[str]) -> list[Teacher]:
    if not teacher_ids:
        return []
    teachers = db.scalars(select(Teacher).where(Teacher.id.in_(teacher_ids))).all()
    found = {t.id for t in teachers}
    missing = set(teacher_ids) - found
    if missing:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, f"Unknown teacher ids: {sorted(missing)}"
        )
    return list(teachers)


@router.get("", response_model=list[GroupOut])
def list_groups(
    school_year: str | None = None,
    db: Session = Depends(get_db),
):
    stmt = select(Group)
    if school_year:
        stmt = stmt.where(Group.school_year == school_year)
    return [_to_out(g) for g in db.scalars(stmt).all()]


@router.post("", response_model=GroupOut, status_code=status.HTTP_201_CREATED)
def create_group(
    body: GroupCreate,
    db: Session = Depends(get_db),
    actor: Account = Depends(require_editor),
):
    if db.get(Group, body.id):
        raise HTTPException(status.HTTP_409_CONFLICT, "Group id already exists")
    group = Group(
        id=body.id,
        number=body.number,
        name=body.name,
        category=body.category,
        school_year=body.school_year,
        leader_id=body.leader_id,
        teachers=_load_teachers(db, body.teacher_ids),
    )
    db.add(group)
    audit.record(db, actor, "create", "group", group.id,
                 f"新增組別 第{group.number}組 {group.name}")
    db.commit()
    db.refresh(group)
    return _to_out(group)


@router.patch("/{group_id}", response_model=GroupOut)
def update_group(
    group_id: str,
    body: GroupUpdate,
    db: Session = Depends(get_db),
    actor: Account = Depends(require_editor),
):
    group = db.get(Group, group_id)
    if not group:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Group not found")
    data = body.model_dump(exclude_unset=True)
    changed = []
    if "teacher_ids" in data:
        group.teachers = _load_teachers(db, data.pop("teacher_ids"))
        changed.append("指導老師")
    for field, value in data.items():
        setattr(group, field, value)
        changed.append(field)
    audit.record(db, actor, "update", "group", group.id,
                 f"修改組別 第{group.number}組 {group.name}：{'、'.join(changed)}")
    db.commit()
    db.refresh(group)
    return _to_out(group)


@router.delete("/{group_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_group(
    group_id: str,
    db: Session = Depends(get_db),
    actor: Account = Depends(require_editor),
):
    group = db.get(Group, group_id)
    if not group:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Group not found")
    audit.record(db, actor, "delete", "group", group.id,
                 f"解散組別 第{group.number}組 {group.name}")
    db.delete(group)
    db.commit()
