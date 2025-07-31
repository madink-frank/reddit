import logging
from typing import Generator
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.exc import SQLAlchemyError
from app.core.config import settings
from app.models.base import Base

logger = logging.getLogger(__name__)

# Create database engine with enhanced configuration
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=300,
    pool_size=10,
    max_overflow=20,
    echo=False,  # Set to True for SQL query logging
    echo_pool=False,
    future=True
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Dependency to get database session
def get_db() -> Generator[Session, None, None]:
    """
    Database session dependency for FastAPI endpoints.
    Provides a database session and ensures proper cleanup.
    """
    db = SessionLocal()
    try:
        yield db
    except SQLAlchemyError as e:
        logger.error(f"Database session error: {e}")
        db.rollback()
        raise
    finally:
        db.close()

# Function to create all tables (for development/testing)
def create_tables():
    """Create all tables in the database"""
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("All database tables created successfully")
    except SQLAlchemyError as e:
        logger.error(f"Error creating database tables: {e}")
        raise

# Database health check function
async def check_database_health() -> bool:
    """
    Check if the database connection is healthy.
    Returns True if connection is successful, False otherwise.
    """
    try:
        with engine.connect() as connection:
            # Execute a simple query to test connection
            result = connection.execute(text("SELECT 1"))
            result.fetchone()
            return True
    except SQLAlchemyError as e:
        logger.error(f"Database health check failed: {e}")
        return False
    except Exception as e:
        logger.error(f"Unexpected error during database health check: {e}")
        return False

# Comprehensive database health check (uses db_manager)
async def get_database_health_info() -> dict:
    """
    Get comprehensive database health information.
    Returns detailed health status including migration info.
    """
    try:
        from app.core.db_manager import db_manager
        return await db_manager.check_database_health()
    except ImportError:
        # Fallback to basic health check if db_manager is not available
        is_healthy = await check_database_health()
        return {
            "status": "healthy" if is_healthy else "unhealthy",
            "connection": is_healthy,
            "migrations": "unknown",
            "error": None if is_healthy else "Connection failed"
        }

# Database connection test function
def test_database_connection() -> dict:
    """
    Test database connection and return detailed status information.
    Returns a dictionary with connection status and details.
    """
    try:
        with engine.connect() as connection:
            # Test basic connection
            result = connection.execute(text("SELECT version()"))
            db_version = result.fetchone()[0]
            
            # Test if we can access our tables
            result = connection.execute(text("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'"))
            table_count = result.fetchone()[0]
            
            return {
                "status": "healthy",
                "database_version": db_version,
                "table_count": table_count,
                "connection_pool_size": engine.pool.size(),
                "checked_out_connections": engine.pool.checkedout()
            }
    except SQLAlchemyError as e:
        logger.error(f"Database connection test failed: {e}")
        return {
            "status": "unhealthy",
            "error": str(e),
            "error_type": type(e).__name__
        }
    except Exception as e:
        logger.error(f"Unexpected error during database connection test: {e}")
        return {
            "status": "error",
            "error": str(e),
            "error_type": type(e).__name__
        }

# Initialize database function
def init_db():
    """
    Initialize the database by creating all tables.
    This should be called during application startup.
    """
    try:
        # Import all models to ensure they are registered
        from app.models import (
            User, Keyword, Post, Comment, ProcessLog, 
            GeneratedContent, MetricsCache
        )
        
        # Create all tables
        create_tables()
        logger.info("Database initialized successfully")
        
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")
        raise

# Database connection pool status
def get_connection_pool_status() -> dict:
    """
    Get current database connection pool status.
    Returns information about connection pool usage.
    """
    try:
        pool = engine.pool
        return {
            "pool_size": pool.size(),
            "checked_out_connections": pool.checkedout(),
            "overflow_connections": pool.overflow(),
            "checked_in_connections": pool.checkedin(),
        }
    except Exception as e:
        logger.error(f"Error getting connection pool status: {e}")
        return {"error": str(e)}

# Database connection validation
def validate_database_connection() -> bool:
    """
    Validate database connection and basic functionality.
    Returns True if database is accessible and functional.
    """
    try:
        with engine.connect() as connection:
            # Test basic query
            connection.execute(text("SELECT 1"))
            
            # Test if we can access system tables
            connection.execute(text("SELECT COUNT(*) FROM information_schema.tables"))
            
            return True
    except Exception as e:
        logger.error(f"Database connection validation failed: {e}")
        return False

# Quick database setup function for development
def quick_setup() -> bool:
    """
    Quick database setup for development environments.
    Creates tables if they don't exist and runs migrations.
    """
    try:
        logger.info("Running quick database setup...")
        
        # Import db_manager to run migrations
        from app.core.db_manager import db_manager
        
        # Initialize database
        success = db_manager.initialize_database()
        
        if success:
            logger.info("Quick database setup completed successfully")
            return True
        else:
            logger.error("Quick database setup failed")
            return False
            
    except Exception as e:
        logger.error(f"Quick setup error: {e}")
        return False

# Close database connections
def close_db_connections():
    """
    Close all database connections.
    This should be called during application shutdown.
    """
    try:
        engine.dispose()
        logger.info("Database connections closed successfully")
    except Exception as e:
        logger.error(f"Error closing database connections: {e}")
        raise