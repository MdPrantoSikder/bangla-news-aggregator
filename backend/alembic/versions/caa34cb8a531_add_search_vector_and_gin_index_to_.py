"""add search_vector and gin index to articles

Revision ID: caa34cb8a531
Revises: 98a217214b84
Create Date: 2026-05-21 ...

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'caa34cb8a531'
down_revision: Union[str, None] = '98a217214b84'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    Add full-text search support to the articles table.

    Adds:
      1. search_vector tsvector column — auto-computed from headline + body
         using PostgreSQL's 'simple' text search config. We use 'simple'
         (not 'english') because the DB has both English and Bangla text,
         and 'english' would mangle Bangla characters.
      2. GIN index on search_vector for fast full-text queries.

    The column is GENERATED ALWAYS AS ... STORED, so PostgreSQL auto-
    updates it whenever an article is inserted or updated. No app-side
    triggers or manual maintenance needed.
    """
    # Step 1: add the generated tsvector column via raw SQL.
    # Alembic's add_column() doesn't natively support GENERATED ALWAYS AS,
    # so we use op.execute() with raw DDL.
    op.execute("""
        ALTER TABLE articles
        ADD COLUMN search_vector tsvector
        GENERATED ALWAYS AS (
            to_tsvector('simple', coalesce(headline, '') || ' ' || coalesce(body, ''))
        ) STORED
    """)

    # Step 2: create the GIN index for fast text search.
    op.execute("""
        CREATE INDEX ix_articles_search_vector
        ON articles USING GIN(search_vector)
    """)


def downgrade() -> None:
    """Roll back: drop the index, then the column."""
    op.execute("DROP INDEX IF EXISTS ix_articles_search_vector")
    op.execute("ALTER TABLE articles DROP COLUMN IF EXISTS search_vector")