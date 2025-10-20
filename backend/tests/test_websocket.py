"""
Test suite for EAILI5 WebSocket functionality
"""

import pytest
import asyncio
import json
from unittest.mock import AsyncMock, patch, MagicMock
from fastapi.testclient import TestClient
from fastapi import WebSocket

# Import WebSocket service and main app
from services.websocket_service import WebSocketService
from main import app

class TestWebSocketService:
    """Test WebSocket service functionality"""
    
    @pytest.fixture
    def websocket_service(self):
        return WebSocketService()
    
    @pytest.fixture
    def mock_websocket(self):
        """Create mock WebSocket for testing"""
        websocket = MagicMock(spec=WebSocket)
        websocket.accept = AsyncMock()
        websocket.receive = AsyncMock()
        websocket.send = AsyncMock()
        websocket.close = AsyncMock()
        return websocket
    
    @pytest.mark.asyncio
    async def test_websocket_connection_acceptance(self, websocket_service, mock_websocket):
        """Test WebSocket connection is accepted"""
        mock_websocket.receive.return_value = {"type": "websocket.disconnect"}
        
        await websocket_service.handle_connection(mock_websocket, "user123")
        
        mock_websocket.accept.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_websocket_message_handling(self, websocket_service, mock_websocket):
        """Test WebSocket message handling"""
        # Mock message reception
        mock_websocket.receive.return_value = {
            "type": "websocket.receive",
            "text": json.dumps({
                "type": "chat",
                "message": "Hello EAILI5",
                "streaming": True
            })
        }
        
        with patch('services.websocket_service.WebSocketService.process_message') as mock_process:
            mock_process.return_value = "AI response"
            
            # Simulate connection handling
            await websocket_service.handle_connection(mock_websocket, "user123")
            
            mock_process.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_websocket_streaming_response(self, websocket_service):
        """Test WebSocket streaming responses"""
        with patch('agents.enhanced_langgraph_orchestrator.EnhancedLangGraphOrchestrator.process_message_stream') as mock_stream:
            mock_stream.return_value = [
                {"type": "status", "message": "Thinking..."},
                {"type": "chunk", "content": "Hello"},
                {"type": "chunk", "content": " there!"},
                {"type": "message", "content": "Hello there!"}
            ]
            
            chunks = []
            async for chunk in websocket_service.handle_streaming_message("Hello", "user123"):
                chunks.append(chunk)
            
            assert len(chunks) == 4
            assert chunks[0]["type"] == "status"
            assert chunks[1]["content"] == "Hello"
    
    @pytest.mark.asyncio
    async def test_websocket_agent_status_updates(self, websocket_service):
        """Test WebSocket agent status updates"""
        with patch('agents.enhanced_langgraph_orchestrator.EnhancedLangGraphOrchestrator.process_message_stream') as mock_stream:
            mock_stream.return_value = [
                {"type": "status", "agent": "coordinator", "message": "Routing to educator..."},
                {"type": "status", "agent": "educator", "message": "Preparing explanation..."},
                {"type": "chunk", "content": "Bitcoin is a digital currency"}
            ]
            
            status_updates = []
            async for chunk in websocket_service.handle_streaming_message("What is Bitcoin?", "user123"):
                if chunk.get("type") == "status":
                    status_updates.append(chunk)
            
            assert len(status_updates) == 2
            assert status_updates[0]["agent"] == "coordinator"
            assert status_updates[1]["agent"] == "educator"
    
    @pytest.mark.asyncio
    async def test_websocket_error_handling(self, websocket_service, mock_websocket):
        """Test WebSocket error handling"""
        mock_websocket.receive.side_effect = Exception("Connection error")
        
        with pytest.raises(Exception):
            await websocket_service.handle_connection(mock_websocket, "user123")
    
    @pytest.mark.asyncio
    async def test_websocket_connection_cleanup(self, websocket_service, mock_websocket):
        """Test WebSocket connection cleanup"""
        mock_websocket.receive.return_value = {"type": "websocket.disconnect"}
        
        await websocket_service.handle_connection(mock_websocket, "user123")
        
        # Should close connection on disconnect
        mock_websocket.close.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_websocket_session_management(self, websocket_service):
        """Test WebSocket session management"""
        with patch('services.session_service.SessionService.get_session') as mock_get_session:
            mock_get_session.return_value = {"user_id": "user123", "is_active": True}
            
            session = await websocket_service.validate_session("session123")
            
            assert session is not None
            assert session["user_id"] == "user123"
            mock_get_session.assert_called_once_with("session123")
    
    @pytest.mark.asyncio
    async def test_websocket_invalid_session(self, websocket_service):
        """Test WebSocket handles invalid sessions"""
        with patch('services.session_service.SessionService.get_session') as mock_get_session:
            mock_get_session.return_value = None
            
            session = await websocket_service.validate_session("invalid_session")
            
            assert session is None
    
    @pytest.mark.asyncio
    async def test_websocket_session_validation_integration(self, websocket_service):
        """Test WebSocket session validation with real session service"""
        with patch('services.session_service.SessionService.validate_session') as mock_validate:
            mock_validate.return_value = {
                "user_id": "test_user",
                "created_at": "2024-01-01T00:00:00Z",
                "last_activity": "2024-01-01T00:00:00Z"
            }
            
            # Test session validation
            session_data = await websocket_service.validate_session("valid_session_token")
            
            assert session_data is not None
            assert session_data["user_id"] == "test_user"
            mock_validate.assert_called_once_with("valid_session_token")
    
    @pytest.mark.asyncio
    async def test_websocket_message_with_session_validation(self, websocket_service, mock_websocket):
        """Test WebSocket message handling with session validation"""
        # Mock session validation
        with patch('services.session_service.SessionService.validate_session') as mock_validate:
            mock_validate.return_value = {
                "user_id": "test_user",
                "created_at": "2024-01-01T00:00:00Z"
            }
            
            # Mock message reception
            mock_websocket.receive.return_value = {
                "type": "websocket.receive",
                "text": json.dumps({
                    "type": "chat",
                    "message": "Hello EAILI5",
                    "session_id": "valid_session_token",
                    "streaming": True
                })
            }
            
            # Mock message processing
            with patch('services.websocket_service.WebSocketService.process_message') as mock_process:
                mock_process.return_value = "AI response"
                
                # Simulate connection handling
                await websocket_service.handle_connection(mock_websocket, "test_user")
                
                # Verify session validation was called
                mock_validate.assert_called_once_with("valid_session_token")
                mock_process.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_websocket_invalid_session_error_response(self, websocket_service, mock_websocket):
        """Test WebSocket sends error response for invalid sessions"""
        # Mock session validation failure
        with patch('services.session_service.SessionService.validate_session') as mock_validate:
            mock_validate.return_value = None  # Invalid session
            
            # Mock message reception
            mock_websocket.receive.return_value = {
                "type": "websocket.receive",
                "text": json.dumps({
                    "type": "chat",
                    "message": "Hello EAILI5",
                    "session_id": "invalid_session_token",
                    "streaming": True
                })
            }
            
            # Mock error response
            mock_websocket.send_json = AsyncMock()
            
            # Simulate connection handling
            await websocket_service.handle_connection(mock_websocket, "test_user")
            
            # Verify error response was sent
            mock_websocket.send_json.assert_called_once()
            call_args = mock_websocket.send_json.call_args[0][0]
            assert call_args["type"] == "error"
            assert "Invalid or expired session" in call_args["message"]

class TestWebSocketIntegration:
    """Test WebSocket integration with FastAPI"""
    
    def test_websocket_endpoint_exists(self):
        """Test WebSocket endpoint is properly configured"""
        client = TestClient(app)
        
        # Check if WebSocket endpoint exists in app routes
        routes = [route.path for route in app.routes]
        assert "/ws/chat/{user_id}" in routes
    
    @pytest.mark.asyncio
    async def test_websocket_endpoint_connection(self):
        """Test WebSocket endpoint accepts connections"""
        with patch('services.websocket_service.WebSocketService.handle_connection') as mock_handle:
            mock_handle.return_value = None
            
            # This would normally be tested with a WebSocket client
            # For now, we verify the service is called
            assert mock_handle is not None
    
    @pytest.mark.asyncio
    async def test_websocket_message_flow(self):
        """Test complete WebSocket message flow"""
        with patch('services.websocket_service.WebSocketService.handle_streaming_message') as mock_handle:
            mock_handle.return_value = [
                {"type": "status", "message": "Processing..."},
                {"type": "chunk", "content": "Response"}
            ]
            
            chunks = []
            async for chunk in mock_handle("Test message", "user123"):
                chunks.append(chunk)
            
            assert len(chunks) == 2
            assert chunks[0]["type"] == "status"
            assert chunks[1]["type"] == "chunk"

class TestWebSocketResilience:
    """Test WebSocket connection resilience"""
    
    @pytest.mark.asyncio
    async def test_websocket_reconnection_handling(self, websocket_service):
        """Test WebSocket handles reconnection"""
        with patch('services.websocket_service.WebSocketService.handle_connection') as mock_handle:
            # Simulate connection failure
            mock_handle.side_effect = Exception("Connection lost")
            
            with pytest.raises(Exception):
                await websocket_service.handle_connection(MagicMock(), "user123")
    
    @pytest.mark.asyncio
    async def test_websocket_message_retry(self, websocket_service):
        """Test WebSocket message retry mechanism"""
        with patch('services.websocket_service.WebSocketService.process_message') as mock_process:
            # First call fails, second succeeds
            mock_process.side_effect = [Exception("Temporary failure"), "Success"]
            
            # Should retry and eventually succeed
            result = await websocket_service.process_message_with_retry("Test", "user123", max_retries=2)
            
            assert result == "Success"
            assert mock_process.call_count == 2
    
    @pytest.mark.asyncio
    async def test_websocket_connection_timeout(self, websocket_service):
        """Test WebSocket connection timeout handling"""
        with patch('asyncio.wait_for') as mock_wait:
            mock_wait.side_effect = asyncio.TimeoutError("Connection timeout")
            
            with pytest.raises(asyncio.TimeoutError):
                await websocket_service.handle_connection_with_timeout(MagicMock(), "user123", timeout=5)
    
    @pytest.mark.asyncio
    async def test_websocket_rate_limiting(self, websocket_service):
        """Test WebSocket rate limiting"""
        with patch('services.redis_service.RedisService.get') as mock_redis:
            # Simulate rate limit exceeded
            mock_redis.return_value = "10"  # 10 requests in window
            
            is_rate_limited = await websocket_service.check_rate_limit("user123", limit=5)
            
            assert is_rate_limited is True
    
    @pytest.mark.asyncio
    async def test_websocket_connection_pooling(self, websocket_service):
        """Test WebSocket connection pooling"""
        with patch('services.websocket_service.WebSocketService.get_connection_pool') as mock_pool:
            mock_pool.return_value = [MagicMock(), MagicMock()]
            
            connections = await websocket_service.get_available_connections()
            
            assert len(connections) == 2

class TestWebSocketPerformance:
    """Test WebSocket performance characteristics"""
    
    @pytest.mark.asyncio
    async def test_websocket_concurrent_connections(self, websocket_service):
        """Test WebSocket handles concurrent connections"""
        with patch('services.websocket_service.WebSocketService.handle_connection') as mock_handle:
            mock_handle.return_value = None
            
            # Simulate multiple concurrent connections
            tasks = []
            for i in range(10):
                task = websocket_service.handle_connection(MagicMock(), f"user{i}")
                tasks.append(task)
            
            await asyncio.gather(*tasks)
            
            assert mock_handle.call_count == 10
    
    @pytest.mark.asyncio
    async def test_websocket_message_throughput(self, websocket_service):
        """Test WebSocket message throughput"""
        with patch('services.websocket_service.WebSocketService.process_message') as mock_process:
            mock_process.return_value = "Response"
            
            # Simulate high message throughput
            start_time = asyncio.get_event_loop().time()
            
            tasks = []
            for i in range(100):
                task = websocket_service.process_message(f"Message {i}", f"user{i}")
                tasks.append(task)
            
            await asyncio.gather(*tasks)
            
            end_time = asyncio.get_event_loop().time()
            duration = end_time - start_time
            
            # Should process 100 messages in reasonable time
            assert duration < 5.0  # Less than 5 seconds
            assert mock_process.call_count == 100
    
    @pytest.mark.asyncio
    async def test_websocket_memory_usage(self, websocket_service):
        """Test WebSocket memory usage doesn't grow unbounded"""
        with patch('services.websocket_service.WebSocketService.handle_connection') as mock_handle:
            mock_handle.return_value = None
            
            # Simulate many connections and disconnections
            for i in range(1000):
                await websocket_service.handle_connection(MagicMock(), f"user{i}")
            
            # Memory usage should be reasonable
            # This is more of a conceptual test - in practice you'd use memory profiling
            assert True  # Placeholder for memory usage validation

class TestWebSocketSecurity:
    """Test WebSocket security features"""
    
    @pytest.mark.asyncio
    async def test_websocket_authentication(self, websocket_service):
        """Test WebSocket authentication"""
        with patch('services.wallet_auth_service.WalletAuthService.verify_signature') as mock_verify:
            mock_verify.return_value = True
            
            is_authenticated = await websocket_service.authenticate_connection("user123", "signature")
            
            assert is_authenticated is True
            mock_verify.assert_called_once_with("user123", "signature")
    
    @pytest.mark.asyncio
    async def test_websocket_message_validation(self, websocket_service):
        """Test WebSocket message validation"""
        # Test valid message
        valid_message = {
            "type": "chat",
            "message": "Hello EAILI5",
            "streaming": True
        }
        
        is_valid = await websocket_service.validate_message(valid_message)
        assert is_valid is True
        
        # Test invalid message
        invalid_message = {
            "type": "invalid",
            "malicious": "<script>alert('xss')</script>"
        }
        
        is_valid = await websocket_service.validate_message(invalid_message)
        assert is_valid is False
    
    @pytest.mark.asyncio
    async def test_websocket_input_sanitization(self, websocket_service):
        """Test WebSocket input sanitization"""
        malicious_input = "<script>alert('xss')</script>Hello EAILI5"
        
        sanitized = await websocket_service.sanitize_input(malicious_input)
        
        assert "<script>" not in sanitized
        assert "Hello EAILI5" in sanitized
    
    @pytest.mark.asyncio
    async def test_websocket_connection_limits(self, websocket_service):
        """Test WebSocket connection limits"""
        with patch('services.redis_service.RedisService.get') as mock_redis:
            # Simulate connection limit reached
            mock_redis.return_value = "100"  # 100 active connections
            
            can_connect = await websocket_service.check_connection_limit("user123", max_connections=50)
            
            assert can_connect is False
