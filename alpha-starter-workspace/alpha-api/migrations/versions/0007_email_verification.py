from __future__ import annotations

from alembic import op
import sqlalchemy as sa

revision = '0007_email_verification'
down_revision = '0006_reminders_recurrence'
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table('users') as b:
        b.add_column(sa.Column('email_verified', sa.Boolean(), nullable=False, server_default=sa.false()))
    op.create_table(
        'email_verifications',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('user_id', sa.String(length=36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('token', sa.String(length=255), nullable=False),
        sa.Column('expires_at', sa.DateTime(), nullable=False),
        sa.Column('used', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
    )
    op.create_index('ix_email_verifications_user_id', 'email_verifications', ['user_id'])
    op.create_index('ix_email_verifications_token', 'email_verifications', ['token'], unique=True)


def downgrade() -> None:
    op.drop_index('ix_email_verifications_token', table_name='email_verifications')
    op.drop_index('ix_email_verifications_user_id', table_name='email_verifications')
    op.drop_table('email_verifications')
    with op.batch_alter_table('users') as b:
        b.drop_column('email_verified')

