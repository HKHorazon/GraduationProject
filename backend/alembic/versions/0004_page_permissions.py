"""page permissions

Global per-page/per-role page visibility map, moved off each browser's
localStorage into the DB so a super_admin's changes apply to everyone.

Revision ID: 0004
Revises: 0003
Create Date: 2026-07-11

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0004"
down_revision: Union[str, None] = "0003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "page_permissions",
        sa.Column("page_key", sa.String(), primary_key=True),
        sa.Column("viewer", sa.Boolean(), nullable=False),
        sa.Column("editor", sa.Boolean(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("page_permissions")
