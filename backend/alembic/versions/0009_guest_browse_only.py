"""guest 分組只留瀏覽頁

0008 把舊的 page_permissions.viewer 欄直接套到 guest（以前未登入等同 viewer），
但同一版也把權限表變成後端真正的授權來源（require_editor 已移除）。結果正式站
原本只是「給 viewer 在側欄看得到」的異動紀錄／文件輸出，變成未登入也讀得到。
未登入只該看得到學生列表與組別列表，而且姓名是遮蔽的。

Revision ID: 0009
Revises: 0008
Create Date: 2026-08-28

"""
from typing import Sequence, Union

from alembic import op

revision: str = "0009"
down_revision: Union[str, None] = "0008"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        "UPDATE page_permissions SET level = 'none' "
        "WHERE group_key = 'guest' AND page_key NOT IN ('students', 'groups')"
    )


def downgrade() -> None:
    # 不還原：把「未登入可讀」倒回去沒有意義，也沒有紀錄原本是哪幾頁。
    pass
