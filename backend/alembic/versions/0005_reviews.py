"""reviews + review scores

審查評分：一個審查場次（reviews）＋每位評審對每組的一列分數（review_scores）。
評分項目存成 reviews.criteria 的 JSON 字串，分數存成對齊順序的 JSON 陣列。

Revision ID: 0005
Revises: 0004
Create Date: 2026-08-10

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0005"
down_revision: Union[str, None] = "0004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "reviews",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("school_year", sa.String(), nullable=False, index=True),
        sa.Column("criteria", sa.String(), nullable=False),
        sa.Column("is_open", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.func.now()),
    )
    op.create_table(
        "review_scores",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("review_id", sa.String(),
                  sa.ForeignKey("reviews.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("group_id", sa.String(),
                  sa.ForeignKey("groups.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("reviewer", sa.String(), nullable=False),
        sa.Column("scores", sa.String(), nullable=False),
        sa.Column("comment", sa.String(), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.func.now()),
        sa.UniqueConstraint("review_id", "group_id", "reviewer", name="uq_review_score"),
    )


def downgrade() -> None:
    op.drop_table("review_scores")
    op.drop_table("reviews")
