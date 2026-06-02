"""add story_clusters and link to articles

Revision ID: 8e1684a8255a
Revises: 293176f72945
Create Date: 2026-05-21 ...
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '8e1684a8255a'  # <-- keep what Alembic generated
down_revision: Union[str, None] = '293176f72945'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "story_clusters",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("article_count", sa.Integer(), nullable=False, server_default="0"),
    )
    op.add_column(
        "articles",
        sa.Column("story_cluster_id", sa.Integer(), sa.ForeignKey("story_clusters.id"), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("articles", "story_cluster_id")
    op.drop_table("story_clusters")