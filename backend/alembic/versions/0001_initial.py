"""initial schema

Revision ID: 0001
Revises:
Create Date: 2026-06-06

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "teachers",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("name", sa.String(), nullable=False),
    )

    # students.group_id FK is added after groups exists (circular reference)
    op.create_table(
        "students",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("student_id", sa.String(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("class", sa.String(), nullable=True),
        sa.Column("school_year", sa.String(), nullable=False),
        sa.Column("group_id", sa.String(), nullable=True),
        sa.Column("status", sa.String(), nullable=False, server_default="active"),
    )
    op.create_index("ix_students_student_id", "students", ["student_id"], unique=True)
    op.create_index("ix_students_school_year", "students", ["school_year"])

    op.create_table(
        "groups",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("number", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("category", sa.String(), nullable=True),
        sa.Column("school_year", sa.String(), nullable=False),
        sa.Column("leader_id", sa.String(), nullable=True),
        sa.ForeignKeyConstraint(["leader_id"], ["students.id"], ondelete="SET NULL"),
    )
    op.create_index("ix_groups_school_year", "groups", ["school_year"])

    op.create_foreign_key(
        "fk_students_group_id",
        "students",
        "groups",
        ["group_id"],
        ["id"],
        ondelete="SET NULL",
    )

    op.create_table(
        "group_teachers",
        sa.Column("group_id", sa.String(), nullable=False),
        sa.Column("teacher_id", sa.String(), nullable=False),
        sa.ForeignKeyConstraint(["group_id"], ["groups.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["teacher_id"], ["teachers.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("group_id", "teacher_id"),
    )

    op.create_table(
        "accounts",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("username", sa.String(), nullable=False),
        sa.Column("password_hash", sa.String(), nullable=False),
        sa.Column("role", sa.String(), nullable=False, server_default="viewer"),
        sa.Column("active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("teacher_id", sa.String(), nullable=True),
        sa.ForeignKeyConstraint(["teacher_id"], ["teachers.id"], ondelete="SET NULL"),
    )
    op.create_index("ix_accounts_username", "accounts", ["username"], unique=True)


def downgrade() -> None:
    op.drop_table("accounts")
    op.drop_table("group_teachers")
    op.drop_constraint("fk_students_group_id", "students", type_="foreignkey")
    op.drop_table("groups")
    op.drop_table("students")
    op.drop_table("teachers")
