"""add bcs analysis fields

Revision ID: a196045e632d
Revises: f21081df9c7c
Create Date: 2026-05-24

Adds three new columns to the articles table for BCS exam relevance analysis:
  - bcs_relevance: high | medium | low | skip (LLM classification)
  - bcs_subject:   bangladesh_affairs | international | economy | etc.
  - key_facts:     JSONB array of strings (3-5 BCS-relevant facts)

All nullable for backward compatibility with existing rows.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = "a196045e632d"
down_revision: Union[str, None] = "f21081df9c7c"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add the three new columns. All nullable.
    op.add_column(
        "articles",
        sa.Column("bcs_relevance", sa.String(20), nullable=True),
    )
    op.add_column(
        "articles",
        sa.Column("bcs_subject", sa.String(50), nullable=True),
    )
    op.add_column(
        "articles",
        sa.Column("key_facts", postgresql.JSONB, nullable=True),
    )

    # Index on bcs_relevance for fast "BCS Important only" filter queries.
    op.create_index(
        "ix_articles_bcs_relevance",
        "articles",
        ["bcs_relevance"],
    )


def downgrade() -> None:
    op.drop_index("ix_articles_bcs_relevance", table_name="articles")
    op.drop_column("articles", "key_facts")
    op.drop_column("articles", "bcs_subject")
    op.drop_column("articles", "bcs_relevance")
