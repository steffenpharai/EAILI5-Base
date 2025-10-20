"""
Test suite for EAILI5 backend services
"""

import pytest
import asyncio
from unittest.mock import AsyncMock, patch, MagicMock
import json

# Import services
from services.openai_service import OpenAIService
from services.token_service import TokenService
from services.portfolio_simulator import PortfolioSimulator
from services.session_service import SessionService
from services.redis_service import RedisService
from services.bitquery_service import BitqueryService
from services.tavily_service import TavilyService
from services.websocket_service import WebSocketService

class TestOpenAIService:
    """Test OpenAI service functionality"""
    
    @pytest.fixture
    def openai_service(self):
        return OpenAIService()
    
    @pytest.mark.asyncio
    async def test_openai_generate_response(self, openai_service):
        """Test OpenAI service generates responses"""
        with patch('openai.AsyncOpenAI') as mock_openai:
            mock_client = MagicMock()
            mock_openai.return_value = mock_client
            
            mock_response = MagicMock()
            mock_response.choices = [MagicMock()]
            mock_response.choices[0].message.content = "AI response"
            mock_client.chat.completions.create.return_value = mock_response
            
            result = await openai_service.generate_response("Test prompt")
            
            assert result == "AI response"
            mock_client.chat.completions.create.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_openai_streaming_response(self, openai_service):
        """Test OpenAI service streaming responses"""
        with patch('openai.AsyncOpenAI') as mock_openai:
            mock_client = MagicMock()
            mock_openai.return_value = mock_client
            
            # Mock streaming response
            mock_chunk1 = MagicMock()
            mock_chunk1.choices = [MagicMock()]
            mock_chunk1.choices[0].delta.content = "Hello"
            
            mock_chunk2 = MagicMock()
            mock_chunk2.choices = [MagicMock()]
            mock_chunk2.choices[0].delta.content = " World"
            
            mock_client.chat.completions.create.return_value = [mock_chunk1, mock_chunk2]
            
            chunks = []
            async for chunk in openai_service.generate_response_stream("Test prompt"):
                chunks.append(chunk)
            
            assert chunks == ["Hello", " World"]
    
    @pytest.mark.asyncio
    async def test_openai_error_handling(self, openai_service):
        """Test OpenAI service handles errors"""
        with patch('openai.AsyncOpenAI') as mock_openai:
            mock_client = MagicMock()
            mock_openai.return_value = mock_client
            mock_client.chat.completions.create.side_effect = Exception("API Error")
            
            with pytest.raises(Exception):
                await openai_service.generate_response("Test prompt")

class TestTokenService:
    """Test token service functionality"""
    
    @pytest.fixture
    def token_service(self):
        return TokenService()
    
    @pytest.mark.asyncio
    async def test_get_trending_tokens(self, token_service):
        """Test token service fetches trending tokens"""
        with patch('services.bitquery_service.BitqueryService.get_trending_tokens') as mock_bitquery:
            mock_bitquery.return_value = [
                {"address": "0x123", "name": "Base Token", "symbol": "BASE", "price": 1.0}
            ]
            
            tokens = await token_service.get_trending_tokens()
            
            assert len(tokens) > 0
            assert tokens[0]["name"] == "Base Token"
            mock_bitquery.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_get_token_details(self, token_service):
        """Test token service fetches token details"""
        with patch('services.bitquery_service.BitqueryService.get_token_details') as mock_bitquery:
            mock_bitquery.return_value = {
                "address": "0x123",
                "name": "Base Token",
                "price": 1.0,
                "market_cap": 1000000
            }
            
            details = await token_service.get_token_details("0x123")
            
            assert details["name"] == "Base Token"
            assert details["price"] == 1.0
            mock_bitquery.assert_called_once_with("0x123")
    
    @pytest.mark.asyncio
    async def test_token_service_caching(self, token_service):
        """Test token service uses caching"""
        with patch('services.redis_service.RedisService.get') as mock_redis_get, \
             patch('services.redis_service.RedisService.set') as mock_redis_set:
            
            mock_redis_get.return_value = None  # Cache miss
            mock_redis_set.return_value = True
            
            with patch('services.bitquery_service.BitqueryService.get_trending_tokens') as mock_bitquery:
                mock_bitquery.return_value = [{"name": "Test Token"}]
                
                tokens = await token_service.get_trending_tokens()
                
                # Should check cache first
                mock_redis_get.assert_called_once()
                # Should set cache after fetching
                mock_redis_set.assert_called_once()

class TestPortfolioSimulator:
    """Test portfolio simulator functionality"""
    
    @pytest.fixture
    def portfolio_simulator(self):
        return PortfolioSimulator()
    
    @pytest.mark.asyncio
    async def test_simulate_trade(self, portfolio_simulator):
        """Test portfolio simulator executes trades"""
        with patch('services.redis_service.RedisService.get') as mock_redis_get, \
             patch('services.redis_service.RedisService.set') as mock_redis_set:
            
            mock_redis_get.return_value = json.dumps({
                "balance": 100.0,
                "tokens": {}
            })
            mock_redis_set.return_value = True
            
            result = await portfolio_simulator.simulate_trade("user123", "BUY", "BASE", 10.0, 1.0)
            
            assert result["success"] is True
            assert result["new_balance"] < 100.0  # Balance decreased
            mock_redis_set.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_analyze_portfolio(self, portfolio_simulator):
        """Test portfolio simulator analyzes portfolio"""
        with patch('services.redis_service.RedisService.get') as mock_redis_get:
            mock_redis_get.return_value = json.dumps({
                "balance": 50.0,
                "tokens": {"BASE": {"amount": 50.0, "value": 50.0}}
            })
            
            analysis = await portfolio_simulator.analyze_portfolio("user123")
            
            assert "risk_score" in analysis
            assert "diversification" in analysis
            assert analysis["total_value"] == 100.0
    
    @pytest.mark.asyncio
    async def test_insufficient_funds(self, portfolio_simulator):
        """Test portfolio simulator handles insufficient funds"""
        with patch('services.redis_service.RedisService.get') as mock_redis_get:
            mock_redis_get.return_value = json.dumps({
                "balance": 5.0,
                "tokens": {}
            })
            
            result = await portfolio_simulator.simulate_trade("user123", "BUY", "BASE", 10.0, 1.0)
            
            assert result["success"] is False
            assert "insufficient" in result["error"].lower()

class TestSessionService:
    """Test session service functionality"""
    
    @pytest.fixture
    def mock_redis_service(self):
        """Create mock Redis service"""
        mock_redis = MagicMock()
        mock_redis.redis_client = MagicMock()
        mock_redis.redis_client.ping = AsyncMock(return_value=True)
        mock_redis.setex = AsyncMock(return_value=True)
        mock_redis.get = AsyncMock(return_value=None)
        mock_redis.delete = AsyncMock(return_value=1)
        return mock_redis
    
    @pytest.fixture
    def session_service(self, mock_redis_service):
        return SessionService(mock_redis_service)
    
    @pytest.mark.asyncio
    async def test_create_session(self, session_service, mock_redis_service):
        """Test session service creates sessions"""
        session_id = await session_service.create_session("user123")
        
        assert session_id is not None
        assert len(session_id) > 0
        mock_redis_service.setex.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_validate_session(self, session_service, mock_redis_service):
        """Test session service validates sessions"""
        mock_redis_service.get.return_value = {
            "user_id": "user123",
            "created_at": "2024-01-01T00:00:00Z",
            "last_activity": "2024-01-01T00:00:00Z"
        }
        
        session_data = await session_service.validate_session("session123")
        
        assert session_data is not None
        assert session_data["user_id"] == "user123"
        mock_redis_service.get.assert_called_once_with("session:session123")
    
    @pytest.mark.asyncio
    async def test_end_session(self, session_service, mock_redis_service):
        """Test session service ends sessions"""
        result = await session_service.end_session("session123")
        
        assert result is True
        mock_redis_service.delete.assert_called_once_with("session:session123")
    
    @pytest.mark.asyncio
    async def test_validate_invalid_session(self, session_service, mock_redis_service):
        """Test session service handles invalid sessions"""
        mock_redis_service.get.return_value = None  # Session not found
        
        session_data = await session_service.validate_session("invalid_session")
        
        assert session_data is None
        mock_redis_service.get.assert_called_once_with("session:invalid_session")
    
    @pytest.mark.asyncio
    async def test_session_creation_with_redis_verification(self, session_service, mock_redis_service):
        """Test session creation and immediate Redis verification"""
        mock_redis_service.get.return_value = {
            "user_id": "test_user",
            "created_at": "2024-01-01T00:00:00Z",
            "last_activity": "2024-01-01T00:00:00Z"
        }
        
        # Create session
        session_token = await session_service.create_session("test_user")
        assert session_token is not None
        
        # Verify session exists in Redis
        session_data = await session_service.validate_session(session_token)
        assert session_data is not None
        assert session_data["user_id"] == "test_user"
        
        # Verify Redis operations were called (setex called twice: once for create, once for validate)
        assert mock_redis_service.setex.call_count == 2
        mock_redis_service.get.assert_called_once()

class TestRedisService:
    """Test Redis service functionality"""
    
    @pytest.fixture
    def redis_service(self):
        return RedisService()
    
    @pytest.mark.asyncio
    async def test_redis_connection(self, redis_service):
        """Test Redis service connects properly"""
        with patch('redis.asyncio.Redis') as mock_redis:
            mock_client = MagicMock()
            mock_redis.return_value = mock_client
            mock_client.ping.return_value = True
            
            result = await redis_service.ping()
            
            assert result is True
            mock_client.ping.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_redis_set_get(self, redis_service):
        """Test Redis service set and get operations"""
        with patch('redis.asyncio.Redis') as mock_redis:
            mock_client = MagicMock()
            mock_redis.return_value = mock_client
            mock_client.set.return_value = True
            mock_client.get.return_value = b"test_value"
            
            await redis_service.set("test_key", "test_value", 3600)
            value = await redis_service.get("test_key")
            
            assert value == "test_value"
            mock_client.set.assert_called_once()
            mock_client.get.assert_called_once()

class TestBitqueryService:
    """Test Bitquery service functionality"""
    
    @pytest.fixture
    def bitquery_service(self):
        return BitqueryService()
    
    @pytest.mark.asyncio
    async def test_get_trending_tokens(self, bitquery_service):
        """Test Bitquery service fetches trending tokens"""
        with patch('aiohttp.ClientSession.post') as mock_post:
            mock_response = MagicMock()
            mock_response.json.return_value = {
                "data": {
                    "ethereum": {
                        "dexTrades": [
                            {
                                "baseCurrency": {"symbol": "BASE", "name": "Base Token"},
                                "tradeAmount": 1000000
                            }
                        ]
                    }
                }
            }
            mock_response.status = 200
            mock_post.return_value.__aenter__.return_value = mock_response
            
            tokens = await bitquery_service.get_trending_tokens()
            
            assert len(tokens) > 0
            assert "BASE" in tokens[0]["symbol"]

class TestTavilyService:
    """Test Tavily service functionality"""
    
    @pytest.fixture
    def tavily_service(self):
        return TavilyService()
    
    @pytest.mark.asyncio
    async def test_search(self, tavily_service):
        """Test Tavily service performs web search"""
        with patch('aiohttp.ClientSession.post') as mock_post:
            mock_response = MagicMock()
            mock_response.json.return_value = {
                "results": [
                    {"title": "Crypto News", "content": "Bitcoin hits new high"}
                ]
            }
            mock_response.status = 200
            mock_post.return_value.__aenter__.return_value = mock_response
            
            results = await tavily_service.search("crypto news")
            
            assert len(results["results"]) > 0
            assert "Crypto News" in results["results"][0]["title"]

class TestWebSocketService:
    """Test WebSocket service functionality"""
    
    @pytest.fixture
    def websocket_service(self):
        return WebSocketService()
    
    @pytest.mark.asyncio
    async def test_websocket_connection(self, websocket_service):
        """Test WebSocket service manages connections"""
        with patch('fastapi.WebSocket') as mock_websocket:
            mock_websocket.accept.return_value = None
            mock_websocket.receive.return_value = {"type": "websocket.receive", "text": "test"}
            mock_websocket.send.return_value = None
            
            await websocket_service.handle_connection(mock_websocket, "user123")
            
            mock_websocket.accept.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_websocket_message_handling(self, websocket_service):
        """Test WebSocket service handles messages"""
        with patch('services.websocket_service.WebSocketService.process_message') as mock_process:
            mock_process.return_value = "Response"
            
            result = await websocket_service.handle_message("test message", "user123")
            
            assert result == "Response"
            mock_process.assert_called_once_with("test message", "user123")

class TestServiceIntegration:
    """Test service integration"""
    
    @pytest.mark.asyncio
    async def test_services_work_together(self):
        """Test services integrate properly"""
        with patch('services.session_service.SessionService.create_session') as mock_session, \
             patch('services.openai_service.OpenAIService.generate_response') as mock_openai, \
             patch('services.redis_service.RedisService.set') as mock_redis:
            
            mock_session.return_value = "session123"
            mock_openai.return_value = "AI response"
            mock_redis.return_value = True
            
            # Simulate a complete flow
            session_service = SessionService()
            openai_service = OpenAIService()
            
            session_id = await session_service.create_session("user123")
            response = await openai_service.generate_response("Test prompt")
            
            assert session_id == "session123"
            assert response == "AI response"
    
    @pytest.mark.asyncio
    async def test_error_propagation(self):
        """Test errors propagate correctly through services"""
        with patch('services.openai_service.OpenAIService.generate_response') as mock_openai:
            mock_openai.side_effect = Exception("Service error")
            
            openai_service = OpenAIService()
            
            with pytest.raises(Exception):
                await openai_service.generate_response("Test prompt")
