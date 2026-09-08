"""add username column

Revision ID: 45317ca04d08
Revises: 606d428bb6c7
Create Date: 2026-09-08 16:36:43.809143

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '45317ca04d08'
down_revision: Union[str, Sequence[str], None] = '606d428bb6c7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    with op.batch_alter_table('users') as batch_op:
        batch_op.add_column(sa.Column('username', sa.String(length=255), nullable=True))
    op.execute("UPDATE users SET username = lower(display_name)")
    with op.batch_alter_table('users') as batch_op:
        batch_op.alter_column('username', nullable=False)
        batch_op.create_unique_constraint('uq_users_username', ['username'])


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table('users') as batch_op:
        batch_op.drop_constraint('uq_users_username', type_='unique')
        batch_op.drop_column('username')
