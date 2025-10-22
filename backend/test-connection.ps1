# Cloud SQL Connection Test Script for Windows
# Run this script to test the Cloud SQL connection locally

Write-Host "🔧 Cloud SQL Connection Test Runner" -ForegroundColor Cyan
Write-Host "=" * 50

# Check if we're in the right directory
if (-not (Test-Path "test_cloudsql_connection.py")) {
    Write-Host "❌ test_cloudsql_connection.py not found!" -ForegroundColor Red
    Write-Host "Please run this script from the backend directory" -ForegroundColor Yellow
    exit 1
}

# Check if DATABASE_URL is set
if (-not $env:DATABASE_URL) {
    Write-Host "❌ DATABASE_URL environment variable not set!" -ForegroundColor Red
    Write-Host "Please set DATABASE_URL to your Cloud SQL connection string" -ForegroundColor Yellow
    Write-Host "Example: `$env:DATABASE_URL='postgresql://user@/db?host=/cloudsql/project:region:instance'" -ForegroundColor Yellow
    exit 1
}

# Check if we have the required packages
Write-Host "🔍 Checking required packages..." -ForegroundColor Yellow

try {
    python -c "import asyncpg, google.cloud.sql.connector; print('✅ Required packages found')"
} catch {
    Write-Host "❌ Missing required packages!" -ForegroundColor Red
    Write-Host "Please install: pip install asyncpg google-cloud-sql-connector" -ForegroundColor Yellow
    exit 1
}

# Run the test
Write-Host "🚀 Running Cloud SQL connection test..." -ForegroundColor Green
Write-Host ""

try {
    python test_cloudsql_connection.py
    $exitCode = $LASTEXITCODE
    
    Write-Host ""
    if ($exitCode -eq 0) {
        Write-Host "✅ Test completed successfully!" -ForegroundColor Green
    } else {
        Write-Host "❌ Test failed with exit code: $exitCode" -ForegroundColor Red
    }
    
    exit $exitCode
    
} catch {
    Write-Host "❌ Error running test: $_" -ForegroundColor Red
    exit 1
}
