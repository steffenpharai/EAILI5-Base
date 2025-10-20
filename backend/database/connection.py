"""
Database connection and configuration
Part of the DeCrypt backend services
"""

import asyncio
from typing import Optional
import logging
from sqlalchemy import create_engine, text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
import asyncpg
import os

logger = logging.getLogger(__name__)

# Database configuration
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://eali5:eali5_password@postgres:5432/eali5")

# Create async engine
async_engine = create_async_engine(
    DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://"),
    echo=False,
    pool_pre_ping=True,
    pool_recycle=300
)

# Create async session factory
AsyncSessionLocal = sessionmaker(
    bind=async_engine,
    class_=AsyncSession,
    expire_on_commit=False
)

async def get_database() -> Optional[AsyncSession]:
    """
    Get database session
    """
    try:
        async with AsyncSessionLocal() as session:
            # Test connection
            await session.execute(text("SELECT 1"))
            return session
    except Exception as e:
        logger.error(f"Database connection error: {e}")
        return None

async def get_database_pool() -> Optional[asyncpg.Pool]:
    """
    Get database connection pool for enhanced orchestrator
    """
    try:
        # Parse DATABASE_URL to get connection parameters
        db_url = DATABASE_URL.replace("postgresql://", "").replace("postgresql+asyncpg://", "")
        if "@" in db_url:
            user_pass, host_port_db = db_url.split("@")
            if ":" in user_pass:
                user, password = user_pass.split(":")
            else:
                user, password = user_pass, ""
            
            if "/" in host_port_db:
                host_port, database = host_port_db.split("/")
                if ":" in host_port:
                    host, port = host_port.split(":")
                    port = int(port)
                else:
                    host, port = host_port, 5432
            else:
                host, port, database = host_port_db, 5432, "decrypt"
        else:
            # Default values
            user, password, host, port, database = "decrypt", "decrypt_password", "localhost", 5432, "decrypt"
        
        # Create connection pool
        pool = await asyncpg.create_pool(
            host=host,
            port=port,
            user=user,
            password=password,
            database=database,
            min_size=1,
            max_size=10
        )
        
        # Test connection
        async with pool.acquire() as conn:
            await conn.execute("SELECT 1")
        
        logger.info("Database pool created successfully")
        return pool
        
    except Exception as e:
        logger.error(f"Database pool creation error: {e}")
        return None

async def check_database_connection() -> bool:
    """
    Check if database connection is working
    """
    try:
        async with AsyncSessionLocal() as session:
            await session.execute(text("SELECT 1"))
            return True
    except Exception as e:
        logger.error(f"Database connection check failed: {e}")
        return False

async def close_database_connections():
    """
    Close all database connections
    """
    try:
        await async_engine.dispose()
        logger.info("Database connections closed")
    except Exception as e:
        logger.error(f"Error closing database connections: {e}")
