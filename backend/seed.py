"""Seed the database with the initial mock data (idempotent).

Run inside the backend container:  python seed.py
"""
from sqlalchemy import select

from app.db import SessionLocal
from app.models import (
    Account, Group, PagePermission, PermissionGroup, Student, Teacher,
)
from app.security import hash_password

TEACHERS = [
    ("t1", "陳志明"),
    ("t2", "林美華"),
    ("t3", "黃建國"),
    ("t4", "劉雅婷"),
    ("t5", "張文傑"),
]

GROUPS = [
    ("g1", 1, "智慧校園導覽系統", "多媒體",   "113", "s01", ["t1"]),
    ("g2", 2, "環保能源監測平台", "其他",     "113", "s04", ["t2"]),
    ("g3", 3, "AI 作業批改助手", "多媒體",   "113", "s07", ["t1", "t3"]),
    ("g4", 4, "圖書館借還書自動化", "主視覺", "113", "s10", ["t4"]),
    ("g5", 1, "健康管理 APP",    "多媒體",   "112", "s13", ["t2"]),
    ("g6", 2, "校園失物招領平台", "平面設計", "112", "s16", ["t5"]),
    ("g7", 3, "線上選修課系統",   "多媒體",   "112", "s19", ["t3"]),
    ("g8", 4, "宿舍管理系統",    "其他",     "112", "s22", ["t4", "t5"]),
]

# id, student_id, name, class, school_year, group_id, status
STUDENTS = [
    ("s01", "A11001", "王大明", "甲", "113", "g1", "active"),
    ("s02", "A11002", "李小花", "甲", "113", "g1", "active"),
    ("s03", "A11003", "張偉豪", "乙", "113", "g1", "active"),
    ("s04", "A11004", "陳雅琪", "乙", "113", "g2", "active"),
    ("s05", "A11005", "劉志遠", "甲", "113", "g2", "active"),
    ("s06", "A11006", "林佳穎", "甲", "113", "g2", "active"),
    ("s07", "A11007", "黃俊傑", "甲", "113", "g3", "active"),
    ("s08", "A11008", "吳思穎", "乙", "113", None, "suspended"),
    ("s09", "A11009", "鄭家豪", "甲", "113", None, "withdrawn"),
    ("s10", "A11010", "許美玲", "甲", "113", "g4", "active"),
    ("s11", "A11011", "蔡宗翰", "乙", "113", "g4", "active"),
    ("s12", "A11012", "周靜文", "甲", "113", None, "active"),
    ("s13", "A10001", "謝志豪", "甲", "112", "g5", "active"),
    ("s14", "A10002", "江淑惠", "甲", "112", "g5", "active"),
    ("s15", "A10003", "余建志", "乙", "112", "g5", "active"),
    ("s16", "A10004", "潘曉雯", "乙", "112", "g6", "active"),
    ("s17", "A10005", "魏志強", "甲", "112", "g6", "active"),
    ("s18", "A10006", "唐雅萍", "甲", "112", "g6", "active"),
    ("s19", "A10007", "盧冠廷", "甲", "112", "g7", "active"),
    ("s20", "A10008", "石怡君", "乙", "112", "g7", "active"),
    ("s21", "A10009", "何思賢", "甲", "112", "g7", "active"),
    ("s22", "A10010", "倪靜怡", "甲", "112", "g8", "active"),
    ("s23", "A10011", "翁育誠", "乙", "112", "g8", "active"),
    ("s24", "A10012", "方建中", "甲", "112", None, "active"),
    ("s25", "A12001", "蘇品妤", "甲", "114", None, "active"),
    ("s26", "A12002", "馮啟明", "甲", "114", None, "active"),
    ("s27", "A12003", "葉雅惠", "乙", "114", None, "active"),
    ("s28", "A12004", "程志偉", "乙", "114", None, "active"),
    ("s29", "A12005", "鍾美華", "甲", "114", None, "active"),
    ("s30", "A12006", "洪建宏", "甲", "114", None, "active"),
]

# id, username, role, active, teacher_id  (default password: "password")
ACCOUNTS = [
    ("u1", "admin", "super_admin", True, None),
    ("u2", "chen", "editor", True, "t1"),
    ("u3", "lin", "editor", True, "t2"),
    ("u4", "wang", "viewer", True, "t3"),
    ("u5", "huang", "viewer", True, "t4"),
    ("u6", "inactive", "viewer", False, None),
]

DEFAULT_PASSWORD = "password"

# 權限分組（Account.role 存 key）。guest / super_admin 是內建不可刪，
# 其餘可在 /permissions 自由增刪改。
# key, label, is_admin, builtin, sort
PERMISSION_GROUPS = [
    ("guest",       "未登入訪客", False, True,  0),
    ("viewer",      "檢視者",     False, False, 1),
    ("editor",      "編輯者",     False, False, 2),
    ("super_admin", "系統管理員", True,  True,  99),
]

# page_key -> {group_key: level}；level 為 none < view < edit。
# 對照 frontend/src/stores/permissions.js 的 DEFAULT_PERMISSIONS。
# is_admin 的分組固定全權，不存進表裡。
PAGE_PERMISSIONS = {
    "students":         {"guest": "view", "viewer": "view", "editor": "edit"},
    "groups":           {"guest": "view", "viewer": "view", "editor": "edit"},
    "remove-student":   {"guest": "none", "viewer": "none", "editor": "edit"},
    "group-change":     {"guest": "none", "viewer": "none", "editor": "edit"},
    "group-order":      {"guest": "none", "viewer": "none", "editor": "edit"},
    "documents":        {"guest": "none", "viewer": "none", "editor": "edit"},
    "documents-export": {"guest": "none", "viewer": "none", "editor": "edit"},
    "reviews":          {"guest": "none", "viewer": "none", "editor": "edit"},
    "data":             {"guest": "none", "viewer": "none", "editor": "edit"},
    "audit-logs":       {"guest": "none", "viewer": "none", "editor": "edit"},
}


def seed_page_permissions(db) -> None:
    """Insert the builtin groups and any missing matrix cell.

    Idempotent: never overwrites existing rows, so an admin's saved changes
    survive re-seeding. Runs even when the rest of the DB is seeded.

    分組只在表整個是空的時候才建 —— 每次開機都補的話，管理員在 /permissions
    刪掉的「檢視者」會在下次部署自己復活。權限格子則照補（新增頁面要有預設值），
    但只補給還存在的分組，免得撞 FK。
    """
    known = set(db.scalars(select(PermissionGroup.key)).all())
    if not known:
        for key, label, is_admin, builtin, sort in PERMISSION_GROUPS:
            db.add(PermissionGroup(
                key=key, label=label, is_admin=is_admin, builtin=builtin, sort=sort
            ))
        known = {g[0] for g in PERMISSION_GROUPS}
        db.flush()

    existing = {(r.group_key, r.page_key) for r in db.scalars(select(PagePermission)).all()}
    added = 0
    for page_key, by_group in PAGE_PERMISSIONS.items():
        for group_key, level in by_group.items():
            if group_key in known and (group_key, page_key) not in existing:
                db.add(PagePermission(group_key=group_key, page_key=page_key, level=level))
                added += 1
    if added:
        print(f"Seeded {added} default page permission(s).")
    db.commit()


def seed() -> None:
    db = SessionLocal()
    try:
        seed_page_permissions(db)
        if db.scalar(select(Teacher).limit(1)) is not None:
            print("Database already seeded — skipping.")
            return

        for tid, name in TEACHERS:
            db.add(Teacher(id=tid, name=name))
        db.flush()

        # students first (groups reference leader_id), without group_id yet
        for sid, student_id, name, klass, year, group_id, status in STUDENTS:
            db.add(
                Student(
                    id=sid,
                    student_id=student_id,
                    name=name,
                    class_=klass,
                    school_year=year,
                    status=status,
                )
            )
        db.flush()

        teachers_by_id = {t.id: t for t in db.scalars(select(Teacher)).all()}
        for gid, number, name, category, year, leader_id, teacher_ids in GROUPS:
            db.add(
                Group(
                    id=gid,
                    number=number,
                    name=name,
                    category=category,
                    school_year=year,
                    leader_id=leader_id,
                    teachers=[teachers_by_id[t] for t in teacher_ids],
                )
            )
        db.flush()

        # now wire students to their groups
        students_by_id = {s.id: s for s in db.scalars(select(Student)).all()}
        for sid, _sid, _n, _c, _y, group_id, _st in STUDENTS:
            if group_id:
                students_by_id[sid].group_id = group_id

        pw = hash_password(DEFAULT_PASSWORD)
        for uid, username, role, active, teacher_id in ACCOUNTS:
            db.add(
                Account(
                    id=uid,
                    username=username,
                    password_hash=pw,
                    role=role,
                    active=active,
                    teacher_id=teacher_id,
                )
            )

        db.commit()
        print(f"Seeded: {len(TEACHERS)} teachers, {len(STUDENTS)} students, "
              f"{len(GROUPS)} groups, {len(ACCOUNTS)} accounts.")
        print(f'All accounts use password: "{DEFAULT_PASSWORD}"')
    finally:
        db.close()


if __name__ == "__main__":
    seed()
