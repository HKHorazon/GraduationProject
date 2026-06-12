"""Seed mock audit log entries (dev/demo only) — semantic-event schema.

Run:
    python seed_audit.py

行為：資料庫筆數已達目標就跳過；不足則「清空 audit_logs 重新播種」。
⚠ 重新播種會連同真實操作產生的紀錄一起刪除 — 只適合本地開發資料庫。
"""
import os
import random
from datetime import datetime, timedelta

os.environ.setdefault("DATABASE_URL", "sqlite:///./local_dev.db")

from sqlalchemy import select, func  # noqa: E402
from app.db import SessionLocal  # noqa: E402
from app.models import AuditLog, DbLog  # noqa: E402


def dt(days_ago: int, hour: int = 9, minute: int = 0) -> datetime:
    """N 天前的某時刻（本地時區）— 前端顯示的就是這裡指定的 hour:minute。"""
    base = datetime.now().astimezone().replace(hour=hour, minute=minute, second=0, microsecond=0)
    return base - timedelta(days=days_ago)


# (created_at, actor, event, summary, student_id, teacher_id, group_id)
LOGS = [
    # ── 112 學年（較久以前）────────────────────────────────────────────
    # 12 位學生全記（v2 取消「匯入」事件，批次匯入 = N 筆「新增學生」）
    (dt(60, 10, 0), "admin", "student_create", "新增 謝志豪（A10001，112學年 甲班）", "s13", None, None),
    (dt(60, 10, 1), "admin", "student_create", "新增 江淑惠（A10002，112學年 甲班）", "s14", None, None),
    (dt(60, 10, 2), "admin", "student_create", "新增 余建志（A10003，112學年 乙班）", "s15", None, None),
    (dt(60, 10, 3), "admin", "student_create", "新增 潘曉雯（A10004，112學年 乙班）", "s16", None, None),
    (dt(60, 10, 4), "admin", "student_create", "新增 魏志強（A10005，112學年 甲班）", "s17", None, None),
    (dt(60, 10, 5), "admin", "student_create", "新增 唐雅萍（A10006，112學年 甲班）", "s18", None, None),
    (dt(60, 10, 6), "admin", "student_create", "新增 盧冠廷（A10007，112學年 乙班）", "s19", None, None),
    (dt(60, 10, 7), "admin", "student_create", "新增 石怡君（A10008，112學年 甲班）", "s20", None, None),
    (dt(60, 10, 8), "admin", "student_create", "新增 何思賢（A10009，112學年 乙班）", "s21", None, None),
    (dt(60, 10, 9), "admin", "student_create", "新增 倪靜怡（A10010，112學年 甲班）", "s22", None, None),
    (dt(60, 10, 10), "admin", "student_create", "新增 翁育誠（A10011，112學年 乙班）", "s23", None, None),
    (dt(60, 10, 11), "admin", "student_create", "新增 方建中（A10012，112學年 甲班）", "s24", None, None),
    (dt(60, 11, 0), "admin", "group_create", "建立 第1組「健康管理 APP」（112學年）", None, None, "g5"),
    (dt(60, 11, 1), "admin", "group_create", "建立 第2組「校園失物招領平台」（112學年）", None, None, "g6"),
    (dt(60, 11, 2), "admin", "group_create", "建立 第3組「線上選修課系統」（112學年）", None, None, "g7"),
    (dt(60, 11, 3), "admin", "group_create", "建立 第4組「宿舍管理系統」（112學年）", None, None, "g8"),
    (dt(59, 14, 0), "chen", "student_join", "謝志豪（A10001） 加入 第1組", "s13", None, "g5"),
    (dt(59, 14, 2), "chen", "student_join", "江淑惠（A10002） 加入 第1組", "s14", None, "g5"),
    (dt(59, 14, 3), "chen", "student_join", "余建志（A10003） 加入 第1組", "s15", None, "g5"),
    (dt(59, 14, 10), "lin", "student_join", "潘曉雯（A10004） 加入 第2組", "s16", None, "g6"),
    (dt(59, 14, 12), "lin", "student_join", "魏志強（A10005） 加入 第2組", "s17", None, "g6"),
    (dt(59, 14, 14), "lin", "student_join", "唐雅萍（A10006） 加入 第2組", "s18", None, "g6"),
    (dt(59, 15, 0), "chen", "student_join", "盧冠廷（A10007） 加入 第3組", "s19", None, "g7"),
    (dt(59, 15, 1), "chen", "student_join", "石怡君（A10008） 加入 第3組", "s20", None, "g7"),
    (dt(59, 15, 2), "chen", "student_join", "何思賢（A10009） 加入 第3組", "s21", None, "g7"),
    (dt(59, 15, 10), "lin", "student_join", "倪靜怡（A10010） 加入 第4組", "s22", None, "g8"),
    (dt(59, 15, 11), "lin", "student_join", "翁育誠（A10011） 加入 第4組", "s23", None, "g8"),
    (dt(58, 11, 0), "chen", "group_leader", "第1組 組長：謝志豪（A10001）", "s13", None, "g5"),
    (dt(58, 11, 2), "lin", "group_leader", "第2組 組長：潘曉雯（A10004）", "s16", None, "g6"),
    (dt(58, 11, 4), "chen", "group_leader", "第3組 組長：盧冠廷（A10007）", "s19", None, "g7"),
    (dt(58, 11, 6), "lin", "group_leader", "第4組 組長：倪靜怡（A10010）", "s22", None, "g8"),

    # ── 113 學年建立 ────────────────────────────────────────────────────
    (dt(30, 9, 0), "admin", "student_create", "新增 王大明（A11001，113學年 甲班）", "s01", None, None),
    (dt(30, 9, 1), "admin", "student_create", "新增 李小花（A11002，113學年 甲班）", "s02", None, None),
    (dt(30, 9, 2), "admin", "student_create", "新增 張偉豪（A11003，113學年 乙班）", "s03", None, None),
    (dt(30, 9, 3), "admin", "student_create", "新增 陳雅琪（A11004，113學年 乙班）", "s04", None, None),
    (dt(30, 9, 4), "admin", "student_create", "新增 劉志遠（A11005，113學年 甲班）", "s05", None, None),
    (dt(30, 9, 5), "admin", "student_create", "新增 林佳穎（A11006，113學年 甲班）", "s06", None, None),
    (dt(30, 9, 6), "admin", "student_create", "新增 黃俊傑（A11007，113學年 甲班）", "s07", None, None),
    (dt(30, 9, 7), "admin", "student_create", "新增 吳思穎（A11008，113學年 乙班）", "s08", None, None),
    (dt(30, 9, 8), "admin", "student_create", "新增 鄭家豪（A11009，113學年 甲班）", "s09", None, None),
    (dt(30, 9, 9), "admin", "student_create", "新增 許美玲（A11010，113學年 甲班）", "s10", None, None),
    (dt(30, 9, 10), "admin", "student_create", "新增 蔡宗翰（A11011，113學年 乙班）", "s11", None, None),
    (dt(30, 9, 11), "admin", "student_create", "新增 周靜文（A11012，113學年 甲班）", "s12", None, None),
    (dt(30, 9, 20), "chen", "group_create", "建立 第1組「智慧校園導覽系統」（113學年）", None, None, "g1"),
    (dt(30, 9, 22), "chen", "group_create", "建立 第2組「環保能源監測平台」（113學年）", None, None, "g2"),
    (dt(30, 9, 24), "lin", "group_create", "建立 第3組「AI 作業批改助手」（113學年）", None, None, "g3"),
    (dt(30, 9, 26), "lin", "group_create", "建立 第4組「圖書館借還書自動化」（113學年）", None, None, "g4"),
    (dt(29, 14, 0), "chen", "student_join", "王大明（A11001） 加入 第1組", "s01", None, "g1"),
    (dt(29, 14, 1), "chen", "student_join", "李小花（A11002） 加入 第1組", "s02", None, "g1"),
    (dt(29, 14, 2), "chen", "student_join", "張偉豪（A11003） 加入 第1組", "s03", None, "g1"),
    (dt(29, 14, 10), "chen", "student_join", "陳雅琪（A11004） 加入 第2組", "s04", None, "g2"),
    (dt(29, 14, 11), "chen", "student_join", "劉志遠（A11005） 加入 第2組", "s05", None, "g2"),
    (dt(29, 14, 12), "chen", "student_join", "林佳穎（A11006） 加入 第2組", "s06", None, "g2"),
    (dt(29, 15, 0), "lin", "student_join", "黃俊傑（A11007） 加入 第3組", "s07", None, "g3"),
    (dt(29, 15, 10), "lin", "student_join", "許美玲（A11010） 加入 第4組", "s10", None, "g4"),
    (dt(29, 15, 11), "lin", "student_join", "蔡宗翰（A11011） 加入 第4組", "s11", None, "g4"),
    (dt(28, 10, 0), "chen", "group_leader", "第1組 組長：王大明（A11001）", "s01", None, "g1"),
    (dt(28, 10, 5), "chen", "group_leader", "第2組 組長：陳雅琪（A11004）", "s04", None, "g2"),
    (dt(28, 10, 10), "lin", "group_leader", "第3組 組長：黃俊傑（A11007）", "s07", None, "g3"),
    (dt(28, 10, 15), "lin", "group_leader", "第4組 組長：許美玲（A11010）", "s10", None, "g4"),

    # ── 途中異動 ────────────────────────────────────────────────────────
    # 改完的結果（人工智慧）需與 DB 現況一致
    (dt(20, 9, 30), "chen", "group_category", "第3組 類別：多媒體 → 人工智慧", None, None, "g3"),
    (dt(18, 13, 0), "lin", "student_move", "張偉豪（A11003）：第1組 → 第3組", "s03", None, "g3"),
    (dt(18, 13, 30), "lin", "student_move", "張偉豪（A11003）：第3組 → 第1組", "s03", None, "g1"),
    (dt(15, 11, 0), "lin", "student_leave", "吳思穎（A11008） 離開 第3組", "s08", None, "g3"),
    (dt(15, 11, 1), "lin", "student_status", "吳思穎（A11008）：在學 → 休退學", "s08", None, None),
    (dt(15, 11, 5), "lin", "student_leave", "鄭家豪（A11009） 離開 第4組", "s09", None, "g4"),
    (dt(15, 11, 6), "lin", "student_status", "鄭家豪（A11009）：在學 → 休退學", "s09", None, None),
    (dt(10, 14, 0), "chen", "group_rename", "第1組 題目：「智慧校園導覽系統」→「智慧校園導覽系統 v2」", None, None, "g1"),
    (dt(10, 14, 5), "chen", "group_rename", "第1組 題目：「智慧校園導覽系統 v2」→「智慧校園導覽系統」", None, None, "g1"),

    # ── 最近操作（114 學年，需與 DB 現況收斂一致）────────────────────────
    # 韓梅（t6）其後被真刪——真刪不進異動紀錄、只記 db_logs（見 main()），
    # 所以這兩筆的「老師」欄顯示「—」是設計上的正常行為
    (dt(4, 10, 0), "admin", "teacher_create", "新增老師 韓梅", None, "t6", None),
    (dt(3, 15, 0), "chen", "group_create", "建立 第3組「校園活動報名系統」（114學年）", None, None, "g9"),
    (dt(3, 15, 30), "chen", "group_rename", "第3組 題目：「校園活動報名系統」→「DDDD」", None, None, "g9"),
    (dt(2, 11, 0), "lin", "group_teachers", "第2組 指導老師：林美華 → 林美華、韓梅", None, "t6", "g2"),
    (dt(2, 14, 0), "chen", "student_move", "張偉豪（A11003）：第1組（113）→ 第3組（114）", "s03", None, "g9"),
    (dt(2, 14, 5), "chen", "student_move", "蔡宗翰（A11011）：第4組（113）→ 第3組（114）", "s11", None, "g9"),
    (dt(1, 9, 10), "chen", "student_join", "周靜文（A11012） 加入 第3組（114）", "s12", None, "g9"),
    (dt(0, 8, 30), "admin", "group_leader", "第3組（114） 組長：張偉豪（A11003）", "s03", None, "g9"),
]


# ── 大量隨機填充（讓清單超過 100 筆，可實際看到 50/頁 分頁）────────────
# 全部用「改了又改回來」的成對事件，確保最終狀態仍與 DB 現況一致；
# 不需要時把 BULK_PAIRS 設 0 即可
BULK_PAIRS = 24  # 24 對 = 48 筆；77 筆精選 + 48 = 125 筆 → 3 頁

_MOVABLE = [  # (id, 顯示名, 所在組 gid, 組號) — 不含後來轉去 g9 的 s03/s11
    ("s01", "王大明（A11001）", "g1", 1), ("s02", "李小花（A11002）", "g1", 1),
    ("s04", "陳雅琪（A11004）", "g2", 2), ("s05", "劉志遠（A11005）", "g2", 2),
    ("s06", "林佳穎（A11006）", "g2", 2), ("s07", "黃俊傑（A11007）", "g3", 3),
    ("s10", "許美玲（A11010）", "g4", 4),
]
_G113 = [("g1", 1, "智慧校園導覽系統"), ("g2", 2, "環保能源監測平台"),
         ("g3", 3, "AI 作業批改助手"), ("g4", 4, "圖書館借還書自動化")]
_CATEGORY = {"g1": "資訊系統", "g2": "嵌入式系統", "g4": "資訊系統"}  # g3 中途改過類別，不參與
_TMP_CATEGORY = ["多媒體", "遊戲", "網路應用"]


def bulk_logs(n_pairs: int) -> list:
    rng = random.Random(42)  # 固定種子 → 每次產生相同資料，可重現
    gnum = {gid: num for gid, num, _ in _G113}
    out = []
    for _ in range(n_pairs):
        # 限制在 day 5–27（組別建立於 day 30 之後、g9 異動於 day 3 之前）
        day, hour, minute = rng.randint(5, 27), rng.randint(8, 16), rng.randint(0, 58)
        actor = rng.choice(["admin", "chen", "lin"])
        roll = rng.random()
        if roll < 0.45:  # 換組又換回來
            sid, sname, home_gid, home_num = rng.choice(_MOVABLE)
            ogid, onum, _ = rng.choice([g for g in _G113 if g[0] != home_gid])
            out.append((dt(day, hour, minute), actor, "student_move",
                        f"{sname}：第{home_num}組 → 第{onum}組", sid, None, ogid))
            out.append((dt(day, hour, minute + 1), actor, "student_move",
                        f"{sname}：第{onum}組 → 第{home_num}組", sid, None, home_gid))
        elif roll < 0.75:  # 改題目又改回來
            gid, num, name = rng.choice(_G113)
            tmp = f"{name}（修訂中）"
            out.append((dt(day, hour, minute), actor, "group_rename",
                        f"第{num}組 題目：「{name}」→「{tmp}」", None, None, gid))
            out.append((dt(day, hour, minute + 1), actor, "group_rename",
                        f"第{num}組 題目：「{tmp}」→「{name}」", None, None, gid))
        else:  # 改類別又改回來
            gid = rng.choice(list(_CATEGORY))
            cur = _CATEGORY[gid]
            tmp = rng.choice([c for c in _TMP_CATEGORY if c != cur])
            out.append((dt(day, hour, minute), actor, "group_category",
                        f"第{gnum[gid]}組 類別：{cur} → {tmp}", None, None, gid))
            out.append((dt(day, hour, minute + 1), actor, "group_category",
                        f"第{gnum[gid]}組 類別：{tmp} → {cur}", None, None, gid))
    return out


def main() -> None:
    db = SessionLocal()
    try:
        all_logs = LOGS + bulk_logs(BULK_PAIRS)
        count = db.scalar(select(func.count()).select_from(AuditLog))
        if count >= len(all_logs):
            print(f"Audit logs already seeded ({count} rows) — skipping.")
            return
        if count:
            db.query(AuditLog).delete()
            print(f"Removed {count} old rows — reseeding.")
        for created_at, actor, event, summary, student_id, teacher_id, group_id in all_logs:
            db.add(AuditLog(
                created_at=created_at,
                actor=actor,
                event=event,
                summary=summary,
                student_id=student_id,
                teacher_id=teacher_id,
                group_id=group_id,
            ))
        # 韓梅（t6）的真刪只記在 db_logs（v2 設計：刪除不進異動紀錄主畫面）
        if db.scalar(select(func.count()).select_from(DbLog)) == 0:
            db.add(DbLog(created_at=dt(1, 17, 0), actor="admin", method="delete",
                         table_name="teachers", record_id="t6",
                         payload='{"name": "韓梅"}'))
        db.commit()
        print(f"Seeded {len(all_logs)} audit log entries.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
