"""add image_url column to articles

Revision ID: f21081df9c7c
Revises: b39e76f8461a
Create Date: 2026-05-23 17:25:08.808822

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f21081df9c7c'
down_revision: Union[str, Sequence[str], None] = 'b39e76f8461a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        'articles',
        sa.Column('image_url', sa.String(500), nullable=True),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('articles', 'image_url')
