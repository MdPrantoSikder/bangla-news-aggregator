"""add embedding column to articles

Revision ID: 293176f72945
Revises: b97f97d7d014
Create Date: 2026-05-21 10:53:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = '293176f72945'
down_revision: Union[str, None] = 'b97f97d7d014'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "articles",
        sa.Column(
            "embedding",
            postgresql.JSONB(),
            nullable=True,
        ),
    )


def downgrade() -> None:
    op.drop_column("articles", "embedding")