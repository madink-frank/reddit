"""Add billing tables for point-based billing system

Revision ID: 002
Revises: 001
Create Date: 2025-01-23 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '002'
down_revision: Union[str, None] = '001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create user_billing table
    op.create_table('user_billing',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.current_timestamp(), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.current_timestamp(), nullable=True),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('current_points', sa.Numeric(precision=10, scale=2), nullable=False, server_default='0.00'),
        sa.Column('total_spent', sa.Numeric(precision=10, scale=2), nullable=False, server_default='0.00'),
        sa.Column('total_purchased', sa.Numeric(precision=10, scale=2), nullable=False, server_default='0.00'),
        sa.Column('daily_limit', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('monthly_limit', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('low_balance_threshold', sa.Numeric(precision=10, scale=2), nullable=False, server_default='10.00'),
        sa.Column('notifications_enabled', sa.Boolean(), nullable=False, server_default=sa.text('1')),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id')
    )
    op.create_index(op.f('ix_user_billing_id'), 'user_billing', ['id'], unique=False)
    op.create_index(op.f('ix_user_billing_user_id'), 'user_billing', ['user_id'], unique=True)

    # Create point_transactions table
    op.create_table('point_transactions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.current_timestamp(), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.current_timestamp(), nullable=True),
        sa.Column('user_billing_id', sa.Integer(), nullable=False),
        sa.Column('transaction_type', sa.String(length=50), nullable=False),
        sa.Column('operation_type', sa.String(length=100), nullable=True),
        sa.Column('amount', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('balance_after', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('reference_id', sa.String(length=255), nullable=True),
        sa.Column('transaction_metadata', sa.Text(), nullable=True),  # Using TEXT instead of JSONB for SQLite
        sa.Column('status', sa.String(length=20), nullable=False, server_default='completed'),
        sa.Column('processed_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['user_billing_id'], ['user_billing.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_point_transactions_id'), 'point_transactions', ['id'], unique=False)
    op.create_index('ix_point_transactions_user_billing_created', 'point_transactions', ['user_billing_id', 'created_at'], unique=False)
    op.create_index('ix_point_transactions_type_created', 'point_transactions', ['transaction_type', 'created_at'], unique=False)
    op.create_index('ix_point_transactions_operation_created', 'point_transactions', ['operation_type', 'created_at'], unique=False)

    # Create usage_history table
    op.create_table('usage_history',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.current_timestamp(), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.current_timestamp(), nullable=True),
        sa.Column('user_billing_id', sa.Integer(), nullable=False),
        sa.Column('date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('period_type', sa.String(length=20), nullable=False, server_default='daily'),
        sa.Column('total_operations', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('total_points_used', sa.Numeric(precision=10, scale=2), nullable=False, server_default='0.00'),
        sa.Column('crawling_operations', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('crawling_points', sa.Numeric(precision=10, scale=2), nullable=False, server_default='0.00'),
        sa.Column('nlp_operations', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('nlp_points', sa.Numeric(precision=10, scale=2), nullable=False, server_default='0.00'),
        sa.Column('image_operations', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('image_points', sa.Numeric(precision=10, scale=2), nullable=False, server_default='0.00'),
        sa.Column('export_operations', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('export_points', sa.Numeric(precision=10, scale=2), nullable=False, server_default='0.00'),
        sa.Column('peak_usage_hour', sa.Integer(), nullable=True),
        sa.Column('usage_metadata', sa.Text(), nullable=True),  # Using TEXT instead of JSONB for SQLite
        sa.ForeignKeyConstraint(['user_billing_id'], ['user_billing.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_usage_history_id'), 'usage_history', ['id'], unique=False)
    op.create_index('ix_usage_history_user_billing_date', 'usage_history', ['user_billing_id', 'date'], unique=False)
    op.create_index('ix_usage_history_date_period', 'usage_history', ['date', 'period_type'], unique=False)
    
    # Create unique constraint for user_billing_id + date + period_type to prevent duplicates
    op.create_index('uq_usage_history_user_date_period', 'usage_history', ['user_billing_id', 'date', 'period_type'], unique=True)


def downgrade() -> None:
    # Drop tables in reverse order to handle foreign key constraints
    op.drop_table('usage_history')
    op.drop_table('point_transactions')
    op.drop_table('user_billing')