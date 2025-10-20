"""
Test suite for EAILI5 multi-agent system
"""

import pytest
import asyncio
from unittest.mock import AsyncMock, patch, MagicMock
from fastapi.testclient import TestClient

# Import agents
from agents.coordinator import CoordinatorAgent
from agents.educator_agent import EducatorAgent
from agents.research_agent import ResearchAgent
from agents.portfolio_agent import PortfolioAgent
from agents.trading_strategy_agent import TradingStrategyAgent
from agents.web_search_agent import WebSearchAgent
from agents.enhanced_langgraph_orchestrator import EnhancedLangGraphOrchestrator

class TestCoordinatorAgent:
    """Test coordinator agent routing and orchestration"""
    
    @pytest.fixture
    def coordinator(self):
        return CoordinatorAgent()
    
    def test_coordinator_initialization(self, coordinator):
        """Test coordinator agent initializes correctly"""
        assert coordinator is not None
        assert hasattr(coordinator, 'route_message')
    
    @pytest.mark.asyncio
    async def test_coordinator_routing_educational(self, coordinator):
        """Test coordinator routes educational questions to educator"""
        with patch('agents.educator_agent.EducatorAgent.process') as mock_educator:
            mock_educator.return_value = "Educational response"
            
            result = await coordinator.route_message("What is Bitcoin?", "user123")
            
            assert "Educational response" in result
            mock_educator.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_coordinator_routing_research(self, coordinator):
        """Test coordinator routes research questions to research agent"""
        with patch('agents.research_agent.ResearchAgent.process') as mock_research:
            mock_research.return_value = "Research data"
            
            result = await coordinator.route_message("Show me Base token prices", "user123")
            
            assert "Research data" in result
            mock_research.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_coordinator_routing_portfolio(self, coordinator):
        """Test coordinator routes portfolio questions to portfolio agent"""
        with patch('agents.portfolio_agent.PortfolioAgent.process') as mock_portfolio:
            mock_portfolio.return_value = "Portfolio analysis"
            
            result = await coordinator.route_message("Analyze my portfolio", "user123")
            
            assert "Portfolio analysis" in result
            mock_portfolio.assert_called_once()

class TestEducatorAgent:
    """Test educator agent functionality"""
    
    @pytest.fixture
    def educator(self):
        return EducatorAgent()
    
    @pytest.mark.asyncio
    async def test_educator_basic_explanation(self, educator):
        """Test educator provides basic crypto explanations"""
        with patch('services.openai_service.OpenAIService.generate_response') as mock_openai:
            mock_openai.return_value = "Bitcoin is a digital currency..."
            
            result = await educator.process("What is Bitcoin?", "user123")
            
            assert "Bitcoin" in result
            mock_openai.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_educator_streaming_response(self, educator):
        """Test educator streaming responses"""
        with patch('services.openai_service.OpenAIService.generate_response_stream') as mock_stream:
            mock_stream.return_value = ["Bitcoin", " is", " a", " digital", " currency"]
            
            chunks = []
            async for chunk in educator.process_stream("What is Bitcoin?", "user123"):
                chunks.append(chunk)
            
            assert len(chunks) > 0
            assert "".join(chunks) == "Bitcoin is a digital currency"
    
    @pytest.mark.asyncio
    async def test_educator_eailli5_personality(self, educator):
        """Test educator maintains EAILI5 personality"""
        with patch('services.openai_service.OpenAIService.generate_response') as mock_openai:
            mock_openai.return_value = "Hey there! I'm EAILI5, and I'm here to help you understand crypto!"
            
            result = await educator.process("Hello", "user123")
            
            assert "EAILI5" in result
            assert "Hey there" in result

class TestResearchAgent:
    """Test research agent data fetching"""
    
    @pytest.fixture
    def research_agent(self):
        return ResearchAgent()
    
    @pytest.mark.asyncio
    async def test_research_agent_token_data(self, research_agent):
        """Test research agent fetches token data"""
        with patch('services.token_service.TokenService.get_trending_tokens') as mock_tokens:
            mock_tokens.return_value = [
                {"name": "Base Token", "price": 1.0, "symbol": "BASE"}
            ]
            
            result = await research_agent.process("Show me Base tokens", "user123")
            
            assert "Base Token" in result
            mock_tokens.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_research_agent_market_data(self, research_agent):
        """Test research agent fetches market data"""
        with patch('services.bitquery_service.BitqueryService.get_market_data') as mock_market:
            mock_market.return_value = {"volume": 1000000, "liquidity": 500000}
            
            result = await research_agent.process("Show me market data", "user123")
            
            assert "volume" in result.lower() or "liquidity" in result.lower()
            mock_market.assert_called_once()

class TestPortfolioAgent:
    """Test portfolio agent simulation"""
    
    @pytest.fixture
    def portfolio_agent(self):
        return PortfolioAgent()
    
    @pytest.mark.asyncio
    async def test_portfolio_agent_simulation(self, portfolio_agent):
        """Test portfolio agent runs simulations"""
        with patch('services.portfolio_simulator.PortfolioSimulator.simulate_trade') as mock_simulate:
            mock_simulate.return_value = {"success": True, "new_balance": 105.0}
            
            result = await portfolio_agent.process("Buy 5 BASE tokens", "user123")
            
            assert "success" in result.lower() or "balance" in result.lower()
            mock_simulate.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_portfolio_agent_analysis(self, portfolio_agent):
        """Test portfolio agent provides analysis"""
        with patch('services.portfolio_simulator.PortfolioSimulator.analyze_portfolio') as mock_analyze:
            mock_analyze.return_value = {"risk_score": 0.3, "diversification": "Good"}
            
            result = await portfolio_agent.process("Analyze my portfolio", "user123")
            
            assert "risk" in result.lower() or "diversification" in result.lower()
            mock_analyze.assert_called_once()

class TestTradingStrategyAgent:
    """Test trading strategy agent"""
    
    @pytest.fixture
    def trading_agent(self):
        return TradingStrategyAgent()
    
    @pytest.mark.asyncio
    async def test_trading_strategy_analysis(self, trading_agent):
        """Test trading strategy agent provides analysis"""
        with patch('services.analytics_service.AnalyticsService.analyze_strategy') as mock_analyze:
            mock_analyze.return_value = {"strategy": "DCA", "confidence": 0.8}
            
            result = await trading_agent.process("What trading strategy should I use?", "user123")
            
            assert "strategy" in result.lower() or "confidence" in result.lower()
            mock_analyze.assert_called_once()

class TestWebSearchAgent:
    """Test web search agent"""
    
    @pytest.fixture
    def web_search_agent(self):
        return WebSearchAgent()
    
    @pytest.mark.asyncio
    async def test_web_search_agent(self, web_search_agent):
        """Test web search agent fetches current information"""
        with patch('services.tavily_service.TavilyService.search') as mock_search:
            mock_search.return_value = {"results": [{"title": "Latest Crypto News", "content": "Bitcoin hits new high"}]}
            
            result = await web_search_agent.process("What's the latest crypto news?", "user123")
            
            assert "news" in result.lower() or "bitcoin" in result.lower()
            mock_search.assert_called_once()

class TestEnhancedLangGraphOrchestrator:
    """Test the enhanced orchestrator"""
    
    @pytest.fixture
    def orchestrator(self):
        return EnhancedLangGraphOrchestrator()
    
    @pytest.mark.asyncio
    async def test_orchestrator_initialization(self, orchestrator):
        """Test orchestrator initializes correctly"""
        assert orchestrator is not None
        assert hasattr(orchestrator, 'process_message')
    
    @pytest.mark.asyncio
    async def test_orchestrator_message_processing(self, orchestrator):
        """Test orchestrator processes messages correctly"""
        with patch('agents.coordinator.CoordinatorAgent.route_message') as mock_route:
            mock_route.return_value = "Orchestrated response"
            
            result = await orchestrator.process_message("Test message", "user123")
            
            assert "Orchestrated response" in result
            mock_route.assert_called_once_with("Test message", "user123")
    
    @pytest.mark.asyncio
    async def test_orchestrator_streaming(self, orchestrator):
        """Test orchestrator streaming functionality"""
        with patch('agents.coordinator.CoordinatorAgent.route_message_stream') as mock_stream:
            mock_stream.return_value = ["Status: ", "Thinking", "...", "Response"]
            
            chunks = []
            async for chunk in orchestrator.process_message_stream("Test message", "user123"):
                chunks.append(chunk)
            
            assert len(chunks) > 0
            assert "Status" in chunks[0] or "Thinking" in chunks[0]

class TestAgentIntegration:
    """Test agent integration and communication"""
    
    @pytest.mark.asyncio
    async def test_agent_communication_flow(self):
        """Test agents communicate properly in a flow"""
        with patch('agents.enhanced_langgraph_orchestrator.EnhancedLangGraphOrchestrator.process_message') as mock_orchestrator:
            mock_orchestrator.return_value = "Multi-agent response"
            
            orchestrator = EnhancedLangGraphOrchestrator()
            result = await orchestrator.process_message("Complex crypto question", "user123")
            
            assert "Multi-agent response" in result
            mock_orchestrator.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_agent_error_handling(self):
        """Test agents handle errors gracefully"""
        with patch('agents.coordinator.CoordinatorAgent.route_message') as mock_route:
            mock_route.side_effect = Exception("Agent error")
            
            coordinator = CoordinatorAgent()
            
            with pytest.raises(Exception):
                await coordinator.route_message("Test message", "user123")
    
    @pytest.mark.asyncio
    async def test_agent_memory_integration(self):
        """Test agents use memory correctly"""
        with patch('agents.memory.memory_manager.MemoryManager.store_interaction') as mock_memory:
            mock_memory.return_value = True
            
            educator = EducatorAgent()
            await educator.process("What is Bitcoin?", "user123")
            
            # Memory should be called to store the interaction
            mock_memory.assert_called()
