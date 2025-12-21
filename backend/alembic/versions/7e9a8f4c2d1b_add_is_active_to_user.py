"""Add is_active to user

Revision ID: 7e9a8f4c2d1b
Revises: fdc508f3d34b
Create Date: 2025-12-21 21:55:00.000000

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision = '7e9a8f4c2d1b'
down_revision = 'fdc508f3d34b'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('user', sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')))


def downgrade() -> None:
    op.drop_column('user', 'is_active')
