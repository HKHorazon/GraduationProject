from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Table
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
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=_utcnow, index=True)
    actor = Column(String, nullable=False)          # username who made the change
    action = Column(String, nullable=False)         # create | update | delete | import
    entity = Column(String, nullable=False)         # student | group | teacher | account
    entity_id = Column(String, nullable=True)
    summary = Column(String, nullable=False)        # human-readable description
