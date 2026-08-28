"""把 reference/專題名單NEWcsv.csv 匯入 DB（該學年度以 CSV 為準）。

    python import_projects.py <csv> <學年度> [--apply]

不加 --apply 只印出差異（dry-run）。DB 由 DATABASE_URL 決定。
ponytail: 一次性匯入腳本，跟 seed.py 同層級 — 不寫 audit_logs，不做 CLI 參數框架。
"""
import csv
import sys

from sqlalchemy import select

from app.db import SessionLocal
from app.models import Group, Student, Teacher

CSV_COLS = ("班級", "學號", "姓名", "專題名稱", "組長", "指導老師", "備註")
DROPPED = {"退學": "withdrawn", "休學": "suspended", "抵免": "exempted"}


def _next_num(existing, prefix):
    """s12 -> 13。跟 router 的 _next_num 同規則，跨全表不分學年。"""
    nums = [int(i[len(prefix):]) for i in existing if i.startswith(prefix) and i[len(prefix):].isdigit()]
    return max(nums, default=0) + 1


def read_rows(path):
    with open(path, encoding="utf-8-sig", newline="") as f:
        rows = list(csv.DictReader(f))
    missing = [c for c in CSV_COLS if c not in (rows[0] if rows else {})]
    if missing:
        raise SystemExit(f"CSV 缺少欄位：{missing}")
    out = []
    for i, r in enumerate(rows, start=2):
        rec = {k: (r[k] or "").strip() for k in CSV_COLS}
        if not rec["學號"]:
            raise SystemExit(f"第 {i} 列缺少學號")
        out.append(rec)
    seen = set()
    for r in out:
        if r["學號"] in seen:
            raise SystemExit(f"學號 {r['學號']} 在 CSV 內重複")
        seen.add(r["學號"])
    return out


def plan(db, rows, year):
    """回傳 (changes:list[str], apply_fn)。先算完再寫，dry-run 才有意義。"""
    changes = []

    # ---- teachers（只認實際帶組的老師，"X(代)" 不建組所以不算） ----
    want_teachers = sorted({r["指導老師"] for r in rows if r["專題名稱"] and r["指導老師"]})
    by_name = {t.name: t for t in db.scalars(select(Teacher))}
    new_teachers = [n for n in want_teachers if n not in by_name]
    for n in new_teachers:
        changes.append(f"新增老師：{n}")

    # ---- groups：以專題名稱為 key ----
    projects = {}
    for r in rows:
        p = r["專題名稱"]
        if not p:
            continue
        projects.setdefault(p, {"leader": r["組長"], "teacher": r["指導老師"], "members": []})
        projects[p]["members"].append(r["學號"])

    cur_groups = {g.name: g for g in db.scalars(select(Group).where(Group.school_year == year))}
    for p in projects:
        if p not in cur_groups:
            changes.append(f"新增組別：{p}")
    extra_groups = [n for n in cur_groups if n not in projects]
    for n in extra_groups:
        changes.append(f"刪除組別（CSV 沒有）：{n}")

    # ---- students ----
    cur_students = {s.student_id: s for s in db.scalars(select(Student))}
    csv_ids = {r["學號"] for r in rows}
    for r in rows:
        s = cur_students.get(r["學號"])
        status = DROPPED.get(r["備註"], "active")
        if s is None:
            changes.append(f"新增學生：{r['學號']} {r['姓名']}（{r['班級']}）")
            continue
        for field, new in (("name", r["姓名"]), ("class_", r["班級"]),
                           ("school_year", year), ("status", status)):
            old = getattr(s, field)
            if old != new:
                changes.append(f"修改學生 {r['學號']} {r['姓名']}：{field} {old!r} → {new!r}")
    extra_students = [s for sid, s in cur_students.items()
                      if s.school_year == year and sid not in csv_ids]
    for s in extra_students:
        changes.append(f"刪除學生（CSV 沒有）：{s.student_id} {s.name}")

    # 分組異動要等 group 建好才知道，統一在 apply 後比對；這裡先印組員數
    for p, d in sorted(projects.items()):
        g = cur_groups.get(p)
        old_members = sorted(m.student_id for m in g.members) if g else []
        if old_members != sorted(d["members"]):
            changes.append(f"組別「{p}」成員 {len(old_members)} → {len(d['members'])} 人，"
                           f"組長 {d['leader']}，指導 {d['teacher']}")
    ungrouped = [r for r in rows if not r["專題名稱"]]
    if ungrouped:
        changes.append(f"未分組 {len(ungrouped)} 人："
                       + "、".join(f"{r['姓名']}({r['備註'] or r['指導老師'] or '無'})" for r in ungrouped))

    def apply():
        for n in new_teachers:
            tid = f"t{_next_num([t.id for t in db.scalars(select(Teacher))], 't')}"
            t = Teacher(id=tid, name=n)
            db.add(t)
            db.flush()
            by_name[n] = t

        for g in [cur_groups[n] for n in extra_groups]:
            for m in g.members:
                m.group_id = None
            g.leader_id = None
            db.flush()
            db.delete(g)
        for s in extra_students:
            s.group_id = None
            db.delete(s)
        db.flush()

        # students（先建/更新，組長要指到 Student.id）
        all_ids = [s.id for s in db.scalars(select(Student))]
        by_sid = {}
        for r in rows:
            s = db.scalar(select(Student).where(Student.student_id == r["學號"]))
            if s is None:
                sid = f"s{_next_num(all_ids, 's')}"
                all_ids.append(sid)
                s = Student(id=sid, student_id=r["學號"])
                db.add(s)
            s.name, s.class_, s.school_year = r["姓名"], r["班級"], year
            s.status = DROPPED.get(r["備註"], "active")
            s.group_id = None
            by_sid[r["學號"]] = s
        db.flush()

        by_name_student = {r["姓名"]: by_sid[r["學號"]] for r in rows}
        for num, (p, d) in enumerate(projects.items(), start=1):
            g = db.scalar(select(Group).where(Group.school_year == year, Group.name == p))
            if g is None:
                gid = f"g{_next_num([x.id for x in db.scalars(select(Group))], 'g')}"
                g = Group(id=gid, number=num, name=p, school_year=year)
                db.add(g)
                db.flush()
            g.number = num
            g.teachers = [by_name[d["teacher"]]] if d["teacher"] in by_name else []
            for sid in d["members"]:
                by_sid[sid].group_id = g.id
            db.flush()
            leader = by_name_student.get(d["leader"])
            g.leader_id = leader.id if leader else None
        db.flush()

    return changes, apply


def main():
    if len(sys.argv) < 3:
        raise SystemExit(__doc__)
    path, year = sys.argv[1], sys.argv[2]
    do_apply = "--apply" in sys.argv
    rows = read_rows(path)
    db = SessionLocal()
    try:
        changes, apply = plan(db, rows, year)
        print(f"=== {year} 學年度 · CSV {len(rows)} 人 ===")
        for c in changes:
            print(" ", c)
        if not do_apply:
            print(f"\n(dry-run，共 {len(changes)} 項；加 --apply 才寫入)")
            return
        apply()
        db.commit()
        print(f"\n已寫入（{len(changes)} 項）")
    finally:
        db.close()


if __name__ == "__main__":
    main()
