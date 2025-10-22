#!/usr/bin/env python3
"""
Simple script to run the Cloud SQL connection test locally
"""

import os
import sys
import subprocess
from pathlib import Path

def main():
    print("🔧 Cloud SQL Connection Test Runner")
    print("=" * 50)
    
    # Check if we're in the right directory
    backend_dir = Path(__file__).parent
    if not (backend_dir / "test_cloudsql_connection.py").exists():
        print("❌ test_cloudsql_connection.py not found!")
        return 1
    
    # Check if DATABASE_URL is set
    if not os.getenv("DATABASE_URL"):
        print("❌ DATABASE_URL environment variable not set!")
        print("Please set DATABASE_URL to your Cloud SQL connection string")
        print("Example: export DATABASE_URL='postgresql://user@/db?host=/cloudsql/project:region:instance'")
        return 1
    
    # Check if we have the required packages
    try:
        import asyncpg
        import google.cloud.sql.connector
        print("✅ Required packages found")
    except ImportError as e:
        print(f"❌ Missing required package: {e}")
        print("Please install: pip install asyncpg google-cloud-sql-connector")
        return 1
    
    # Run the test
    print("🚀 Running Cloud SQL connection test...")
    print()
    
    try:
        result = subprocess.run([
            sys.executable, "test_cloudsql_connection.py"
        ], cwd=backend_dir, check=True)
        
        print()
        print("✅ Test completed successfully!")
        return 0
        
    except subprocess.CalledProcessError as e:
        print()
        print(f"❌ Test failed with exit code: {e.returncode}")
        return e.returncode
    except Exception as e:
        print(f"❌ Error running test: {e}")
        return 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)
