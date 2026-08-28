"""權限分組自由設定 + 三階存取權

原本權限只有寫死的 viewer / editor / super_admin 三種，而且每格只有開／關；
後端也完全不看這張表，只認角色。這次改成：

* permission_groups —— 可自由增刪改的分組，Account.role 存的就是這裡的 key。
  兩個內建不可刪：guest（未登入訪客）與 super_admin（全權）。
* page_permissions —— 由寬表（viewer/editor 兩欄）改成長表（group_key, page_key, level），
  level 是 none / view / edit 三階。

舊值轉換：viewer True -> view、editor True -> edit、False -> none，
所以升級後的行為與升級前一致。

Revision ID: 0008
Revises: 0007
Create Date: 2026-08-28

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0008"
down_revision: Union[str, None] = "0007"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# key, label, is_admin, builtin, sort
GROUPS = [
    ("guest", "未登入訪客", False, True, 0),
    ("viewer", "檢視者", False, False, 1),
    ("editor", "編輯者", False, False, 2),
    ("super_admin", "系統管理員", True, True, 99),
]


def upgrade() -> None:
    groups = op.create_table(
        "permission_groups",
        sa.Column("key", sa.String(), primary_key=True),
        sa.Column("label", sa.String(), nullable=False),
        sa.Column("is_admin", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("builtin", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("sort", sa.Integer(), nullable=False, server_default="0"),
    )
    op.bulk_insert(groups, [
        {"key": k, "label": lb, "is_admin": a, "builtin": b, "sort": s}
        for k, lb, a, b, s in GROUPS
    ])

    op.create_table(
        "page_permissions_new",
        sa.Column("group_key", sa.String(), primary_key=True),
        sa.Column("page_key", sa.String(), primary_key=True),
        sa.Column("level", sa.String(), nullable=False),
        sa.ForeignKeyConstraint(["group_key"], ["permission_groups.key"], ondelete="CASCADE"),
    )
    # 寬表 -> 長表。guest 沿用舊的 viewer 那一欄（以前未登入就是當 viewer 看待）。
    for group_key, col, on in (("guest", "viewer", "view"),
                               ("viewer", "viewer", "view"),
                               ("editor", "editor", "edit")):
        op.execute(
            f"INSERT INTO page_permissions_new (group_key, page_key, level) "
            f"SELECT '{group_key}', page_key, "
            f"CASE WHEN {col} THEN '{on}' ELSE 'none' END FROM page_permissions"
        )
    op.drop_table("page_permissions")
    op.rename_table("page_permissions_new", "page_permissions")


def downgrade() -> None:
    op.create_table(
        "page_permissions_old",
        sa.Column("page_key", sa.String(), primary_key=True),
        sa.Column("viewer", sa.Boolean(), nullable=False),
        sa.Column("editor", sa.Boolean(), nullable=False),
    )
    op.execute(
        "INSERT INTO page_permissions_old (page_key, viewer, editor) "
        "SELECT page_key, "
        "MAX(CASE WHEN group_key = 'viewer' AND level <> 'none' THEN 1 ELSE 0 END), "
        "MAX(CASE WHEN group_key = 'editor' AND level <> 'none' THEN 1 ELSE 0 END) "
        "FROM page_permissions GROUP BY page_key"
    )
    op.drop_table("page_permissions")
    op.rename_table("page_permissions_old", "page_permissions")
    op.drop_table("permission_groups")
