"""add users and bookmarks tables

Revision ID: 3325c26162ab
Revises: a196045e632d
Create Date: 2026-05-25

Creates two tables for authentication and persistent saved articles:
  - users:     core user accounts with bcrypt password hashes
  - bookmarks: per-user saved articles (replaces localStorage in V2)
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "3325c26162ab"
down_revision: Union[str, None] = "a196045e632d"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── users ──────────────────────────────────────────────────────
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), nullable=False, autoincrement=True),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("full_name", sa.String(100), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("is_admin", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column("last_login_at", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_users_email",    "users", ["email"], unique=True)
    op.create_index("ix_users_is_admin", "users", ["is_admin"])

    # ── bookmarks ──────────────────────────────────────────────────
    op.create_table(
        "bookmarks",
        sa.Column("id", sa.Integer(), nullable=False, autoincrement=True),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("article_id", sa.Integer(), nullable=False),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column("folder_id", sa.Integer(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.ForeignKeyConstraint(["user_id"],    ["users.id"],    ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["article_id"], ["articles.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "article_id", name="uq_bookmark_user_article"),
    )
    op.create_index("ix_bookmarks_user_id",    "bookmarks", ["user_id"])
    op.create_index("ix_bookmarks_article_id", "bookmarks", ["article_id"])


def downgrade() -> None:
    op.drop_index("ix_bookmarks_article_id", table_name="bookmarks")
    op.drop_index("ix_bookmarks_user_id",    table_name="bookmarks")
    op.drop_table("bookmarks")

    op.drop_index("ix_users_is_admin", table_name="users")
    op.drop_index("ix_users_email",    table_name="users")
    op.drop_table("users")
