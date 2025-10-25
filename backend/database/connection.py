"""
Database connection and configuration
Using Cloud SQL Python Connector with IAM authentication
"""
import os
import logging
from typing import Optional
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import text
from google.cloud.sql.connector import Connector

logger = logging.getLogger(__name__)

# Cloud SQL configuration from environment
INSTANCE_CONNECTION_NAME = os.getenv("INSTANCE_CONNECTION_NAME", "eaili5:us-central1:eaili5-postgres")
DB_USER = os.getenv("DB_USER", "879892206028-compute@developer.gserviceaccount.com")  # IAM service account email (connector converts to DB username)
DB_NAME = os.getenv("DB_NAME", "eaili5")

# Log configuration
logger.info(f"Database config: instance={INSTANCE_CONNECTION_NAME}, user={DB_USER}, db={DB_NAME}, auth=IAM")

# Initialize Cloud SQL Connector
connector = Connector()

async def getconn():
    """Create database connection using Cloud SQL Connector with IAM auth"""
    conn = await connector.connect_async(
        INSTANCE_CONNECTION_NAME,
        "asyncpg",
        user=DB_USER,
        db=DB_NAME,
        enable_iam_auth=True,  # Enable IAM authentication
    )
    return conn

# Create async engine using Cloud SQL Connector
engine = create_async_engine(
    "postgresql+asyncpg://",
    async_creator=getconn,
    pool_size=5,
    max_overflow=10,
    pool_timeout=30,
    pool_recycle=1800,
    pool_pre_ping=True,
    echo=False,
)

# Async session factory
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

async def get_database() -> Optional[AsyncSession]:
    """Get async database session"""
    try:
        async with AsyncSessionLocal() as session:
            # Test connection
            await session.execute(text("SELECT 1"))
            return session
    except Exception as e:
        logger.error(f"Database connection error: {e}")
        return None

async def check_database_connection() -> bool:
    """Check if database connection is working"""
    try:
        async with AsyncSessionLocal() as session:
            await session.execute(text("SELECT 1"))
            return True
    except Exception as e:
        logger.error(f"Database connection check failed: {e}")
        return False

async def create_appreciation_tables():
    """Create appreciation-related tables if they don't exist"""
    try:
        async with AsyncSessionLocal() as session:
            # Create appreciation_transactions table
            await session.execute(text("""
                CREATE TABLE IF NOT EXISTS appreciation_transactions (
                    id SERIAL PRIMARY KEY,
                    user_id VARCHAR(255) NOT NULL,
                    transaction_hash VARCHAR(66) NOT NULL UNIQUE,
                    amount_eth DECIMAL(18, 8) NOT NULL,
                    message_id VARCHAR(255),
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                )
            """))
            
            # Create indexes for better performance
            await session.execute(text("CREATE INDEX IF NOT EXISTS idx_appreciation_user_id ON appreciation_transactions(user_id)"))
            await session.execute(text("CREATE INDEX IF NOT EXISTS idx_appreciation_created_at ON appreciation_transactions(created_at)"))
            
            await session.commit()
            logger.info("Appreciation tables created successfully")
            
    except Exception as e:
        logger.error(f"Error creating appreciation tables: {e}")
        raise

async def close_database_connections():
    """Close all database connections"""
    try:
        await engine.dispose()
        await connector.close_async()
        logger.info("Database connections closed")
    except Exception as e:
        logger.error(f"Error closing database connections: {e}")
