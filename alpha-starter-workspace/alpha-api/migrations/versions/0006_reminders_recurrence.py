from __future__ import annotations

from alembic import op
import sqlalchemy as sa

revision = '0006_reminders_recurrence'
down_revision = '0005_profile_expansion'
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table('reminders') as b:
        b.add_column(sa.Column('recurrence', sa.String(length=16), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table('reminders') as b:
        b.drop_column('recurrence')

