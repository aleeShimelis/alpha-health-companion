from __future__ import annotations

from alembic import op
import sqlalchemy as sa

revision = '0004_reminders'
down_revision = '0003_goal_progress'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'reminders',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('user_id', sa.String(length=36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('scheduled_at', sa.DateTime(), nullable=False),
        sa.Column('sent_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
    )
    op.create_index('ix_reminders_user_id', 'reminders', ['user_id'])
    op.create_index('ix_reminders_scheduled_at', 'reminders', ['scheduled_at'])


def downgrade() -> None:
    op.drop_index('ix_reminders_scheduled_at', table_name='reminders')
    op.drop_index('ix_reminders_user_id', table_name='reminders')
    op.drop_table('reminders')

