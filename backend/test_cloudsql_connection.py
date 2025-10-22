#!/usr/bin/env python3
"""
Local test for Cloud SQL Python Connector with asyncpg
Tests the custom CloudSQLConnectionPool implementation
"""

import asyncio
import os
import sys
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from database.connection import CloudSQLConnectionPool, DATABASE_URL
from urllib.parse import urlparse, parse_qs
from google.cloud.sql.connector import create_async_connector
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_cloudsql_connection():
    """Test Cloud SQL connection using the custom pool"""
    try:
        logger.info("=== TESTING CLOUD SQL CONNECTION ===")
        logger.info(f"DATABASE_URL: {DATABASE_URL}")
        
        # Parse DATABASE_URL to get connection details
        parsed = urlparse(DATABASE_URL)
        if not parsed.query or 'host=' not in parsed.query:
            raise ValueError("Cloud SQL connection not detected in DATABASE_URL")
        
        query_params = parse_qs(parsed.query)
        instance_connection = query_params.get('host', [None])[0]
        
        if not instance_connection or not instance_connection.startswith('/cloudsql/'):
            raise ValueError(f"Unsupported host format: {instance_connection}")
        
        instance_name = instance_connection.replace('/cloudsql/', '')
        logger.info(f"Testing connection to instance: {instance_name}")
        
        # Initialize the asynchronous Cloud SQL Connector
        logger.info("Creating Cloud SQL Connector...")
        connector = await create_async_connector()
        logger.info("Cloud SQL Connector created successfully")
        
        # Create custom connection pool
        logger.info("Creating CloudSQLConnectionPool...")
        db_pool = CloudSQLConnectionPool(
            connector=connector,
            instance_name=instance_name,
            user=parsed.username,
            db=parsed.path.lstrip('/'),
        )
        logger.info("CloudSQLConnectionPool created successfully")
        
        # Test the connection
        logger.info("Testing database connection...")
        test_conn = await db_pool.acquire()
        try:
            # Test basic query
            result = await test_conn.fetchval("SELECT 1 as test_value")
            logger.info(f"✅ Database connection test successful! Result: {result}")
            
            # Test more complex query
            result = await test_conn.fetchval("SELECT current_database() as db_name")
            logger.info(f"✅ Database name: {result}")
            
            # Test IAM authentication
            result = await test_conn.fetchval("SELECT current_user as db_user")
            logger.info(f"✅ Database user: {result}")
            
        finally:
            await db_pool.release(test_conn)
            logger.info("Connection released")
        
        # Test multiple connections
        logger.info("Testing multiple connections...")
        conn1 = await db_pool.acquire()
        conn2 = await db_pool.acquire()
        
        try:
            result1 = await conn1.fetchval("SELECT 1")
            result2 = await conn2.fetchval("SELECT 2")
            logger.info(f"✅ Multiple connections working: {result1}, {result2}")
        finally:
            await db_pool.release(conn1)
            await db_pool.release(conn2)
            logger.info("Multiple connections released")
        
        # Clean up
        logger.info("Cleaning up...")
        await db_pool.close()
        logger.info("✅ Cloud SQL connection test completed successfully!")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Cloud SQL connection test failed: {e}")
        import traceback
        logger.error(f"Full traceback: {traceback.format_exc()}")
        return False

async def test_individual_connection():
    """Test individual Cloud SQL connection (Google's recommended approach)"""
    try:
        logger.info("=== TESTING INDIVIDUAL CLOUD SQL CONNECTION ===")
        
        # Parse DATABASE_URL
        parsed = urlparse(DATABASE_URL)
        query_params = parse_qs(parsed.query)
        instance_connection = query_params.get('host', [None])[0]
        instance_name = instance_connection.replace('/cloudsql/', '')
        
        # Create connector
        connector = await create_async_connector()
        
        # Create individual connection
        conn = await connector.connect(
            instance_name,
            "asyncpg",
            user=parsed.username,
            db=parsed.path.lstrip('/'),
            enable_iam_auth=True,
        )
        
        # Test connection
        result = await conn.fetchval("SELECT 1")
        logger.info(f"✅ Individual connection test successful! Result: {result}")
        
        # Clean up
        await conn.close()
        await connector.close()
        logger.info("✅ Individual connection test completed successfully!")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Individual connection test failed: {e}")
        import traceback
        logger.error(f"Full traceback: {traceback.format_exc()}")
        return False

async def main():
    """Run all tests"""
    logger.info("Starting Cloud SQL connection tests...")
    
    # Test 1: Individual connection (Google's recommended approach)
    logger.info("\n" + "="*60)
    logger.info("TEST 1: Individual Connection (Google's Best Practice)")
    logger.info("="*60)
    test1_success = await test_individual_connection()
    
    # Test 2: Custom pool (our pragmatic workaround)
    logger.info("\n" + "="*60)
    logger.info("TEST 2: Custom Pool (Our Pragmatic Workaround)")
    logger.info("="*60)
    test2_success = await test_cloudsql_connection()
    
    # Summary
    logger.info("\n" + "="*60)
    logger.info("TEST SUMMARY")
    logger.info("="*60)
    logger.info(f"Individual Connection: {'✅ PASS' if test1_success else '❌ FAIL'}")
    logger.info(f"Custom Pool: {'✅ PASS' if test2_success else '❌ FAIL'}")
    
    if test1_success and test2_success:
        logger.info("🎉 All tests passed! Cloud SQL connection is working.")
        return 0
    else:
        logger.error("💥 Some tests failed. Check the logs above.")
        return 1

if __name__ == "__main__":
    # Check if we're in the right environment
    if not os.getenv("DATABASE_URL"):
        logger.error("❌ DATABASE_URL environment variable not set!")
        logger.info("Please set DATABASE_URL to your Cloud SQL connection string")
        sys.exit(1)
    
    # Run the tests
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
