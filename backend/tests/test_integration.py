"""
Integration tests for EALI5 backend services
Tests the complete flow from API endpoints to AI responses
"""

import pytest
import asyncio
from unittest.mock import AsyncMock, patch
import json

# Import services
from services.educational_content_service import EducationalContentService
from services.progress_tracking_service import ProgressTrackingService
from services.portfolio_simulator import PortfolioSimulator
from services.redis_service import RedisService
from services.token_service import TokenService
from agents.educator_agent import EducatorAgent
from agents.portfolio_agent import PortfolioAgent
from agents.langgraph_orchestrator import LangGraphOrchestrator

@pytest.fixture
def educational_content_service():
    return EducationalContentService()

@pytest.fixture
def progress_tracking_service():
    return ProgressTrackingService()

@pytest.fixture
def portfolio_simulator():
    return PortfolioSimulator()

@pytest.fixture
def educator_agent():
    return EducatorAgent()

@pytest.fixture
def portfolio_agent():
    return PortfolioAgent()

@pytest.fixture
def langgraph_orchestrator():
    return LangGraphOrchestrator()

class TestEducationalContentIntegration:
    """Test educational content system integration"""
    
    @pytest.mark.asyncio
    async def test_content_loading(self, educational_content_service):
        """Test that educational content loads properly"""
        await educational_content_service.initialize()
        
        # Test content by category
        basics_content = await educational_content_service.get_content_by_category("basics")
        assert len(basics_content) > 0
        assert basics_content[0]["category"] == "basics"
        
        # Test content by ID
        content = await educational_content_service.get_content_by_id("crypto-001")
        assert content is not None
        assert content["title"] == "What is Cryptocurrency?"
        
        # Test learning paths
        paths = await educational_content_service.get_learning_paths()
        assert "beginner" in paths
        assert "intermediate" in paths
        assert "advanced" in paths
    
    @pytest.mark.asyncio
    async def test_user_progress_tracking(self, educational_content_service, progress_tracking_service):
        """Test user progress tracking integration"""
        await educational_content_service.initialize()
        await progress_tracking_service.initialize()
        
        user_id = "test_user_123"
        
        # Get initial progress
        progress = await progress_tracking_service.get_user_progress(user_id)
        assert progress["learning_level"] == 0
        assert len(progress["completed_lessons"]) == 0
        
        # Complete a lesson
        success = await progress_tracking_service.update_lesson_completion(
            user_id, "crypto-001", "basics", 300
        )
        assert success
        
        # Check updated progress
        updated_progress = await progress_tracking_service.get_user_progress(user_id)
        assert updated_progress["learning_level"] > 0
        assert "crypto-001" in updated_progress["completed_lessons"]
    
    @pytest.mark.asyncio
    async def test_achievement_system(self, progress_tracking_service):
        """Test achievement system"""
        await progress_tracking_service.initialize()
        
        user_id = "test_user_456"
        
        # Complete first lesson
        await progress_tracking_service.update_lesson_completion(
            user_id, "crypto-001", "basics", 300
        )
        
        # Check achievements
        achievements = await progress_tracking_service.get_achievements(user_id)
        assert len(achievements) > 0
        assert any(achievement["id"] == "first_lesson" for achievement in achievements)
    
    @pytest.mark.asyncio
    async def test_learning_recommendations(self, educational_content_service, progress_tracking_service):
        """Test learning recommendations"""
        await educational_content_service.initialize()
        await progress_tracking_service.initialize()
        
        user_id = "test_user_789"
        
        # Get recommendations for new user
        recommendations = await progress_tracking_service.get_recommendations(user_id)
        assert len(recommendations) > 0
        assert any(rec["type"] == "category" for rec in recommendations)

class TestPortfolioSimulationIntegration:
    """Test portfolio simulation integration"""
    
    @pytest.mark.asyncio
    async def test_portfolio_creation(self, portfolio_simulator):
        """Test portfolio creation and management"""
        # Mock dependencies
        mock_redis = AsyncMock()
        mock_token_service = AsyncMock()
        
        await portfolio_simulator.initialize(mock_redis, mock_token_service)
        
        user_id = "test_user_portfolio"
        
        # Get portfolio
        portfolio = await portfolio_simulator.get_portfolio(user_id)
        assert portfolio["user_id"] == user_id
        assert portfolio["initial_balance"] == 100.0
        assert portfolio["cash_balance"] == 100.0
    
    @pytest.mark.asyncio
    async def test_trade_simulation(self, portfolio_simulator):
        """Test trade simulation"""
        # Mock dependencies
        mock_redis = AsyncMock()
        mock_token_service = AsyncMock()
        mock_token_service.get_token_price.return_value = 100.0
        
        await portfolio_simulator.initialize(mock_redis, mock_token_service)
        
        user_id = "test_user_trade"
        
        # Simulate a buy trade
        trade_data = {
            "user_id": user_id,
            "token_address": "0x123456789",
            "trade_type": "buy",
            "amount": 10.0
        }
        
        result = await portfolio_simulator.simulate_trade(trade_data)
        assert result["status"] == "success"
        assert "trade_result" in result
        assert "updated_portfolio" in result

class TestAIAgentIntegration:
    """Test AI agent integration"""
    
    @pytest.mark.asyncio
    async def test_educator_agent_personality(self, educator_agent):
        """Test educator agent maintains Eali5 personality"""
        message = "I just bought a token that immediately dropped 50%. What happened?"
        user_id = "test_user_ai"
        learning_level = 20
        
        response = await educator_agent.process(message, user_id, learning_level)
        
        # Check for Eali5 personality traits
        assert "Real talk" in response or "Here's the truth" in response
        assert "wasn't ideal" in response or "not great" in response
        assert "learn from it" in response or "what you can do differently" in response
    
    @pytest.mark.asyncio
    async def test_portfolio_agent_honest_feedback(self, portfolio_agent):
        """Test portfolio agent provides honest feedback"""
        message = "I just made a trade that lost 30% of my virtual capital. Was it a good trade?"
        user_id = "test_user_portfolio_ai"
        learning_level = 40
        context = {"trade_result": {"pnl_percentage": -30}}
        
        response = await portfolio_agent.process(message, user_id, learning_level, context)
        
        # Check for honest feedback
        assert "Real talk" in response or "Here's the truth" in response
        assert "wasn't ideal" in response or "not great" in response
        assert "lost money" in response or "lost capital" in response
        assert "Great trade!" not in response
    
    @pytest.mark.asyncio
    async def test_langgraph_orchestrator_initialization(self, langgraph_orchestrator):
        """Test LangGraph orchestrator initialization"""
        # Mock agents and tools
        agents = {
            "coordinator": AsyncMock(),
            "educator": AsyncMock(),
            "research": AsyncMock(),
            "portfolio": AsyncMock(),
            "trading_strategy": AsyncMock(),
            "web_search": AsyncMock(),
            "openai": AsyncMock()
        }
        tools = {
            "bitquery": AsyncMock(),
            "tavily": AsyncMock(),
            "token": AsyncMock(),
            "portfolio": AsyncMock()
        }
        
        await langgraph_orchestrator.initialize(agents, tools)
        
        # Test message processing
        result = await langgraph_orchestrator.process_message(
            message="What is cryptocurrency?",
            user_id="test_user_orchestrator",
            learning_level=10
        )
        
        assert "message" in result
        assert "suggestions" in result
        assert "learning_level" in result

class TestEndToEndFlow:
    """Test complete end-to-end user flow"""
    
    @pytest.mark.asyncio
    async def test_new_user_onboarding_flow(self):
        """Test complete new user onboarding flow"""
        # Initialize services
        educational_service = EducationalContentService()
        progress_service = ProgressTrackingService()
        educator_agent = EducatorAgent()
        
        await educational_service.initialize()
        await progress_service.initialize()
        
        user_id = "new_user_onboarding"
        
        # 1. New user asks basic question
        response = await educator_agent.process(
            "What is cryptocurrency?",
            user_id,
            0
        )
        
        assert "cryptocurrency" in response.lower()
        assert "digital money" in response.lower()
        
        # 2. User completes first lesson
        success = await progress_service.update_lesson_completion(
            user_id, "crypto-001", "basics", 300
        )
        assert success
        
        # 3. Check user progress
        progress = await progress_service.get_user_progress(user_id)
        assert progress["learning_level"] > 0
        assert "crypto-001" in progress["completed_lessons"]
        
        # 4. Get recommendations
        recommendations = await progress_service.get_recommendations(user_id)
        assert len(recommendations) > 0
    
    @pytest.mark.asyncio
    async def test_trading_simulation_flow(self):
        """Test complete trading simulation flow"""
        # Initialize services
        portfolio_simulator = PortfolioSimulator()
        portfolio_agent = PortfolioAgent()
        
        # Mock dependencies
        mock_redis = AsyncMock()
        mock_token_service = AsyncMock()
        mock_token_service.get_token_price.return_value = 100.0
        
        await portfolio_simulator.initialize(mock_redis, mock_token_service)
        
        user_id = "trading_user"
        
        # 1. Get initial portfolio
        portfolio = await portfolio_simulator.get_portfolio(user_id)
        assert portfolio["cash_balance"] == 100.0
        
        # 2. Simulate a trade
        trade_data = {
            "user_id": user_id,
            "token_address": "0x123456789",
            "trade_type": "buy",
            "amount": 20.0
        }
        
        result = await portfolio_simulator.simulate_trade(trade_data)
        assert result["status"] == "success"
        
        # 3. Get honest feedback from AI
        feedback = await portfolio_agent.process(
            "I just bought $20 worth of tokens. How did I do?",
            user_id,
            30,
            {"trade_result": result["trade_result"]}
        )
        
        # Should provide educational feedback
        assert len(feedback) > 0
        assert "educational" in feedback.lower() or "learn" in feedback.lower()

if __name__ == "__main__":
    pytest.main([__file__])
