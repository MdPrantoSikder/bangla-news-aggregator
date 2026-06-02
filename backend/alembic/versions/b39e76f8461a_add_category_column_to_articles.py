"""add category column to articles

Revision ID: b39e76f8461a
Revises: caa34cb8a531
Create Date: 2026-05-23 10:39:46.270490

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'b39e76f8461a'
down_revision: Union[str, Sequence[str], None] = 'caa34cb8a531'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "articles",
        sa.Column("category", sa.String(length=30), nullable=True),
    )
    op.create_index("ix_articles_category", "articles", ["category"])


def downgrade() -> None:
    op.drop_index("ix_articles_category", table_name="articles")
    op.drop_column("articles", "category")