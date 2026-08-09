from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Table,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship

from .db import Base


def _utcnow():
    return datetime.now(timezone.utc)

# many-to-many: a group can have several advising teachers
group_teachers = Table(
    "group_teachers",
    Base.metadata,
    Column("group_id", ForeignKey("groups.id", ondelete="CASCADE"), primary_key=True),
    Column("teacher_id", ForeignKey("teachers.id", ondelete="CASCADE"), primary_key=True),
)


class Teacher(Base):
    __tablename__ = "teachers"

    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)

    groups = relationship("Group", secondary=group_teachers, back_populates="teachers")


class Group(Base):
    __tablename__ = "groups"

    id = Column(String, primary_key=True)
    number = Column(Integer, nullable=False)
    name = Column(String, nullable=False)
    category = Column(String, nullable=True)
    school_year = Column(String, nullable=False, index=True)
    # use_alter breaks the students<->groups circular FK for metadata.create_all
    # (used by the SQLite dev runner); Postgres uses the explicit Alembic migration.
    leader_id = Column(
        String,
        ForeignKey("students.id", ondelete="SET NULL", use_alter=True, name="fk_group_leader"),
        nullable=True,
    )

    teachers = relationship("Teacher", secondary=group_teachers, back_populates="groups")
    members = relationship(
        "Student", back_populates="group", foreign_keys="Student.group_id"
    )
    leader = relationship("Student", foreign_keys=[leader_id], post_update=True)


class Student(Base):
    __tablename__ = "students"

    id = Column(String, primary_key=True)
    student_id = Column(String, nullable=False, unique=True, index=True)
    name = Column(String, nullable=False)
    class_ = Column("class", String, nullable=True)
    school_year = Column(String, nullable=False, index=True)
    group_id = Column(String, ForeignKey("groups.id", ondelete="SET NULL"), nullable=True)
    status = Column(String, nullable=False, default="active")

    group = relationship("Group", back_populates="members", foreign_keys=[group_id])


class Account(Base):
    __tablename__ = "accounts"

    id = Column(String, primary_key=True)
    username = Column(String, nullable=False, unique=True, index=True)
    password_hash = Column(String, nullable=False)
    role = Column(String, nullable=False, default="viewer")  # super_admin | editor | viewer
    active = Column(Boolean, nullable=False, default=True)
    teacher_id = Column(String, ForeignKey("teachers.id", ondelete="SET NULL"), nullable=True)

    teacher = relationship("Teacher")


class AuditLog(Base):
    """Human-readable event timeline (shown in 異動紀錄).

    One row = one semantic event (e.g. student_join). The three ref columns
    deliberately have no FK so history survives record deletion.
    """
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=_utcnow, index=True)
    actor = Column(String, nullable=False)          # username who made the change
    event = Column(String, nullable=False, index=True)  # e.g. group_create / student_join
    summary = Column(String, nullable=False)        # human-readable, includes old → new
    student_id = Column(String, nullable=True)      # related Student.id
    teacher_id = Column(String, nullable=True)      # related Teacher.id
    group_id = Column(String, nullable=True)        # related Group.id


class DbLog(Base):
    """Raw technical log of every write operation (debug/forensics only).

    Records everything — including account changes and hard deletes that the
    human-facing audit_logs intentionally omits. Not shown in the UI.
    """
    __tablename__ = "db_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=_utcnow, index=True)
    actor = Column(String, nullable=False)
    method = Column(String, nullable=False)         # create | update | delete | import
    table_name = Column(String, nullable=False)     # students | groups | teachers | accounts
    record_id = Column(String, nullable=True)
    payload = Column(String, nullable=True)         # JSON: changed fields / old & new values


class Review(Base):
    """一次審查場次（第一次企劃審查、第二次創意審查…）。

    criteria 是 JSON list `[{"name": ..., "weight": ...}]`。單一總分的審查就是
    一個 `{"name": "總分", "weight": 100}` 項目 — 總分模式與六向度尺規模式因此
    共用同一條加權計算路徑，不需要另一個 mode 欄位。
    """
    __tablename__ = "reviews"

    id = Column(String, primary_key=True)          # rv{n}
    name = Column(String, nullable=False)
    school_year = Column(String, nullable=False, index=True)
    criteria = Column(String, nullable=False)      # JSON: [{name, weight}]
    is_open = Column(Boolean, nullable=False, default=True)  # 是否開放評分
    created_at = Column(DateTime(timezone=True), nullable=False, default=_utcnow)

    scores = relationship(
        "ReviewScore", back_populates="review", cascade="all, delete-orphan"
    )


class ReviewScore(Base):
    """一位評審對一組的評分（分數掛在組別，不分學生）。

    `reviewer` 一欄同時表示系上老師與外審委員：`t3` 是 Teacher.id，`外:王大明`
    是外審委員。外審委員沒有帳號也沒有 Teacher 紀錄（成績由 admin 從 Excel
    匯入），共用一欄才能對 (review, group, reviewer) 下唯一索引。
    ponytail: 不另開外審委員表，姓名就是識別；真要管理外審委員再拆表。
    """
    __tablename__ = "review_scores"

    id = Column(Integer, primary_key=True, autoincrement=True)
    review_id = Column(
        String, ForeignKey("reviews.id", ondelete="CASCADE"), nullable=False, index=True
    )
    group_id = Column(
        String, ForeignKey("groups.id", ondelete="CASCADE"), nullable=False, index=True
    )
    reviewer = Column(String, nullable=False)
    scores = Column(String, nullable=False)        # JSON: [number, ...] 對齊 review.criteria
    comment = Column(String, nullable=True)
    updated_at = Column(
        DateTime(timezone=True), nullable=False, default=_utcnow, onupdate=_utcnow
    )

    review = relationship("Review", back_populates="scores")

    __table_args__ = (
        UniqueConstraint("review_id", "group_id", "reviewer", name="uq_review_score"),
    )


class PagePermission(Base):
    """Global per-page/per-role page VISIBILITY map (managed on /permissions).

    Moved off each browser's localStorage so a super_admin's changes apply to
    everyone. Controls sidebar/page visibility ONLY — data writes stay guarded
    server-side by require_editor.
    """
    __tablename__ = "page_permissions"

    page_key = Column(String, primary_key=True)     # matches PAGES keys in the frontend
    viewer = Column(Boolean, nullable=False)
    editor = Column(Boolean, nullable=False)
