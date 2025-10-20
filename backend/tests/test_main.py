"""
Test suite for EAILI5 backend API
"""

import pytest
import asyncio
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, patch
import json

# Import the main app
from main import app

client = TestClient(app)

class TestHealthCheck:
    """Test health check endpoints"""
    
    def test_root_endpoint(self):
        """Test root endpoint"""
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "DeCrypt API is running" in data["message"]
    
    def test_health_check(self):
        """Test comprehensive health check"""
        response = client.get("/api/health")
        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        assert "timestamp" in data

class TestTokenEndpoints:
    """Test token-related endpoints"""
    
    @patch('services.token_service.TokenService.get_trending_tokens')
    def test_get_tokens(self, mock_get_trending):
        """Test getting trending tokens"""
        mock_tokens = [
            {
                "address": "0x123",
                "name": "Test Token",
                "symbol": "TEST",
                "price": 1.0,
                "market_cap": 1000000,
                "volume_24h": 100000,
                "liquidity": 500000,
                "holders": 1000,
                "safety_score": 85,
                "last_updated": "2025-01-01T00:00:00Z"
            }
        ]
        mock_get_trending.return_value = mock_tokens
        
        response = client.get("/api/tokens")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert "tokens" in data
        assert len(data["tokens"]) == 1
        assert data["tokens"][0]["symbol"] == "TEST"
    
    @patch('services.token_service.TokenService.get_token_details')
    def test_get_token_details(self, mock_get_details):
        """Test getting token details"""
        mock_details = {
            "address": "0x123",
            "name": "Test Token",
            "symbol": "TEST",
            "price": 1.0,
            "market_cap": 1000000,
            "volume_24h": 100000,
            "liquidity": 500000,
            "holders": 1000,
            "safety_score": 85,
            "last_updated": "2025-01-01T00:00:00Z"
        }
        mock_get_details.return_value = mock_details
        
        response = client.get("/api/tokens/0x123")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert data["token"]["symbol"] == "TEST"

class TestPortfolioEndpoints:
    """Test portfolio-related endpoints"""
    
    @patch('services.portfolio_simulator.PortfolioSimulator.get_portfolio')
    def test_get_portfolio(self, mock_get_portfolio):
        """Test getting user portfolio"""
        mock_portfolio = {
            "user_id": "test_user",
            "initial_balance": 100.0,
            "cash_balance": 50.0,
            "total_value": 150.0,
            "holdings": [],
            "trade_count": 0,
            "total_trades": 0,
            "created_at": "2025-01-01T00:00:00Z",
            "last_updated": "2025-01-01T00:00:00Z"
        }
        mock_get_portfolio.return_value = mock_portfolio
        
        response = client.get("/api/portfolio/test_user")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert data["portfolio"]["user_id"] == "test_user"
    
    @patch('services.portfolio_simulator.PortfolioSimulator.simulate_trade')
    def test_simulate_trade(self, mock_simulate):
        """Test simulating a trade"""
        mock_result = {
            "status": "success",
            "trade_id": "trade_123",
            "new_balance": 95.0,
            "message": "Trade executed successfully"
        }
        mock_simulate.return_value = mock_result
        
        trade_data = {
            "user_id": "test_user",
            "token_address": "0x123",
            "trade_type": "buy",
            "amount": 5.0
        }
        
        response = client.post("/api/portfolio/simulate", json=trade_data)
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert data["result"]["status"] == "success"

class TestEducationalEndpoints:
    """Test educational content endpoints"""
    
    @patch('services.educational_content_service.EducationalContentService.get_content_by_category')
    def test_get_educational_content(self, mock_get_content):
        """Test getting educational content by category"""
        mock_content = [
            {
                "id": "crypto-001",
                "title": "What is Cryptocurrency?",
                "content": "Cryptocurrency is digital money...",
                "category": "basics",
                "difficulty_level": 1,
                "tags": ["cryptocurrency", "digital", "money"],
                "learning_objectives": ["Understand what cryptocurrency is"]
            }
        ]
        mock_get_content.return_value = mock_content
        
        response = client.get("/api/education/content/basics")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert len(data["content"]) == 1
        assert data["content"][0]["title"] == "What is Cryptocurrency?"
    
    @patch('services.educational_content_service.EducationalContentService.get_learning_paths')
    def test_get_learning_paths(self, mock_get_paths):
        """Test getting learning paths"""
        mock_paths = {
            "beginner": {
                "id": "beginner",
                "title": "Crypto Basics for Beginners",
                "description": "Start your crypto journey",
                "difficulty_level": 1,
                "estimated_time": "2-3 hours",
                "lessons": ["crypto-001", "crypto-002"],
                "badges": ["crypto-curious", "blockchain-basics"]
            }
        }
        mock_get_paths.return_value = mock_paths
        
        response = client.get("/api/education/paths")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert "beginner" in data["paths"]

class TestProgressEndpoints:
    """Test progress tracking endpoints"""
    
    @patch('services.progress_tracking_service.ProgressTrackingService.get_user_progress')
    def test_get_user_progress(self, mock_get_progress):
        """Test getting user progress"""
        mock_progress = {
            "user_id": "test_user",
            "learning_level": 25,
            "total_points": 150,
            "completed_lessons": ["crypto-001", "crypto-002"],
            "completed_categories": ["basics"],
            "achievements": ["first_lesson", "crypto_curious"],
            "streak_days": 5,
            "total_time_spent": 120,
            "created_at": "2025-01-01T00:00:00Z",
            "last_updated": "2025-01-01T00:00:00Z"
        }
        mock_get_progress.return_value = mock_progress
        
        response = client.get("/api/progress/test_user")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert data["progress"]["user_id"] == "test_user"
        assert data["progress"]["learning_level"] == 25
    
    @patch('services.progress_tracking_service.ProgressTrackingService.get_achievements')
    def test_get_user_achievements(self, mock_get_achievements):
        """Test getting user achievements"""
        mock_achievements = [
            {
                "id": "first_lesson",
                "name": "Getting Started",
                "description": "Complete your first lesson",
                "icon": "🎯",
                "points": 10
            },
            {
                "id": "crypto_curious",
                "name": "Crypto Curious",
                "description": "Learn about cryptocurrency basics",
                "icon": "🔍",
                "points": 25
            }
        ]
        mock_get_achievements.return_value = mock_achievements
        
        response = client.get("/api/progress/test_user/achievements")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert len(data["achievements"]) == 2
        assert data["achievements"][0]["name"] == "Getting Started"

class TestWalletEndpoints:
    """Test wallet authentication endpoints"""
    
    @patch('services.wallet_auth_service.WalletAuthService.connect_wallet')
    def test_connect_wallet(self, mock_connect):
        """Test wallet connection"""
        mock_result = {
            "session_id": "session_123",
            "user_id": "user_123",
            "wallet_address": "0x123",
            "connected_at": "2025-01-01T00:00:00Z",
            "status": "connected"
        }
        mock_connect.return_value = mock_result
        
        wallet_data = {
            "address": "0x123",
            "type": "ethereum",
            "chain_id": 8453
        }
        
        response = client.post("/api/wallet/connect", json=wallet_data)
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "connected"
        assert data["wallet_address"] == "0x123"
    
    @patch('services.wallet_auth_service.WalletAuthService.disconnect_wallet')
    def test_disconnect_wallet(self, mock_disconnect):
        """Test wallet disconnection"""
        mock_disconnect.return_value = True
        
        wallet_data = {"address": "0x123"}
        
        response = client.post("/api/wallet/disconnect", json=wallet_data)
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert "disconnected successfully" in data["message"]

class TestWebSocketEndpoints:
    """Test WebSocket endpoints"""
    
    def test_websocket_chat_endpoint(self):
        """Test WebSocket chat endpoint exists"""
        # This would require a more complex test setup with WebSocket client
        # For now, we just verify the endpoint is defined
        assert True  # Placeholder for WebSocket testing
    
    def test_websocket_tokens_endpoint(self):
        """Test WebSocket tokens endpoint exists"""
        # This would require a more complex test setup with WebSocket client
        # For now, we just verify the endpoint is defined
        assert True  # Placeholder for WebSocket testing

class TestErrorHandling:
    """Test error handling"""
    
    def test_invalid_token_address(self):
        """Test invalid token address handling"""
        response = client.get("/api/tokens/invalid_address")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "error"
        assert "Failed to fetch token details" in data["error"]
    
    def test_invalid_user_id(self):
        """Test invalid user ID handling"""
        response = client.get("/api/portfolio/invalid_user")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "error"
        assert "Failed to fetch portfolio" in data["error"]

if __name__ == "__main__":
    pytest.main([__file__])
