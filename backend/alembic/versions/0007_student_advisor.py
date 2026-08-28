"""students.advisor_id — 代理指導老師

未分組的學生也要掛得住指導老師（名單上的「范立揚(代)」）。有組的人老師仍然
從 group_teachers 帶出來，這欄只在 group_id 為空時有意義。

Revision ID: 0007
Revises: 0006
Create Date: 2026-08-28

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0007"
down_revision: Union[str, None] = "0006"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("students", sa.Column("advisor_id", sa.String(), nullable=True))
    op.create_foreign_key(
        "fk_student_advisor", "students", "teachers",
        ["advisor_id"], ["id"], ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint("fk_student_advisor", "students", type_="foreignkey")
    op.drop_column("students", "advisor_id")
