from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import audit
from ..db import get_db
from ..pageperm import require_edit
from ..models import Account, Group, Student, Teacher
from ..schemas import GroupCreate, GroupOut, GroupReorder, GroupUpdate

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


def _next_num(db: Session) -> int:
    ids = db.scalars(select(Group.id)).all()
    nums = [int(i[1:]) for i in ids if i.startswith("g") and i[1:].isdigit()]
    return (max(nums) + 1) if nums else 1


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
    # 公開：GroupOut 只有組號／專題名稱／類別／id，沒有任何人名可遮，
    # 而且每個頁面都靠 data.loadAll() 拿它（見 app/pageperm.py 開頭）。
    stmt = select(Group)
    if school_year:
        stmt = stmt.where(Group.school_year == school_year)
    return [_to_out(g) for g in db.scalars(stmt).all()]


@router.post("", response_model=GroupOut, status_code=status.HTTP_201_CREATED)
def create_group(
    body: GroupCreate,
    db: Session = Depends(get_db),
    actor: Account = Depends(require_edit("groups", "group-change", "data")),
):
    gid = body.id
    if not gid:
        gid = f"g{_next_num(db)}"
    elif db.get(Group, gid):
        raise HTTPException(status.HTTP_409_CONFLICT, "Group id already exists")
    group = Group(
        id=gid,
        number=body.number,
        name=body.name,
        category=body.category,
        school_year=body.school_year,
        leader_id=body.leader_id,
        teachers=_load_teachers(db, body.teacher_ids),
    )
    db.add(group)
    audit.event(db, actor, "group_create",
                f"建立 第{group.number}組「{group.name}」（{group.school_year}學年）",
                group_id=group.id)
    audit.dblog(db, actor, "create", "groups", group.id, {**body.model_dump(), "id": gid})
    db.commit()
    db.refresh(group)
    return _to_out(group)


@router.post("/reorder", response_model=list[GroupOut])
def reorder_groups(
    body: GroupReorder,
    db: Session = Depends(get_db),
    actor: Account = Depends(require_edit("group-order", "groups", "data")),
):
    """Renumber a school year's groups to 1..N in the given order (drag-sort).

    number edits are db_logs-only per docs/異動紀錄種類.md — no audit.event.
    """
    groups = db.scalars(
        select(Group).where(Group.school_year == body.school_year)
    ).all()
    by_id = {g.id: g for g in groups}
    if set(body.ordered_ids) != set(by_id):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "組別清單與該學年不一致")

    changes: dict = {}
    for i, gid in enumerate(body.ordered_ids, start=1):
        g = by_id[gid]
        if g.number != i:
            changes[gid] = {"old": g.number, "new": i}
            g.number = i
    if changes:
        audit.dblog(db, actor, "update", "groups", None,
                    {"reorder": changes, "school_year": body.school_year})
    db.commit()
    return [_to_out(by_id[gid]) for gid in body.ordered_ids]


@router.patch("/{group_id}", response_model=GroupOut)
def update_group(
    group_id: str,
    body: GroupUpdate,
    db: Session = Depends(get_db),
    actor: Account = Depends(require_edit("groups", "group-change", "data")),
):
    group = db.get(Group, group_id)
    if not group:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Group not found")
    data = body.model_dump(exclude_unset=True)
    label = f"第{group.number}組"
    raw_changes: dict = {}

    # each meaningful field change becomes its own human event (with old → new)
    if "teacher_ids" in data:
        old_teachers = [t.name for t in group.teachers]
        new_list = _load_teachers(db, data.pop("teacher_ids"))
        group.teachers = new_list
        new_teachers = [t.name for t in new_list]
        if old_teachers != new_teachers:
            added = [t for t in new_list if t.name not in old_teachers]
            audit.event(db, actor, "group_teachers",
                        f"{label} 指導老師：{'、'.join(old_teachers) or '（無）'} → "
                        f"{'、'.join(new_teachers) or '（無）'}",
                        group_id=group.id,
                        teacher_id=added[0].id if len(added) == 1 else None)
            raw_changes["teacher_ids"] = {"old": old_teachers, "new": new_teachers}

    for field, value in data.items():
        old = getattr(group, field)
        if old == value:
            continue
        setattr(group, field, value)
        raw_changes[field] = {"old": old, "new": value}
        if field == "name":
            audit.event(db, actor, "group_rename",
                        f"{label} 題目：「{old}」→「{value}」", group_id=group.id)
        elif field == "category":
            audit.event(db, actor, "group_category",
                        f"{label} 類別：{old or '（無）'} → {value or '（無）'}",
                        group_id=group.id)
        elif field == "leader_id":
            leader = db.get(Student, value) if value else None
            audit.event(db, actor, "group_leader",
                        f"{label} 組長：{leader.name if leader else '（無）'}"
                        + (f"（{leader.student_id}）" if leader else ""),
                        group_id=group.id, student_id=value)
        # number / school_year edits: db_logs only

    if raw_changes:
        audit.dblog(db, actor, "update", "groups", group.id, raw_changes)
    db.commit()
    db.refresh(group)
    return _to_out(group)


@router.delete("/{group_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_group(
    group_id: str,
    db: Session = Depends(get_db),
    actor: Account = Depends(require_edit("groups", "group-change", "data")),
):
    group = db.get(Group, group_id)
    if not group:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Group not found")
    audit.event(db, actor, "group_delete",
                f"解散 第{group.number}組「{group.name}」（{group.school_year}學年）",
                group_id=group.id)
    audit.dblog(db, actor, "delete", "groups", group.id,
                {"number": group.number, "name": group.name})
    db.delete(group)
    db.commit()
