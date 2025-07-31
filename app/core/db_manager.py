"""
Database management utilities for the Reddit Content Platform.
This module provides functions for database initialization, migration, and health checks.
"""

import logging
import asyncio
from typing import Dict, Any
from sqlalchemy import text, inspect
from sqlalchemy.exc import SQLAlchemyError
from alembic import command
from alembic.config import Config
from alembic.runtime.migration import MigrationContext
from alembic.script import ScriptDirectory

from app.core.database import engine, SessionLocal
from app.core.config import settings

logger = logging.getLogger(__name__)


class DatabaseManager:
    """Database management class for handling migrations and health checks."""
    
    def __init__(self):
        self.alembic_cfg = Config("alembic.ini")
        
    def get_current_revision(self) -> str:
        """Get the current database revision."""
        try:
            with engine.connect() as connection:
                context = MigrationContext.configure(connection)
                current_rev = context.get_current_revision()
                return current_rev or "None"
        except SQLAlchemyError as e:
            logger.error(f"Error getting current revision: {e}")
            return "Error"
    
    def get_head_revision(self) -> str:
        """Get the head revision from migration scripts."""
        try:
            script = ScriptDirectory.from_config(self.alembic_cfg)
            head_rev = script.get_current_head()
            return head_rev or "None"
        except Exception as e:
            logger.error(f"Error getting head revision: {e}")
            return "Error"
    
    def is_database_up_to_date(self) -> bool:
        """Check if database is up to date with latest migrations."""
        current = self.get_current_revision()
        head = self.get_head_revision()
        return current == head and current != "Error" and current != "None"
    
    def run_migrations(self) -> bool:
        """Run database migrations to latest version."""
        try:
            logger.info("Running database migrations...")
            command.upgrade(self.alembic_cfg, "head")
            logger.info("Database migrations completed successfully")
            return True
        except Exception as e:
            logger.error(f"Error running migrations: {e}")
            return False
    
    def create_migration(self, message: str) -> bool:
        """Create a new migration file."""
        try:
            logger.info(f"Creating new migration: {message}")
            command.revision(self.alembic_cfg, message=message, autogenerate=True)
            logger.info("Migration file created successfully")
            return True
        except Exception as e:
            logger.error(f"Error creating migration: {e}")
            return False
    
    def rollback_migration(self, revision: str = "-1") -> bool:
        """Rollback database to a specific revision."""
        try:
            logger.info(f"Rolling back database to revision: {revision}")
            command.downgrade(self.alembic_cfg, revision)
            logger.info("Database rollback completed successfully")
            return True
        except Exception as e:
            logger.error(f"Error rolling back database: {e}")
            return False
    
    def get_migration_history(self) -> list:
        """Get migration history."""
        try:
            script = ScriptDirectory.from_config(self.alembic_cfg)
            revisions = []
            for revision in script.walk_revisions():
                revisions.append({
                    "revision": revision.revision,
                    "down_revision": revision.down_revision,
                    "description": revision.doc,
                    "branch_labels": revision.branch_labels
                })
            return revisions
        except Exception as e:
            logger.error(f"Error getting migration history: {e}")
            return []
    
    async def check_database_health(self) -> Dict[str, Any]:
        """Comprehensive database health check."""
        health_info = {
            "status": "unknown",
            "connection": False,
            "migrations": False,
            "tables": [],
            "current_revision": "unknown",
            "head_revision": "unknown",
            "error": None
        }
        
        try:
            # Test basic connection
            with engine.connect() as connection:
                # Test connection with simple query
                result = connection.execute(text("SELECT 1"))
                result.fetchone()
                health_info["connection"] = True
                
                # Get database version
                result = connection.execute(text("SELECT version()"))
                db_version = result.fetchone()[0]
                health_info["database_version"] = db_version
                
                # Check if tables exist
                inspector = inspect(engine)
                tables = inspector.get_table_names()
                health_info["tables"] = tables
                health_info["table_count"] = len(tables)
                
                # Check migration status
                current_rev = self.get_current_revision()
                head_rev = self.get_head_revision()
                health_info["current_revision"] = current_rev
                health_info["head_revision"] = head_rev
                health_info["migrations"] = (current_rev == head_rev and current_rev != "None")
                
                # Overall status
                if health_info["connection"] and health_info["migrations"]:
                    health_info["status"] = "healthy"
                elif health_info["connection"]:
                    health_info["status"] = "needs_migration"
                else:
                    health_info["status"] = "unhealthy"
                    
        except SQLAlchemyError as e:
            logger.error(f"Database health check failed: {e}")
            health_info["status"] = "unhealthy"
            health_info["error"] = str(e)
        except Exception as e:
            logger.error(f"Unexpected error during health check: {e}")
            health_info["status"] = "error"
            health_info["error"] = str(e)
            
        return health_info
    
    def initialize_database(self) -> bool:
        """Initialize database with all tables and run migrations."""
        try:
            logger.info("Initializing database...")
            
            # Run migrations to create tables
            if not self.run_migrations():
                logger.error("Failed to run migrations during initialization")
                return False
            
            # Verify tables were created
            with engine.connect() as connection:
                inspector = inspect(engine)
                tables = inspector.get_table_names()
                expected_tables = [
                    'users', 'keywords', 'posts', 'comments', 
                    'process_logs', 'generated_content', 'metrics_cache'
                ]
                
                missing_tables = [table for table in expected_tables if table not in tables]
                if missing_tables:
                    logger.error(f"Missing tables after initialization: {missing_tables}")
                    return False
                
                logger.info(f"Database initialized successfully with {len(tables)} tables")
                return True
                
        except Exception as e:
            logger.error(f"Error initializing database: {e}")
            return False
    
    def reset_database(self) -> bool:
        """Reset database by dropping all tables and recreating them."""
        try:
            logger.warning("Resetting database - this will delete all data!")
            
            # Drop all tables
            with engine.connect() as connection:
                # Get all table names
                inspector = inspect(engine)
                tables = inspector.get_table_names()
                
                if tables:
                    # Drop tables in reverse order to handle foreign keys
                    for table in reversed(tables):
                        connection.execute(text(f"DROP TABLE IF EXISTS {table} CASCADE"))
                    connection.commit()
                    logger.info(f"Dropped {len(tables)} tables")
                
                # Drop alembic version table if it exists
                connection.execute(text("DROP TABLE IF EXISTS alembic_version CASCADE"))
                connection.commit()
            
            # Reinitialize database
            return self.initialize_database()
            
        except Exception as e:
            logger.error(f"Error resetting database: {e}")
            return False
    
    def backup_database_schema(self) -> dict:
        """Get database schema information for backup purposes."""
        try:
            with engine.connect() as connection:
                inspector = inspect(engine)
                
                schema_info = {
                    "tables": {},
                    "indexes": {},
                    "foreign_keys": {}
                }
                
                # Get table information
                for table_name in inspector.get_table_names():
                    columns = inspector.get_columns(table_name)
                    schema_info["tables"][table_name] = {
                        "columns": [
                            {
                                "name": col["name"],
                                "type": str(col["type"]),
                                "nullable": col["nullable"],
                                "default": col.get("default")
                            }
                            for col in columns
                        ]
                    }
                    
                    # Get indexes
                    indexes = inspector.get_indexes(table_name)
                    if indexes:
                        schema_info["indexes"][table_name] = indexes
                    
                    # Get foreign keys
                    foreign_keys = inspector.get_foreign_keys(table_name)
                    if foreign_keys:
                        schema_info["foreign_keys"][table_name] = foreign_keys
                
                return schema_info
                
        except Exception as e:
            logger.error(f"Error backing up database schema: {e}")
            return {"error": str(e)}
    
    def validate_migration_integrity(self) -> dict:
        """Validate that migrations are consistent and complete."""
        try:
            validation_result = {
                "status": "valid",
                "issues": [],
                "current_revision": self.get_current_revision(),
                "head_revision": self.get_head_revision(),
                "migration_count": 0
            }
            
            # Check if current revision matches head
            if validation_result["current_revision"] != validation_result["head_revision"]:
                validation_result["issues"].append(
                    f"Database revision ({validation_result['current_revision']}) "
                    f"does not match head revision ({validation_result['head_revision']})"
                )
                validation_result["status"] = "needs_migration"
            
            # Check migration history
            history = self.get_migration_history()
            validation_result["migration_count"] = len(history)
            
            if not history:
                validation_result["issues"].append("No migration history found")
                validation_result["status"] = "invalid"
            
            # Check if all expected tables exist
            with engine.connect() as connection:
                inspector = inspect(engine)
                existing_tables = set(inspector.get_table_names())
                expected_tables = {
                    'users', 'keywords', 'posts', 'comments',
                    'process_logs', 'generated_content', 'metrics_cache'
                }
                
                missing_tables = expected_tables - existing_tables
                if missing_tables:
                    validation_result["issues"].append(f"Missing tables: {missing_tables}")
                    validation_result["status"] = "invalid"
                
                extra_tables = existing_tables - expected_tables - {'alembic_version'}
                if extra_tables:
                    validation_result["issues"].append(f"Unexpected tables: {extra_tables}")
            
            return validation_result
            
        except Exception as e:
            logger.error(f"Error validating migration integrity: {e}")
            return {
                "status": "error",
                "error": str(e),
                "issues": [f"Validation failed: {e}"]
            }


# Global database manager instance
db_manager = DatabaseManager()


# Convenience functions
async def check_db_health() -> Dict[str, Any]:
    """Check database health."""
    return await db_manager.check_database_health()


def init_db() -> bool:
    """Initialize database."""
    return db_manager.initialize_database()


def migrate_db() -> bool:
    """Run database migrations."""
    return db_manager.run_migrations()


def reset_db() -> bool:
    """Reset database (WARNING: deletes all data)."""
    return db_manager.reset_database()


def backup_schema() -> dict:
    """Backup database schema information."""
    return db_manager.backup_database_schema()


def validate_migrations() -> dict:
    """Validate migration integrity."""
    return db_manager.validate_migration_integrity()


def create_migration(message: str) -> bool:
    """Create a new migration file."""
    return db_manager.create_migration(message)


def rollback_migration(revision: str = "-1") -> bool:
    """Rollback database to specific revision."""
    return db_manager.rollback_migration(revision)


# CLI-style functions for database management
if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python -m app.core.db_manager <command>")
        print("Commands: init, migrate, reset, health, status, validate, backup, create, rollback")
        sys.exit(1)
    
    command = sys.argv[1].lower()
    
    if command == "init":
        success = init_db()
        print("Database initialization:", "SUCCESS" if success else "FAILED")
    elif command == "migrate":
        success = migrate_db()
        print("Database migration:", "SUCCESS" if success else "FAILED")
    elif command == "reset":
        confirm = input("This will delete all data. Type 'yes' to confirm: ")
        if confirm.lower() == 'yes':
            success = reset_db()
            print("Database reset:", "SUCCESS" if success else "FAILED")
        else:
            print("Database reset cancelled")
    elif command == "health":
        health = asyncio.run(check_db_health())
        print("Database Health Check:")
        for key, value in health.items():
            print(f"  {key}: {value}")
    elif command == "status":
        current = db_manager.get_current_revision()
        head = db_manager.get_head_revision()
        up_to_date = db_manager.is_database_up_to_date()
        print(f"Current revision: {current}")
        print(f"Head revision: {head}")
        print(f"Up to date: {up_to_date}")
    elif command == "validate":
        validation = validate_migrations()
        print("Migration Validation:")
        for key, value in validation.items():
            print(f"  {key}: {value}")
    elif command == "backup":
        schema = backup_schema()
        if "error" in schema:
            print("Schema backup FAILED:", schema["error"])
        else:
            print("Schema backup SUCCESS")
            print(f"  Tables: {len(schema.get('tables', {}))}")
            print(f"  Indexes: {len(schema.get('indexes', {}))}")
            print(f"  Foreign Keys: {len(schema.get('foreign_keys', {}))}")
    elif command == "create":
        if len(sys.argv) < 3:
            print("Usage: python -m app.core.db_manager create <message>")
            sys.exit(1)
        message = " ".join(sys.argv[2:])
        success = create_migration(message)
        print("Migration creation:", "SUCCESS" if success else "FAILED")
    elif command == "rollback":
        revision = sys.argv[2] if len(sys.argv) > 2 else "-1"
        confirm = input(f"This will rollback to revision {revision}. Type 'yes' to confirm: ")
        if confirm.lower() == 'yes':
            success = rollback_migration(revision)
            print("Database rollback:", "SUCCESS" if success else "FAILED")
        else:
            print("Database rollback cancelled")
    else:
        print(f"Unknown command: {command}")
        print("Available commands: init, migrate, reset, health, status, validate, backup, create, rollback")
        sys.exit(1)