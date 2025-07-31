"""Initial migration with all tables

Revision ID: 001
Revises: 
Create Date: 2025-07-17 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create users table
    op.create_table('users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.current_timestamp(), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.current_timestamp(), nullable=True),
        sa.Column('reddit_id', sa.String(length=50), nullable=False),
        sa.Column('username', sa.String(length=100), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)
    op.create_index(op.f('ix_users_reddit_id'), 'users', ['reddit_id'], unique=True)

    # Create keywords table
    op.create_table('keywords',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.current_timestamp(), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.current_timestamp(), nullable=True),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('keyword', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'keyword', name='uq_user_keyword')
    )
    op.create_index(op.f('ix_keywords_id'), 'keywords', ['id'], unique=False)

    # Create posts table
    op.create_table('posts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.current_timestamp(), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.current_timestamp(), nullable=True),
        sa.Column('keyword_id', sa.Integer(), nullable=False),
        sa.Column('reddit_id', sa.String(length=50), nullable=False),
        sa.Column('title', sa.Text(), nullable=False),
        sa.Column('content', sa.Text(), nullable=True),
        sa.Column('author', sa.String(length=100), nullable=True),
        sa.Column('subreddit', sa.String(length=100), nullable=True),
        sa.Column('url', sa.Text(), nullable=True),
        sa.Column('score', sa.Integer(), nullable=True),
        sa.Column('num_comments', sa.Integer(), nullable=True),
        sa.Column('created_utc', sa.DateTime(timezone=True), nullable=True),
        sa.Column('crawled_at', sa.DateTime(timezone=True), server_default=sa.func.current_timestamp(), nullable=True),
        sa.ForeignKeyConstraint(['keyword_id'], ['keywords.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_posts_id'), 'posts', ['id'], unique=False)
    op.create_index(op.f('ix_posts_reddit_id'), 'posts', ['reddit_id'], unique=True)
    op.create_index('ix_posts_keyword_created', 'posts', ['keyword_id', 'created_utc'], unique=False)
    op.create_index('ix_posts_subreddit_created', 'posts', ['subreddit', 'created_utc'], unique=False)

    # Create comments table
    op.create_table('comments',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.current_timestamp(), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.current_timestamp(), nullable=True),
        sa.Column('post_id', sa.Integer(), nullable=False),
        sa.Column('reddit_id', sa.String(length=50), nullable=False),
        sa.Column('body', sa.Text(), nullable=True),
        sa.Column('author', sa.String(length=100), nullable=True),
        sa.Column('score', sa.Integer(), nullable=True),
        sa.Column('created_utc', sa.DateTime(timezone=True), nullable=True),
        sa.Column('crawled_at', sa.DateTime(timezone=True), server_default=sa.func.current_timestamp(), nullable=True),
        sa.ForeignKeyConstraint(['post_id'], ['posts.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_comments_id'), 'comments', ['id'], unique=False)
    op.create_index(op.f('ix_comments_reddit_id'), 'comments', ['reddit_id'], unique=True)

    # Create process_logs table
    op.create_table('process_logs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.current_timestamp(), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.current_timestamp(), nullable=True),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('process_type', sa.String(length=50), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False),
        sa.Column('details', sa.Text(), nullable=True),
        sa.Column('started_at', sa.DateTime(timezone=True), server_default=sa.func.current_timestamp(), nullable=True),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_process_logs_id'), 'process_logs', ['id'], unique=False)

    # Create generated_content table
    op.create_table('generated_content',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.current_timestamp(), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.current_timestamp(), nullable=True),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('title', sa.String(length=500), nullable=False),
        sa.Column('content_type', sa.String(length=50), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('template_used', sa.String(length=100), nullable=True),
        sa.Column('source_keywords', sa.ARRAY(sa.Integer()), nullable=False),
        sa.Column('content_metadata', sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_generated_content_id'), 'generated_content', ['id'], unique=False)

    # Create metrics_cache table
    op.create_table('metrics_cache',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.current_timestamp(), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.current_timestamp(), nullable=True),
        sa.Column('cache_key', sa.String(length=255), nullable=False),
        sa.Column('data', sa.Text(), nullable=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_metrics_cache_id'), 'metrics_cache', ['id'], unique=False)
    op.create_index(op.f('ix_metrics_cache_cache_key'), 'metrics_cache', ['cache_key'], unique=True)


def downgrade() -> None:
    # Drop tables in reverse order to handle foreign key constraints
    op.drop_table('metrics_cache')
    op.drop_table('generated_content')
    op.drop_table('process_logs')
    op.drop_table('comments')
    op.drop_table('posts')
    op.drop_table('keywords')
    op.drop_table('users')