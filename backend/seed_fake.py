"""Add extra fake data on top of the base seed (idempotent).

Run with the same DATABASE_URL as the server:
    python seed_fake.py
"""
import os
import random

os.environ.setdefault("DATABASE_URL", "sqlite:///./local_dev.db")

from sqlalchemy import select  # noqa: E402

from app.db import SessionLocal  # noqa: E402
from app.models import Account, Group, Student, Teacher  # noqa: E402
from app.security import hash_password  # noqa: E402

random.seed(42)

SURNAMES = list("陳林黃張李王吳劉蔡楊許鄭謝郭洪曾邱廖賴周")
GIVEN = [
    "怡君", "家豪", "雅婷", "宗翰", "佩珊", "建宏", "詩涵", "冠廷", "欣怡", "柏翰",
    "馨儀", "承恩", "思妤", "彥廷", "宜蓁", "俊宇", "婉婷", "志強", "曉君", "家瑋",
    "嘉玲", "明哲", "淑芬", "俊傑", "雅雯", "智偉", "佳蓉", "建志", "美君", "宇軒",
]
CLASSES = ["甲", "乙"]
CATEGORIES = ["資訊系統", "人工智慧", "嵌入式系統", "網路應用", "資訊安全", "遊戲開發"]

# new teachers
NEW_TEACHERS = [
    ("t6", "韓梅"), ("t7", "趙子龍"), ("t8", "孫尚香"),
    ("t9", "周瑜"), ("t10", "陸遜"),
]

# new groups: (id, number, name, category, year, teacher_ids)
NEW_GROUPS = [
    ("g9", 1, "校園活動報名系統", "資訊系統", "114", ["t6"]),
    ("g10", 2, "AI 履歷健檢工具", "人工智慧", "114", ["t7", "t1"]),
    ("g11", 3, "智慧停車場管理", "嵌入式系統", "114", ["t8"]),
    ("g12", 4, "校園社群論壇", "網路應用", "114", ["t9"]),
    ("g13", 5, "釣魚信件偵測平台", "資訊安全", "114", ["t10", "t2"]),
    ("g14", 1, "2D 像素冒險遊戲", "遊戲開發", "115", ["t6", "t7"]),
    ("g15", 2, "個人化課程推薦", "人工智慧", "115", ["t8"]),
    ("g16", 3, "IoT 溫室監控", "嵌入式系統", "115", ["t9"]),
]


def gen_name(used: set[str]) -> str:
    for _ in range(50):
        n = random.choice(SURNAMES) + random.choice(GIVEN)
        if n not in used:
            used.add(n)
            return n
    return random.choice(SURNAMES) + random.choice(GIVEN) + str(random.randint(1, 99))


def main() -> None:
    db = SessionLocal()
    try:
        if db.get(Teacher, "t6") is not None:
            print("Fake data already added — skipping.")
            return

        for tid, name in NEW_TEACHERS:
            db.add(Teacher(id=tid, name=name))
        db.flush()
        teachers_by_id = {t.id: t for t in db.scalars(select(Teacher)).all()}

        for gid, number, name, category, year, tids in NEW_GROUPS:
            db.add(Group(
                id=gid, number=number, name=name, category=category,
                school_year=year, teachers=[teachers_by_id[t] for t in tids],
            ))
        db.flush()

        used_names = {s.name for s in db.scalars(select(Student)).all()}
        existing_sids = {s.student_id for s in db.scalars(select(Student)).all()}

        # build a roster: assign ~4 students per new group, plus some unassigned
        new_students: list[Student] = []
        sn = 31
        sid_counter = {"114": 12001, "115": 13001}

        def make_student(year: str, group_id: str | None, status: str = "active") -> Student:
            nonlocal sn
            while True:
                sid_counter[year] += 1
                code = "A" + str(sid_counter[year])
                if code not in existing_sids:
                    existing_sids.add(code)
                    break
            st = Student(
                id="s%02d" % sn,
                student_id=code,
                name=gen_name(used_names),
                class_=random.choice(CLASSES),
                school_year=year,
                group_id=group_id,
                status=status,
            )
            sn += 1
            return st

        # fill 2025-2026 groups (g9-g13) with 4 members each
        for gid in ["g9", "g10", "g11", "g12", "g13"]:
            for _ in range(4):
                new_students.append(make_student("114", gid))
        # fill 2026-2027 groups (g14-g16) with 3 members each
        for gid in ["g14", "g15", "g16"]:
            for _ in range(3):
                new_students.append(make_student("115", gid))
        # some unassigned / inactive for variety
        for _ in range(6):
            new_students.append(make_student("114", None))
        for _ in range(3):
            new_students.append(make_student("115", None, status="inactive"))

        for st in new_students:
            db.add(st)
        db.flush()

        # set group leaders to the first member of each new group
        for gid in ["g9", "g10", "g11", "g12", "g13", "g14", "g15", "g16"]:
            member = db.scalar(select(Student).where(Student.group_id == gid))
            if member:
                db.get(Group, gid).leader_id = member.id

        # a couple more accounts linked to new teachers
        pw = hash_password("password")
        for uid, username, role, tid in [
            ("u7", "han", "editor", "t6"),
            ("u8", "zhao", "viewer", "t7"),
        ]:
            if not db.scalar(select(Account).where(Account.username == username)):
                db.add(Account(id=uid, username=username, password_hash=pw,
                               role=role, active=True, teacher_id=tid))

        db.commit()
        print("Added: %d teachers, %d groups, %d students, 2 accounts."
              % (len(NEW_TEACHERS), len(NEW_GROUPS), len(new_students)))
    finally:
        db.close()


if __name__ == "__main__":
    main()
