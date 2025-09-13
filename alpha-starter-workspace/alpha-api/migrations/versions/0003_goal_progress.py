from __future__ import annotations

from alembic import op
import sqlalchemy as sa

revision = '0003_goal_progress'
down_revision = '0002_refresh_tokens'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'goal_progress',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('user_id', sa.String(length=36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('goal_id', sa.String(length=36), sa.ForeignKey('goals.id', ondelete='CASCADE'), nullable=False),
        sa.Column('value', sa.Text(), nullable=False),
        sa.Column('note', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
    )
    op.create_index('ix_goal_progress_user_id', 'goal_progress', ['user_id'])
    op.create_index('ix_goal_progress_goal_id', 'goal_progress', ['goal_id'])


def downgrade() -> None:
    op.drop_index('ix_goal_progress_goal_id', table_name='goal_progress')
    op.drop_index('ix_goal_progress_user_id', table_name='goal_progress')
    op.drop_table('goal_progress')

