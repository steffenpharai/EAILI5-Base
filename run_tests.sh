#!/bin/bash
# EAILI5 Test Suite Runner
# Run all tests in Docker containers

set -e  # Exit on any error

echo "🧪 EAILI5 Test Suite Runner"
echo "=========================="

# Check if we're in the right directory
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Error: docker-compose.yml not found. Please run from apps/base/ directory."
    exit 1
fi

echo "📦 Starting services..."
docker-compose up -d

echo "⏳ Waiting for services to be healthy..."
sleep 10

# Check if services are running
echo "🔍 Checking service health..."
if ! docker-compose ps | grep -q "healthy"; then
    echo "⚠️  Some services may not be fully ready, but continuing with tests..."
fi

echo ""
echo "🔧 Running Backend Tests"
echo "========================"

# Backend tests
echo "📊 Running backend unit tests..."
docker-compose exec -T backend pytest tests/ -v --tb=short

echo ""
echo "📈 Running backend coverage analysis..."
docker-compose exec -T backend pytest --cov=. --cov-report=term --cov-report=html --cov-report=xml

echo ""
echo "🎨 Running Frontend Tests"
echo "========================="

# Frontend tests
echo "⚛️  Running frontend unit tests..."
docker-compose exec -T frontend npm test -- --watchAll=false --verbose

echo ""
echo "📊 Running frontend coverage analysis..."
docker-compose exec -T frontend npm test -- --coverage --watchAll=false

echo ""
echo "🔗 Running Integration Tests"
echo "============================"

# Integration tests
echo "🔗 Running backend integration tests..."
docker-compose exec -T backend pytest tests/test_integration.py -v

echo ""
echo "📋 Test Summary"
echo "==============="

# Generate test summary
echo "✅ Backend tests completed"
echo "✅ Frontend tests completed"
echo "✅ Integration tests completed"

echo ""
echo "📊 Coverage Reports Generated:"
echo "  - Backend: backend/htmlcov/index.html"
echo "  - Frontend: frontend/coverage/lcov-report/index.html"

echo ""
echo "🎉 All tests completed successfully!"
echo ""
echo "💡 To view coverage reports:"
echo "   Backend:  open backend/htmlcov/index.html"
echo "   Frontend: open frontend/coverage/lcov-report/index.html"
echo ""
echo "🛑 To stop services: docker-compose down"
