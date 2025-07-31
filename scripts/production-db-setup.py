#!/usr/bin/env python3
"""
Production Database Setup Script
Handles database initialization, migrations, and optimization for production
"""

import os
import sys
import asyncio
import asyncpg
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from alembic.config import Config
from alembic import command
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ProductionDBSetup:
    def __init__(self, database_url: str):
        self.database_url = database_url
        self.engine = create_engine(database_url)
        self.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)
    
    async def create_database_if_not_exists(self):
        """Create database if it doesn't exist"""
        try:
            # Parse database URL to get connection details
            from urllib.parse import urlparse
            parsed = urlparse(self.database_url)
            
            # Connect to postgres database to create our database
            admin_url = f"postgresql://{parsed.username}:{parsed.password}@{parsed.hostname}:{parsed.port}/postgres"
            
            conn = await asyncpg.connect(admin_url)
            
            # Check if database exists
            db_name = parsed.path[1:]  # Remove leading slash
            exists = await conn.fetchval(
                "SELECT 1 FROM pg_database WHERE datname = $1", db_name
            )
            
            if not exists:
                await conn.execute(f'CREATE DATABASE "{db_name}"')
                logger.info(f"Database {db_name} created successfully")
            else:
                logger.info(f"Database {db_name} already exists")
            
            await conn.close()
            
        except Exception as e:
            logger.error(f"Error creating database: {e}")
            raise
    
    def run_migrations(self):
        """Run Alembic migrations"""
        try:
            alembic_cfg = Config("alembic.ini")
            alembic_cfg.set_main_option("sqlalchemy.url", self.database_url)
            
            # Run migrations
            command.upgrade(alembic_cfg, "head")
            logger.info("Database migrations completed successfully")
            
        except Exception as e:
            logger.error(f"Error running migrations: {e}")
            raise
    
    def create_indexes(self):
        """Create additional indexes for production performance"""
        indexes = [
            # Posts table indexes
            "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);",
            "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_score ON posts(score DESC);",
            "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_keyword_id ON posts(keyword_id);",
            "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_subreddit ON posts(subreddit);",
            "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_title_gin ON posts USING gin(to_tsvector('english', title));",
            "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_content_gin ON posts USING gin(to_tsvector('english', content));",
            
            # Keywords table indexes
            "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_keywords_user_id ON keywords(user_id);",
            "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_keywords_active ON keywords(is_active);",
            
            # Comments table indexes
            "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_comments_post_id ON comments(post_id);",
            "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);",
            
            # Generated content indexes
            "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_generated_content_type ON generated_content(content_type);",
            "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_generated_content_created_at ON generated_content(created_at DESC);",
            
            # Process logs indexes
            "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_process_logs_status ON process_logs(status);",
            "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_process_logs_created_at ON process_logs(created_at DESC);",
            
            # Metrics cache indexes
            "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_metrics_cache_key ON metrics_cache(cache_key);",
            "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_metrics_cache_expires_at ON metrics_cache(expires_at);",
        ]
        
        try:
            with self.engine.connect() as conn:
                for index_sql in indexes:
                    try:
                        conn.execute(text(index_sql))
                        logger.info(f"Created index: {index_sql.split('idx_')[1].split(' ')[0]}")
                    except Exception as e:
                        logger.warning(f"Index creation failed (may already exist): {e}")
                
                conn.commit()
            
            logger.info("Database indexes created successfully")
            
        except Exception as e:
            logger.error(f"Error creating indexes: {e}")
            raise
    
    def optimize_database(self):
        """Run database optimization commands"""
        optimization_commands = [
            # Update table statistics
            "ANALYZE;",
            
            # Vacuum tables
            "VACUUM ANALYZE posts;",
            "VACUUM ANALYZE keywords;",
            "VACUUM ANALYZE comments;",
            "VACUUM ANALYZE generated_content;",
            "VACUUM ANALYZE process_logs;",
            "VACUUM ANALYZE metrics_cache;",
        ]
        
        try:
            with self.engine.connect() as conn:
                for cmd in optimization_commands:
                    conn.execute(text(cmd))
                    logger.info(f"Executed: {cmd}")
                
                conn.commit()
            
            logger.info("Database optimization completed")
            
        except Exception as e:
            logger.error(f"Error optimizing database: {e}")
            raise
    
    def setup_monitoring(self):
        """Setup database monitoring"""
        monitoring_sql = """
        -- Enable query statistics
        CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
        
        -- Create monitoring views
        CREATE OR REPLACE VIEW slow_queries AS
        SELECT 
            query,
            calls,
            total_time,
            mean_time,
            rows
        FROM pg_stat_statements
        WHERE mean_time > 100  -- queries taking more than 100ms on average
        ORDER BY mean_time DESC;
        
        -- Create table size monitoring view
        CREATE OR REPLACE VIEW table_sizes AS
        SELECT 
            schemaname,
            tablename,
            pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
            pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
        FROM pg_tables 
        WHERE schemaname = 'public'
        ORDER BY size_bytes DESC;
        """
        
        try:
            with self.engine.connect() as conn:
                conn.execute(text(monitoring_sql))
                conn.commit()
            
            logger.info("Database monitoring setup completed")
            
        except Exception as e:
            logger.error(f"Error setting up monitoring: {e}")
            raise
    
    async def run_full_setup(self):
        """Run complete database setup"""
        logger.info("Starting production database setup...")
        
        # Create database if needed
        await self.create_database_if_not_exists()
        
        # Run migrations
        self.run_migrations()
        
        # Create performance indexes
        self.create_indexes()
        
        # Optimize database
        self.optimize_database()
        
        # Setup monitoring
        self.setup_monitoring()
        
        logger.info("Production database setup completed successfully!")

async def main():
    """Main setup function"""
    database_url = os.getenv("DATABASE_URL")
    
    if not database_url:
        logger.error("DATABASE_URL environment variable is required")
        sys.exit(1)
    
    setup = ProductionDBSetup(database_url)
    await setup.run_full_setup()

if __name__ == "__main__":
    asyncio.run(main())