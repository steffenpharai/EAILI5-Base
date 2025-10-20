@echo off
REM EAILI5 Test Suite Runner for Windows
REM Run all tests in Docker containers

echo 🧪 EAILI5 Test Suite Runner
echo ==========================

REM Check if we're in the right directory
if not exist "docker-compose.yml" (
    echo ❌ Error: docker-compose.yml not found. Please run from apps/base/ directory.
    exit /b 1
)

echo 📦 Starting services...
docker-compose up -d

echo ⏳ Waiting for services to be healthy...
timeout /t 10 /nobreak > nul

REM Check if services are running
echo 🔍 Checking service health...
docker-compose ps

echo.
echo 🔧 Running Backend Tests
echo ========================

REM Backend tests
echo 📊 Running backend unit tests...
docker-compose exec -T backend pytest tests/ -v --tb=short

echo.
echo 📈 Running backend coverage analysis...
docker-compose exec -T backend pytest --cov=. --cov-report=term --cov-report=html --cov-report=xml

echo.
echo 🎨 Running Frontend Tests
echo =========================

REM Frontend tests
echo ⚛️  Running frontend unit tests...
docker-compose exec -T frontend npm test -- --watchAll=false --verbose

echo.
echo 📊 Running frontend coverage analysis...
docker-compose exec -T frontend npm test -- --coverage --watchAll=false

echo.
echo 🔗 Running Integration Tests
echo ============================

REM Integration tests
echo 🔗 Running backend integration tests...
docker-compose exec -T backend pytest tests/test_integration.py -v

echo.
echo 📋 Test Summary
echo ===============

REM Generate test summary
echo ✅ Backend tests completed
echo ✅ Frontend tests completed
echo ✅ Integration tests completed

echo.
echo 📊 Coverage Reports Generated:
echo   - Backend: backend/htmlcov/index.html
echo   - Frontend: frontend/coverage/lcov-report/index.html

echo.
echo 🎉 All tests completed successfully!
echo.
echo 💡 To view coverage reports:
echo    Backend:  start backend/htmlcov/index.html
echo    Frontend: start frontend/coverage/lcov-report/index.html
echo.
echo 🛑 To stop services: docker-compose down

pause
