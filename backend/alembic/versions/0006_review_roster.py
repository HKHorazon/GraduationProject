"""review reviewer roster + internal/external weights

一次審查要能先設定「哪些系上老師、哪些外審委員」參與（決定總覽要出現哪些欄），
以及系上老師平均與外審委員平均的比重（如 60 / 40）。

Revision ID: 0006
Revises: 0005
Create Date: 2026-08-10

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0006"
down_revision: Union[str, None] = "0005"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("reviews", sa.Column("reviewers", sa.String(), nullable=False,
                                       server_default="[]"))
    op.add_column("reviews", sa.Column("internal_weight", sa.Float(), nullable=False,
                                       server_default="60"))
    op.add_column("reviews", sa.Column("external_weight", sa.Float(), nullable=False,
                                       server_default="40"))


def downgrade() -> None:
    op.drop_column("reviews", "external_weight")
    op.drop_column("reviews", "internal_weight")
    op.drop_column("reviews", "reviewers")
