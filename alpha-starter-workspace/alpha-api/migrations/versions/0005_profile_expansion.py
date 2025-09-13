from __future__ import annotations

from alembic import op
import sqlalchemy as sa

revision = '0005_profile_expansion'
down_revision = '0004_reminders'
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table('health_profiles') as b:
        b.add_column(sa.Column('blood_type', sa.String(length=8), nullable=True))
        b.add_column(sa.Column('activity_level', sa.String(length=32), nullable=True))
        b.add_column(sa.Column('smoking_status', sa.String(length=32), nullable=True))
        b.add_column(sa.Column('alcohol_use', sa.String(length=32), nullable=True))
        b.add_column(sa.Column('medications', sa.Text(), nullable=True))
        b.add_column(sa.Column('surgeries', sa.Text(), nullable=True))
        b.add_column(sa.Column('family_history', sa.Text(), nullable=True))
        b.add_column(sa.Column('emergency_contact_name', sa.String(length=128), nullable=True))
        b.add_column(sa.Column('emergency_contact_phone', sa.String(length=32), nullable=True))
        b.add_column(sa.Column('preferred_units', sa.String(length=16), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table('health_profiles') as b:
        b.drop_column('preferred_units')
        b.drop_column('emergency_contact_phone')
        b.drop_column('emergency_contact_name')
        b.drop_column('family_history')
        b.drop_column('surgeries')
        b.drop_column('medications')
        b.drop_column('alcohol_use')
        b.drop_column('smoking_status')
        b.drop_column('activity_level')
        b.drop_column('blood_type')

