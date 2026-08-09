"""審查評分 API。

一次「審查」= 一個 Review（第一次企劃審查、第二次創意審查…），由 super_admin 開啟。
每位評審對每一組留下一列 ReviewScore；系上老師不得評自己指導的組別，外審委員沒有
帳號，成績由 super_admin 從 Excel 匯入（前端用 SheetJS 讀寫，後端只吃 JSON）。

稽核：評分不是學生／組別異動，只寫 db_logs，不進 audit_logs（見 docs/異動紀錄種類.md）。
"""
import json

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import audit
from ..db import get_db
from ..deps import require_editor, require_super_admin
from ..models import Account, Group, Review, ReviewScore, Teacher
from ..schemas import (
    ReviewCreate,
    ReviewOut,
    ReviewScoreIn,
    ReviewScoreOut,
    ReviewUpdate,
)

router = APIRouter()

EXT_PREFIX = "外:"  # reviewer 欄位的外審委員前綴


# ---------- helpers ----------
def _next_id(db: Session) -> str:
    ids = db.scalars(select(Review.id)).all()
    nums = [int(i[2:]) for i in ids if i.startswith("rv") and i[2:].isdigit()]
    return f"rv{(max(nums) + 1) if nums else 1}"


def _weighted(criteria: list[dict], scores: list[float]) -> float:
    total_w = sum(c["weight"] for c in criteria) or 1
    return round(sum(s * c["weight"] for s, c in zip(scores, criteria)) / total_w, 2)


def _review_out(r: Review) -> ReviewOut:
    return ReviewOut(
        id=r.id,
        name=r.name,
        school_year=r.school_year,
        criteria=json.loads(r.criteria),
        is_open=r.is_open,
    )


def _score_out(row: ReviewScore, criteria: list[dict]) -> ReviewScoreOut:
    values = json.loads(row.scores)
    return ReviewScoreOut(
        id=row.id,
        review_id=row.review_id,
        group_id=row.group_id,
        reviewer=row.reviewer,
        scores=values,
        comment=row.comment,
        total=_weighted(criteria, values),
    )


def _get_review(db: Session, review_id: str) -> Review:
    review = db.get(Review, review_id)
    if not review:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Review not found")
    return review


def _check(db: Session, actor: Account, review: Review, body: ReviewScoreIn) -> Group:
    """所有評分寫入的共用檢查。回傳被評的組別。"""
    criteria = json.loads(review.criteria)
    if len(body.scores) != len(criteria):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "評分項目數量與此審查設定不符")
    if any(s < 0 or s > 100 for s in body.scores):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "分數必須介於 0 到 100")

    group = db.get(Group, body.group_id)
    if not group:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Group not found")

    is_admin = actor.role == "super_admin"
    if not review.is_open and not is_admin:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "此審查已關閉評分")
    # 一般老師只能填自己那一列；super_admin 可代填（紙本／外審匯入）
    if not is_admin and body.reviewer != (actor.teacher_id or ""):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "只能填寫自己的評分")

    if not body.reviewer.startswith(EXT_PREFIX):
        if not db.get(Teacher, body.reviewer):
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "評審不存在，外審委員請用「外:姓名」")
        if any(t.id == body.reviewer for t in group.teachers):
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST, f"不可評分自己指導的組別（第{group.number}組）"
            )
    elif len(body.reviewer) <= len(EXT_PREFIX):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "外審委員姓名不可空白")
    return group


def _upsert(db: Session, review: Review, body: ReviewScoreIn) -> tuple[ReviewScore, dict]:
    row = db.scalar(
        select(ReviewScore).where(
            ReviewScore.review_id == review.id,
            ReviewScore.group_id == body.group_id,
            ReviewScore.reviewer == body.reviewer,
        )
    )
    payload = {
        "review_id": review.id,
        "group_id": body.group_id,
        "reviewer": body.reviewer,
        "scores": body.scores,
        "comment": body.comment,
    }
    if row:
        payload["old_scores"] = json.loads(row.scores)
        row.scores = json.dumps(body.scores)
        row.comment = body.comment
    else:
        row = ReviewScore(
            review_id=review.id,
            group_id=body.group_id,
            reviewer=body.reviewer,
            scores=json.dumps(body.scores),
            comment=body.comment,
        )
        db.add(row)
    return row, payload


# ---------- 審查場次 ----------
@router.get("", response_model=list[ReviewOut])
def list_reviews(school_year: str | None = None, db: Session = Depends(get_db)):
    stmt = select(Review)
    if school_year:
        stmt = stmt.where(Review.school_year == school_year)
    return [_review_out(r) for r in db.scalars(stmt).all()]


@router.post("", response_model=ReviewOut, status_code=status.HTTP_201_CREATED)
def create_review(
    body: ReviewCreate,
    db: Session = Depends(get_db),
    actor: Account = Depends(require_super_admin),
):
    rid = body.id
    if not rid:
        rid = _next_id(db)
    elif db.get(Review, rid):
        raise HTTPException(status.HTTP_409_CONFLICT, "Review id already exists")
    review = Review(
        id=rid,
        name=body.name,
        school_year=body.school_year,
        criteria=json.dumps([c.model_dump() for c in body.criteria], ensure_ascii=False),
        is_open=body.is_open,
    )
    db.add(review)
    audit.dblog(db, actor, "create", "reviews", rid, {**body.model_dump(), "id": rid})
    db.commit()
    db.refresh(review)
    return _review_out(review)


@router.patch("/{review_id}", response_model=ReviewOut)
def update_review(
    review_id: str,
    body: ReviewUpdate,
    db: Session = Depends(get_db),
    actor: Account = Depends(require_super_admin),
):
    review = _get_review(db, review_id)
    data = body.model_dump(exclude_unset=True)
    changes: dict = {}

    if "criteria" in data:
        new_criteria = data.pop("criteria")
        old_criteria = json.loads(review.criteria)
        if len(new_criteria) != len(old_criteria) and review.scores:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST, "已有評分資料，不可增減評分項目（請先刪除評分）"
            )
        if new_criteria != old_criteria:
            review.criteria = json.dumps(new_criteria, ensure_ascii=False)
            changes["criteria"] = {"old": old_criteria, "new": new_criteria}

    for field, value in data.items():
        old = getattr(review, field)
        if old != value:
            setattr(review, field, value)
            changes[field] = {"old": old, "new": value}

    if changes:
        audit.dblog(db, actor, "update", "reviews", review.id, changes)
    db.commit()
    db.refresh(review)
    return _review_out(review)


@router.delete("/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_review(
    review_id: str,
    db: Session = Depends(get_db),
    actor: Account = Depends(require_super_admin),
):
    review = _get_review(db, review_id)
    audit.dblog(db, actor, "delete", "reviews", review.id,
                {"name": review.name, "school_year": review.school_year,
                 "score_count": len(review.scores)})
    db.delete(review)
    db.commit()


# ---------- 評分 ----------
@router.get("/{review_id}/scores", response_model=list[ReviewScoreOut])
def list_scores(review_id: str, db: Session = Depends(get_db)):
    review = _get_review(db, review_id)
    criteria = json.loads(review.criteria)
    return [_score_out(row, criteria) for row in review.scores]


@router.put("/{review_id}/scores", response_model=ReviewScoreOut)
def put_score(
    review_id: str,
    body: ReviewScoreIn,
    db: Session = Depends(get_db),
    actor: Account = Depends(require_editor),
):
    review = _get_review(db, review_id)
    _check(db, actor, review, body)
    row, payload = _upsert(db, review, body)
    audit.dblog(db, actor, "update", "review_scores", None, payload)
    db.commit()
    db.refresh(row)
    return _score_out(row, json.loads(review.criteria))


@router.post("/{review_id}/scores/bulk", response_model=list[ReviewScoreOut])
def bulk_scores(
    review_id: str,
    body: list[ReviewScoreIn],
    db: Session = Depends(get_db),
    actor: Account = Depends(require_super_admin),
):
    """Excel 匯入：整批 upsert。任何一列不合法就整批退回（不會半匯入）。"""
    review = _get_review(db, review_id)
    rows = []
    for item in body:
        _check(db, actor, review, item)
        row, _ = _upsert(db, review, item)
        rows.append(row)
    audit.dblog(db, actor, "import", "review_scores", review.id,
                {"count": len(rows), "reviewers": sorted({b.reviewer for b in body})})
    db.commit()
    criteria = json.loads(review.criteria)
    return [_score_out(r, criteria) for r in rows]


@router.delete("/{review_id}/scores/{score_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_score(
    review_id: str,
    score_id: int,
    db: Session = Depends(get_db),
    actor: Account = Depends(require_editor),
):
    row = db.get(ReviewScore, score_id)
    if not row or row.review_id != review_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Score not found")
    if actor.role != "super_admin" and row.reviewer != (actor.teacher_id or ""):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "只能刪除自己的評分")
    audit.dblog(db, actor, "delete", "review_scores", str(score_id),
                {"review_id": review_id, "group_id": row.group_id,
                 "reviewer": row.reviewer, "scores": json.loads(row.scores)})
    db.delete(row)
    db.commit()
