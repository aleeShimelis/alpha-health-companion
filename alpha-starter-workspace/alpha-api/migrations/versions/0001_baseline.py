from __future__ import annotations

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '0001_baseline'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # users
    op.create_table(
        'users',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('phone', sa.String(length=30), nullable=True),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
    )
    op.create_index('ix_users_email', 'users', ['email'], unique=True)

    # health_profiles
    op.create_table(
        'health_profiles',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('user_id', sa.String(length=36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('age', sa.Integer(), nullable=True),
        sa.Column('sex', sa.String(length=16), nullable=True),
        sa.Column('height_cm', sa.Float(), nullable=True),
        sa.Column('weight_kg', sa.Float(), nullable=True),
        sa.Column('allergies', sa.Text(), nullable=True),
        sa.Column('conditions', sa.Text(), nullable=True),
        sa.Column('sleep_pref', sa.String(length=64), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
    )
    op.create_index('ix_health_profiles_user_id', 'health_profiles', ['user_id'], unique=True)

    # consents
    op.create_table(
        'consents',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('user_id', sa.String(length=36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('privacy_accepted', sa.Boolean(), nullable=False),
        sa.Column('marketing_opt_in', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
    )
    op.create_index('ix_consents_user_id', 'consents', ['user_id'])

    # audit_events
    op.create_table(
        'audit_events',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('user_id', sa.String(length=36), nullable=True),
        sa.Column('action', sa.String(length=64), nullable=False),
        sa.Column('resource', sa.String(length=64), nullable=False),
        sa.Column('success', sa.Boolean(), nullable=False),
        sa.Column('ip', sa.String(length=64), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
    )
    op.create_index('ix_audit_events_user_id', 'audit_events', ['user_id'])

    # vital_records
    op.create_table(
        'vital_records',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('user_id', sa.String(length=36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('systolic', sa.Float(), nullable=True),
        sa.Column('diastolic', sa.Float(), nullable=True),
        sa.Column('heart_rate', sa.Float(), nullable=True),
        sa.Column('temperature_c', sa.Float(), nullable=True),
        sa.Column('glucose_mgdl', sa.Float(), nullable=True),
        sa.Column('weight_kg', sa.Float(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
    )
    op.create_index('ix_vital_records_user_id', 'vital_records', ['user_id'])

    # symptom_reports
    op.create_table(
        'symptom_reports',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('user_id', sa.String(length=36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('severity', sa.String(length=32), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
    )
    op.create_index('ix_symptom_reports_user_id', 'symptom_reports', ['user_id'])

    # goals
    op.create_table(
        'goals',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('user_id', sa.String(length=36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('category', sa.String(length=32), nullable=False),
        sa.Column('target_value', sa.Text(), nullable=False),
        sa.Column('cadence', sa.String(length=64), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
    )
    op.create_index('ix_goals_user_id', 'goals', ['user_id'])
    op.create_index('ix_goals_category', 'goals', ['category'])

    # push_subscriptions
    op.create_table(
        'push_subscriptions',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('user_id', sa.String(length=36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('endpoint', sa.Text(), nullable=False),
        sa.Column('keys_json', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
    )
    op.create_index('ix_push_subscriptions_user_id', 'push_subscriptions', ['user_id'])
    op.create_unique_constraint('uq_user_endpoint', 'push_subscriptions', ['user_id', 'endpoint'])

    # cycle_entries
    op.create_table(
        'cycle_entries',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('user_id', sa.String(length=36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('start_date', sa.Date(), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
    )
    op.create_index('ix_cycle_entries_user_id', 'cycle_entries', ['user_id'])


def downgrade() -> None:
    op.drop_index('ix_cycle_entries_user_id', table_name='cycle_entries')
    op.drop_table('cycle_entries')

    op.drop_constraint('uq_user_endpoint', 'push_subscriptions', type_='unique')
    op.drop_index('ix_push_subscriptions_user_id', table_name='push_subscriptions')
    op.drop_table('push_subscriptions')

    op.drop_index('ix_goals_category', table_name='goals')
    op.drop_index('ix_goals_user_id', table_name='goals')
    op.drop_table('goals')

    op.drop_index('ix_symptom_reports_user_id', table_name='symptom_reports')
    op.drop_table('symptom_reports')

    op.drop_index('ix_vital_records_user_id', table_name='vital_records')
    op.drop_table('vital_records')

    op.drop_index('ix_audit_events_user_id', table_name='audit_events')
    op.drop_table('audit_events')

    op.drop_index('ix_consents_user_id', table_name='consents')
    op.drop_table('consents')

    op.drop_index('ix_health_profiles_user_id', table_name='health_profiles')
    op.drop_table('health_profiles')

    op.drop_index('ix_users_email', table_name='users')
    op.drop_table('users')
