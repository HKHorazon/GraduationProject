"""One-time script: remap old group categories to the new standard values.

Old → New mapping:
  資訊系統   → 多媒體
  人工智慧   → 多媒體
  網路應用   → 多媒體
  嵌入式系統 → 其他
  資訊安全   → 其他
  遊戲開發   → 遊戲
  (anything else not in the new list) → 其他

Run once against the target database:
  python normalize_categories.py
  # or with explicit DB:
  DATABASE_URL=postgresql://... python normalize_categories.py
"""
import os
os.environ.setdefault("DATABASE_URL", "sqlite:///./local_dev.db")

from sqlalchemy import select
from app.db import SessionLocal
from app.models import Group

VALID = {"主視覺", "多媒體", "遊戲", "網紅直播", "平面設計", "其他"}

REMAP = {
    "資訊系統":   "多媒體",
    "人工智慧":   "多媒體",
    "網路應用":   "多媒體",
    "嵌入式系統": "其他",
    "資訊安全":   "其他",
    "遊戲開發":   "遊戲",
    "影像":       "多媒體",
}


def main() -> None:
    db = SessionLocal()
    try:
        groups = db.scalars(select(Group)).all()
        changed = 0
        for g in groups:
            if g.category in VALID:
                continue
            new_cat = REMAP.get(g.category, "其他")
            print(f"  {g.id} 「{g.name}」: {g.category!r} → {new_cat!r}")
            g.category = new_cat
            changed += 1
        db.commit()
        print(f"\n完成：更新 {changed} 筆，共 {len(groups)} 個組別。")
    finally:
        db.close()


if __name__ == "__main__":
    main()
