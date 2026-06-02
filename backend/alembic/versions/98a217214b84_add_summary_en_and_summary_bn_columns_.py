"""add summary_en and summary_bn columns to articles

Revision ID: 98a217214b84
Revises: 8e1684a8255a
Create Date: 2026-05-21 17:01:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '98a217214b84'
down_revision: Union[str, None] = '8e1684a8255a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    Add two summary columns: one for English, one for Bangla.

    Both are nullable because existing articles don't have summaries yet.
    New articles will get them via a Celery task that runs after embedding/
    clustering completes.

    We use Text (not String(N)) because LLM output length is unpredictable —
    we set max-output limits in the API call, not in the schema.
    """
    op.add_column(
        "articles",
        sa.Column("summary_en", sa.Text(), nullable=True),
    )
    op.add_column(
        "articles",
        sa.Column("summary_bn", sa.Text(), nullable=True),
    )


def downgrade() -> None:
    """Drop both summary columns. Used to roll back this migration."""
    op.drop_column("articles", "summary_bn")
    op.drop_column("articles", "summary_en")