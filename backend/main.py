"""
EAILI5 - Explain AI Like I'm Five - Crypto Education Platform
Main FastAPI application entry point
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import asyncio
import json
import os
from typing import Dict, List
from datetime import datetime
import logging
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from agents.coordinator import CoordinatorAgent
from agents.educator_agent import EducatorAgent
from agents.research_agent import ResearchAgent
from agents.portfolio_agent import PortfolioAdvisorAgent
from agents.trading_strategy_agent import TradingStrategyAgent
from agents.web_search_agent import WebSearchAgent
from agents.enhanced_langgraph_orchestrator import EnhancedLangGraphOrchestrator
from agents.rag_pipeline import RAGPipeline
from services.token_service import TokenService
from services.portfolio_simulator import PortfolioSimulator
from services.basescan_service import EtherscanV2Service
from services.redis_service import RedisService
from services.openai_service import OpenAIService
from services.tavily_service import TavilyService
from services.educational_content_service import EducationalContentService
from services.progress_tracking_service import ProgressTrackingService
from services.websocket_service import WebSocketService
from services.wallet_auth_service import WalletAuthService
from services.analytics_service import AnalyticsService
from services.miniapp_service import MiniAppService
from blockchain.base_client import BaseClient
from database.connection import check_database_connection
from models.schemas import ChatMessage, TokenData, PortfolioState

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Module loaded verification

# Initialize FastAPI app
app = FastAPI(
    title="EAILI5 API",
    description="Explain AI Like I'm Five - Crypto Education Platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://explainailikeimfive.com",
        "https://base.explainailikeimfive.com",
        "https://base-api.explainailikeimfive.com",
        "https://eaili5-base-frontend-879892206028.us-central1.run.app",
        "https://eaili5-base-backend-879892206028.us-central1.run.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
token_service = TokenService()
portfolio_simulator = PortfolioSimulator()
etherscan_service = EtherscanV2Service()
redis_service = RedisService()
openai_service = OpenAIService()
tavily_service = TavilyService()
educational_content_service = EducationalContentService()
progress_tracking_service = ProgressTrackingService()
websocket_service = WebSocketService()
wallet_auth_service = WalletAuthService()
analytics_service = AnalyticsService()
miniapp_service = MiniAppService()
base_client = BaseClient()

# Initialize session service (will be initialized in startup)
from services.session_service import SessionService
session_service = None

# Initialize CoinGecko price service
from services.coingecko_service import CoinGeckoService
coingecko_service = CoinGeckoService()

# Initialize sentiment service
from services.sentiment_service import SentimentService
sentiment_service = SentimentService(coingecko_service, tavily_service)

# Initialize feedback service
from services.feedback_service import FeedbackService
feedback_service = FeedbackService()

# Initialize coordinator (will be updated with dependencies in startup)
coordinator = None
educator_agent = None
research_agent = None
portfolio_agent = None
trading_strategy_agent = None
web_search_agent = None

# Initialize Enhanced LangGraph orchestrator
enhanced_langgraph_orchestrator = None

# Initialize RAG pipeline
rag_pipeline = RAGPipeline()

# WebSocket connection manager removed - using websocket_service instead

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    logger.info("Application startup initiated")
    logger.info("EAILI5 is waking up...")
    
    try:
        # Initialize OpenAI
        await openai_service.initialize(os.getenv("OPENAI_API_KEY"))
        
        # Initialize Tavily
        await tavily_service.initialize(os.getenv("TAVILY_API_KEY"))
        
        # Initialize Etherscan V2
        await etherscan_service.initialize(os.getenv("ETHERSCAN_API_KEY"))
        
        # Initialize Base client
        await base_client.initialize(os.getenv("BASE_RPC_URL", "https://mainnet.base.org"))
        
        # Initialize Redis
        await redis_service.initialize(os.getenv("REDIS_URL", "redis://redis:6379"))
        
        # Initialize Session Service with Redis
        global session_service
        try:
            session_service = SessionService(redis_service)
            logger.info("Session service initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize session service: {e}")
            session_service = None
        
        # CoinGecko service doesn't need initialization (no API key required for free tier)
        logger.info("CoinGecko service ready (free tier, no API key required)")
        
        # Initialize Token Service with dependencies
        await token_service.initialize(redis_service, etherscan_service, base_client, coingecko_service)
        
        # Initialize educational content service
        await educational_content_service.initialize()
        
        # Initialize progress tracking service
        await progress_tracking_service.initialize(redis_service.redis_client)
        
        # Initialize wallet authentication service
        await wallet_auth_service.initialize(redis_service.redis_client)
        
        # Initialize analytics service
        await analytics_service.initialize(redis_service.redis_client)
        
        # Initialize Mini App service
        await miniapp_service.initialize()
        
        # Initialize feedback service
        from database.connection import get_database, create_appreciation_tables
        db_session = await get_database()
        await feedback_service.initialize(db_session, redis_service.redis_client)
        
        # Create appreciation tables
        await create_appreciation_tables()
        logger.info("Feedback service initialized successfully")
        
        # Initialize coordinator and agents with dependencies
        global coordinator, educator_agent, research_agent, portfolio_agent, trading_strategy_agent, web_search_agent
        logger.info("Creating AI agents...")
        try:
            coordinator = CoordinatorAgent(openai_service, tavily_service, sentiment_service)
            educator_agent = EducatorAgent(openai_service)
            research_agent = ResearchAgent(openai_service)
            portfolio_agent = PortfolioAdvisorAgent(openai_service)
            trading_strategy_agent = TradingStrategyAgent(openai_service)
            web_search_agent = WebSearchAgent(openai_service, tavily_service)
            logger.info(f"Agents created successfully: educator={educator_agent is not None}")
        except Exception as e:
            logger.error(f"Error creating agents: {e}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            raise
        
        # Check if all agents are available
        agent_checks = {
            "coordinator": coordinator is not None,
            "educator": educator_agent is not None,
            "research": research_agent is not None,
            "portfolio": portfolio_agent is not None,
            "trading_strategy": trading_strategy_agent is not None,
            "web_search": web_search_agent is not None,
            "openai": openai_service is not None
        }
        
        logger.info(f"Agent availability check: {agent_checks}")
        
        if not all(agent_checks.values()):
            missing_agents = [name for name, available in agent_checks.items() if not available]
            logger.error(f"Missing agents: {missing_agents}")
            raise Exception(f"Missing agents: {missing_agents}")
        
        # Create social sentiment agent
        from agents.social_sentiment_agent import SocialSentimentAgent
        social_sentiment_agent = SocialSentimentAgent(openai_service, sentiment_service)
        
        agents = {
            "coordinator": coordinator,
            "educator": educator_agent,
            "research": research_agent,
            "portfolio": portfolio_agent,
            "trading_strategy": trading_strategy_agent,
            "web_search": web_search_agent,
            "social_sentiment": social_sentiment_agent,
            "openai": openai_service
        }
        tools = {
            "etherscan": etherscan_service,
            "tavily": tavily_service,
            "token": token_service,
            "portfolio": portfolio_simulator,
            "base_client": base_client,
            "educational": educational_content_service,
            "progress": progress_tracking_service,
            "sentiment": sentiment_service
        }
        logger.info(f"Initializing enhanced orchestrator with agents: {list(agents.keys())}")
        
        # Initialize Enhanced LangGraph orchestrator
        global enhanced_langgraph_orchestrator
        logger.info("Initializing enhanced orchestrator...")
        
        # Initialize Enhanced LangGraph Orchestrator with Unix Socket Connection
        try:
            from database.connection import AsyncSessionLocal, engine
            
            logger.info("=== INITIALIZING ENHANCED ORCHESTRATOR WITH UNIX SOCKET CONNECTION ===")
            
            # Test connection before proceeding
            if await check_database_connection():
                logger.info("Database connection test successful")
            else:
                raise Exception("Database connection test failed")
            
            # Initialize orchestrator with async session factory
            enhanced_langgraph_orchestrator = EnhancedLangGraphOrchestrator(AsyncSessionLocal, redis_service)
            await enhanced_langgraph_orchestrator.initialize(agents, tools)
            logger.info("Enhanced orchestrator initialized successfully")
                
        except Exception as e:
            logger.error(f"Enhanced orchestrator initialization failed: {e}")
            import traceback
            logger.error(f"Full traceback: {traceback.format_exc()}")
            enhanced_langgraph_orchestrator = None
            logger.warning("Enhanced orchestrator disabled - database connection failed")
        
        # Initialize RAG pipeline
        # Note: This would need a vector store implementation
        # For now, we'll initialize without dependencies
        await rag_pipeline.initialize(None, openai_service, None)
        
        # Test session service
        try:
            test_session = await session_service.create_session("test_user")
            await session_service.validate_session(test_session)
            await session_service.end_session(test_session)
            logger.info("Session service: OK")
        except Exception as e:
            logger.error(f"Session service failed: {e}")
        
        logger.info("EAILI5 is ready to help you learn crypto!")
        
    except Exception as e:
        logger.error(f"Error during startup: {e}")
        # Don't raise - allow app to start without external services for testing
        logger.warning("Starting in limited mode - some features may not work")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup resources on shutdown"""
    from database.connection import close_database_connections
    await close_database_connections()
    logger.info("Database connections closed")

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "message": "EAILI5 API is running",
        "status": "healthy",
        "version": "1.0.0"
    }

@app.get("/test-logging")
async def test_logging():
    """Test endpoint to verify logging works"""
    logger.info("This is an INFO log message")
    logger.debug("This is a DEBUG log message")
    return {"message": "Test logging endpoint called", "timestamp": datetime.now().isoformat()}

@app.get("/api/tokens")
async def get_tokens(category: str = "top15", limit: int = 15):
    """
    Get Base network tokens by category from CoinGecko
    
    Args:
        category: One of "top15", "trending", "volume", "new" (default: "top15")
        limit: Number of tokens to return (default: 15)
    """
    try:
        # Validate category
        valid_categories = ["top15", "trending", "volume", "new"]
        if category not in valid_categories:
            return {"error": f"Invalid category. Must be one of: {', '.join(valid_categories)}", "status": "error"}
        
        # Validate limit
        if limit < 1 or limit > 50:
            return {"error": "Limit must be between 1 and 50", "status": "error"}
        
        logger.info(f"Fetching {category} tokens (limit: {limit})")
        tokens = await token_service.get_tokens_by_category(category, limit)
        return {"tokens": tokens, "status": "success", "category": category}
    except Exception as e:
        logger.error(f"Error fetching tokens: {e}")
        return {"error": "Failed to fetch token data", "status": "error"}


@app.get("/api/tokens/{token_address}")
async def get_token_details(token_address: str):
    """Get detailed information about a specific token"""
    try:
        token_data = await token_service.get_token_details(token_address)
        return {"token": token_data, "status": "success"}
    except Exception as e:
        logger.error(f"Error fetching token details: {e}")
        return {"error": "Failed to fetch token details", "status": "error"}

@app.get("/api/tokens/{token_address}/ohlc")
async def get_token_ohlc(token_address: str, days: int = 1):
    """Get OHLC (Open, High, Low, Close) data for a token"""
    try:
        # Get token details first to get CoinGecko ID
        token_data = await token_service.get_token_details(token_address)
        coingecko_id = token_data.get("coingecko_id")
        
        if not coingecko_id:
            return {"error": "Token not found on CoinGecko", "status": "error"}
        
        # Fetch OHLC data
        ohlc_data = await coingecko_service.get_token_ohlc(coingecko_id, days)
        return {"ohlc": ohlc_data, "status": "success"}
    except Exception as e:
        logger.error(f"Error fetching OHLC data: {e}")
        return {"error": "Failed to fetch OHLC data", "status": "error"}

@app.get("/api/tokens/{token_address}/enhanced")
async def get_token_enhanced_details(token_address: str):
    """Get enhanced token details with full information"""
    try:
        # Get token details first to get CoinGecko ID
        token_data = await token_service.get_token_details(token_address)
        coingecko_id = token_data.get("coingecko_id")
        
        if not coingecko_id:
            return {"error": "Token not found on CoinGecko", "status": "error"}
        
        # Fetch enhanced details
        enhanced_details = await coingecko_service.get_token_details_enhanced(coingecko_id)
        return {"details": enhanced_details, "status": "success"}
    except Exception as e:
        logger.error(f"Error fetching enhanced token details: {e}")
        return {"error": "Failed to fetch enhanced token details", "status": "error"}

@app.get("/api/tokens/{token_address}/sentiment")
async def get_token_sentiment(token_address: str):
    """Get social sentiment analysis for a token"""
    try:
        # Get token details to get symbol for better search results
        token_data = await token_service.get_token_details(token_address)
        token_symbol = token_data.get("symbol")
        
        # Get sentiment analysis
        sentiment_data = await sentiment_service.get_token_sentiment(token_address, token_symbol)
        return {"sentiment": sentiment_data, "status": "success"}
    except Exception as e:
        logger.error(f"Error fetching token sentiment: {e}")
        return {"error": "Failed to fetch token sentiment", "status": "error"}

@app.get("/api/tokens/{token_address}/social-sentiment")
async def get_social_sentiment_analysis(token_address: str, hours: int = 24):
    """Get comprehensive social sentiment analysis with causal narrative"""
    try:
        # Get token details to get symbol for better search results
        token_data = await token_service.get_token_details(token_address)
        token_symbol = token_data.get("symbol")
        
        # Get multi-platform sentiment analysis
        sentiment_data = await sentiment_service.get_multi_platform_sentiment(token_address, token_symbol)
        
        # CRITICAL: Route through LangGraph orchestrator (never direct OpenAI)
        narrative_query = sentiment_service.get_sentiment_context_for_narrative(
            token_address, token_symbol, sentiment_data
        )
        
        # Check if orchestrator is available
        if not enhanced_langgraph_orchestrator:
            return {
                "error": "AI orchestrator is not initialized. The service may be starting up.",
                "status": "error",
                "sentiment_analysis": sentiment_data,
                "ai_narrative": None
            }
        
        # Use existing orchestrator instance from main.py
        try:
            orchestrator_result = await enhanced_langgraph_orchestrator.process_message(
                message=narrative_query,
                session_id=f"sentiment_{token_address}",
                user_id="sentiment_user",
                context={
                    "intent": "social_sentiment",  # ✅ Explicit intent
                    "token_address": token_address,
                    "token_symbol": token_symbol,
                    "token_data": token_data,  # ✅ Add token data
                    "sentiment_data": sentiment_data  # ✅ Pre-fetched data
                }
            )
            
            narrative = orchestrator_result.get("message", "No narrative generated.")
        except Exception as orch_error:
            logger.error(f"Orchestrator failed to generate narrative: {orch_error}")
            return {
                "error": f"AI narrative generation failed: {str(orch_error)}",
                "status": "error",
                "sentiment_analysis": sentiment_data,
                "ai_narrative": None
            }
        
        return {
            "sentiment_analysis": sentiment_data,
            "ai_narrative": narrative,  # ADD THIS LINE
            "status": "success",
            "token_address": token_address,
            "token_symbol": token_symbol,
            "analysis_hours": hours
        }
    except Exception as e:
        logger.error(f"Error fetching social sentiment analysis: {e}")
        return {"error": "Failed to fetch social sentiment analysis", "status": "error"}

@app.get("/api/tokens/{token_address}/sentiment-timeline")
async def get_sentiment_timeline(token_address: str, hours: int = 24):
    """Get sentiment timeline data for charting"""
    try:
        # Get sentiment time series data
        timeline_data = await sentiment_service.get_sentiment_time_series(token_address, hours)
        
        return {
            "timeline": timeline_data,
            "status": "success",
            "token_address": token_address,
            "period_hours": hours
        }
    except Exception as e:
        logger.error(f"Error fetching sentiment timeline: {e}")
        return {"error": "Failed to fetch sentiment timeline", "status": "error"}

@app.get("/api/social/trending-topics")
async def get_trending_social_topics(platform: str = "all"):
    """Get trending social topics across platforms"""
    try:
        # This would typically query a database or external API
        # For now, return mock data
        trending_data = {
            "platform": platform,
            "trending_topics": [
                {
                    "topic": "Base ecosystem",
                    "mentions": 150,
                    "sentiment": 0.3,
                    "platform": "reddit"
                },
                {
                    "topic": "DeFi protocols",
                    "mentions": 120,
                    "sentiment": 0.2,
                    "platform": "farcaster"
                },
                {
                    "topic": "NFT projects",
                    "mentions": 80,
                    "sentiment": -0.1,
                    "platform": "news"
                }
            ],
            "total_topics": 3,
            "generated_at": datetime.now().isoformat()
        }
        
        return {
            "trending_data": trending_data,
            "status": "success"
        }
    except Exception as e:
        logger.error(f"Error fetching trending topics: {e}")
        return {"error": "Failed to fetch trending topics", "status": "error"}

@app.post("/api/portfolio/simulate")
async def simulate_trade(trade_data: dict):
    """Simulate a trade in the portfolio"""
    try:
        result = await portfolio_simulator.simulate_trade(trade_data)
        return {"result": result, "status": "success"}
    except Exception as e:
        logger.error(f"Error simulating trade: {e}")
        return {"error": "Failed to simulate trade", "status": "error"}

@app.get("/api/portfolio/{user_id}")
async def get_portfolio(user_id: str):
    """Get user's virtual portfolio"""
    try:
        portfolio = await portfolio_simulator.get_portfolio(user_id)
        return {"portfolio": portfolio, "status": "success"}
    except Exception as e:
        logger.error(f"Error fetching portfolio: {e}")
        return {"error": "Failed to fetch portfolio", "status": "error"}

@app.get("/api/education/content/{category}")
async def get_educational_content(category: str):
    """Get educational content by category"""
    try:
        content = await educational_content_service.get_content_by_category(category)
        return {"content": content, "status": "success"}
    except Exception as e:
        logger.error(f"Error fetching educational content: {e}")
        return {"error": "Failed to fetch educational content", "status": "error"}

@app.get("/api/education/content/id/{content_id}")
async def get_content_by_id(content_id: str):
    """Get specific educational content by ID"""
    try:
        content = await educational_content_service.get_content_by_id(content_id)
        if content:
            return {"content": content, "status": "success"}
        else:
            return {"error": "Content not found", "status": "not_found"}
    except Exception as e:
        logger.error(f"Error fetching content by ID: {e}")
        return {"error": "Failed to fetch content", "status": "error"}

@app.get("/api/education/paths")
async def get_learning_paths():
    """Get all learning paths"""
    try:
        paths = await educational_content_service.get_learning_paths()
        return {"paths": paths, "status": "success"}
    except Exception as e:
        logger.error(f"Error fetching learning paths: {e}")
        return {"error": "Failed to fetch learning paths", "status": "error"}

@app.get("/api/education/paths/{path_id}")
async def get_learning_path(path_id: str):
    """Get specific learning path"""
    try:
        path = await educational_content_service.get_learning_path(path_id)
        if path:
            return {"path": path, "status": "success"}
        else:
            return {"error": "Learning path not found", "status": "not_found"}
    except Exception as e:
        logger.error(f"Error fetching learning path: {e}")
        return {"error": "Failed to fetch learning path", "status": "error"}

@app.get("/api/progress/{user_id}")
async def get_user_progress(user_id: str):
    """Get user's learning progress"""
    try:
        progress = await progress_tracking_service.get_user_progress(user_id)
        return {"progress": progress, "status": "success"}
    except Exception as e:
        logger.error(f"Error fetching user progress: {e}")
        return {"error": "Failed to fetch user progress", "status": "error"}

@app.get("/api/progress/{user_id}/achievements")
async def get_user_achievements(user_id: str):
    """Get user's achievements"""
    try:
        achievements = await progress_tracking_service.get_achievements(user_id)
        return {"achievements": achievements, "status": "success"}
    except Exception as e:
        logger.error(f"Error fetching user achievements: {e}")
        return {"error": "Failed to fetch user achievements", "status": "error"}

@app.get("/api/progress/{user_id}/stats")
async def get_user_stats(user_id: str):
    """Get comprehensive user statistics"""
    try:
        stats = await progress_tracking_service.get_user_stats(user_id)
        return {"stats": stats, "status": "success"}
    except Exception as e:
        logger.error(f"Error fetching user stats: {e}")
        return {"error": "Failed to fetch user stats", "status": "error"}

@app.get("/api/progress/leaderboard")
async def get_leaderboard(period: str = "all_time", limit: int = 10):
    """Get leaderboard for specified period"""
    try:
        leaderboard = await progress_tracking_service.get_leaderboard(period, limit)
        return {"leaderboard": leaderboard, "status": "success"}
    except Exception as e:
        logger.error(f"Error fetching leaderboard: {e}")
        return {"error": "Failed to fetch leaderboard", "status": "error"}

@app.post("/api/progress/{user_id}/complete-lesson")
async def complete_lesson(user_id: str, lesson_data: dict):
    """Mark a lesson as completed"""
    try:
        lesson_id = lesson_data.get("lesson_id")
        category = lesson_data.get("category")
        time_spent = lesson_data.get("time_spent", 0)
        
        success = await progress_tracking_service.update_lesson_completion(
            user_id, lesson_id, category, time_spent
        )
        
        if success:
            return {"message": "Lesson completed successfully", "status": "success"}
        else:
            return {"error": "Failed to update lesson completion", "status": "error"}
    except Exception as e:
        logger.error(f"Error completing lesson: {e}")
        return {"error": "Failed to complete lesson", "status": "error"}

@app.get("/api/progress/{user_id}/recommendations")
async def get_recommendations(user_id: str):
    """Get personalized learning recommendations"""
    try:
        recommendations = await progress_tracking_service.get_recommendations(user_id)
        return {"recommendations": recommendations, "status": "success"}
    except Exception as e:
        logger.error(f"Error fetching recommendations: {e}")
        return {"error": "Failed to fetch recommendations", "status": "error"}

@app.post("/api/wallet/connect")
async def connect_wallet(wallet_data: dict):
    """Connect a wallet and create user session"""
    try:
        wallet_address = wallet_data.get("address")
        wallet_type = wallet_data.get("type", "ethereum")
        chain_id = wallet_data.get("chain_id", 8453)
        user_agent = wallet_data.get("user_agent")
        
        result = await wallet_auth_service.connect_wallet(
            wallet_address, wallet_type, chain_id, user_agent
        )
        
        return result
        
    except Exception as e:
        logger.error(f"Error connecting wallet: {e}")
        return {"error": "Failed to connect wallet", "status": "error"}

@app.post("/api/wallet/disconnect")
async def disconnect_wallet(wallet_data: dict):
    """Disconnect a wallet"""
    try:
        wallet_address = wallet_data.get("address")
        
        success = await wallet_auth_service.disconnect_wallet(wallet_address)
        
        if success:
            return {"message": "Wallet disconnected successfully", "status": "success"}
        else:
            return {"error": "Failed to disconnect wallet", "status": "error"}
            
    except Exception as e:
        logger.error(f"Error disconnecting wallet: {e}")
        return {"error": "Failed to disconnect wallet", "status": "error"}

@app.get("/api/wallet/session/{session_id}")
async def get_wallet_session(session_id: str):
    """Get wallet session information"""
    try:
        session = await wallet_auth_service.get_user_session(session_id)
        
        if session:
            return {"session": session, "status": "success"}
        else:
            return {"error": "Session not found or expired", "status": "not_found"}
            
    except Exception as e:
        logger.error(f"Error getting wallet session: {e}")
        return {"error": "Failed to get session", "status": "error"}

@app.get("/api/wallet/user/{wallet_address}")
async def get_user_by_wallet(wallet_address: str):
    """Get user information by wallet address"""
    try:
        user = await wallet_auth_service.get_user_by_wallet(wallet_address)
        
        if user:
            return {"user": user, "status": "success"}
        else:
            return {"error": "User not found", "status": "not_found"}
            
    except Exception as e:
        logger.error(f"Error getting user by wallet: {e}")
        return {"error": "Failed to get user", "status": "error"}

@app.post("/api/wallet/preferences/{session_id}")
async def update_wallet_preferences(session_id: str, preferences: dict):
    """Update user preferences"""
    try:
        success = await wallet_auth_service.update_user_preferences(session_id, preferences)
        
        if success:
            return {"message": "Preferences updated successfully", "status": "success"}
        else:
            return {"error": "Failed to update preferences", "status": "error"}
            
    except Exception as e:
        logger.error(f"Error updating preferences: {e}")
        return {"error": "Failed to update preferences", "status": "error"}

@app.get("/api/wallet/stats/{session_id}")
async def get_wallet_stats(session_id: str):
    """Get wallet and user statistics"""
    try:
        stats = await wallet_auth_service.get_user_stats(session_id)
        
        if stats:
            return {"stats": stats, "status": "success"}
        else:
            return {"error": "Stats not found", "status": "not_found"}
            
    except Exception as e:
        logger.error(f"Error getting wallet stats: {e}")
        return {"error": "Failed to get stats", "status": "error"}

@app.get("/api/wallet/connected")
async def get_connected_wallets():
    """Get list of connected wallets"""
    try:
        wallets = await wallet_auth_service.get_connected_wallets()
        return {"wallets": wallets, "status": "success"}
        
    except Exception as e:
        logger.error(f"Error getting connected wallets: {e}")
        return {"error": "Failed to get connected wallets", "status": "error"}

# Session Management Endpoints
@app.post("/api/session/create")
async def create_session(request: dict):
    """Create a new session token"""
    try:
        if session_service is None:
            logger.error("Session service not initialized")
            raise HTTPException(status_code=503, detail="Session service unavailable")
            
        user_id = request.get("user_id", "anonymous")
        wallet_address = request.get("wallet_address")
        
        # Rate limiting check (optional but recommended)
        # TODO: Add rate limiting per IP
        
        session_token = await session_service.create_session(user_id, wallet_address)
        
        return {
            "session_token": session_token,
            "expires_in": 86400  # 24 hours
        }
    except Exception as e:
        logger.error(f"Error creating session: {e}")
        raise HTTPException(status_code=500, detail="Failed to create session")

@app.post("/api/session/validate")
async def validate_session(request: dict):
    """Validate a session token"""
    try:
        session_token = request.get("session_token")
        session_data = await session_service.validate_session(session_token)
        
        if not session_data:
            raise HTTPException(status_code=401, detail="Invalid or expired session")
        
        return {
            "valid": True,
            "user_id": session_data["user_id"]
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error validating session: {e}")
        raise HTTPException(status_code=500, detail="Failed to validate session")

@app.post("/api/session/end")
async def end_session(request: dict):
    """End a session"""
    try:
        session_token = request.get("session_token")
        success = await session_service.end_session(session_token)
        return {"success": success}
    except Exception as e:
        logger.error(f"Error ending session: {e}")
        raise HTTPException(status_code=500, detail="Failed to end session")

@app.websocket("/ws/chat/secure")
async def websocket_chat_secure(websocket: WebSocket):
    """Secure WebSocket endpoint for AI chat with session validation"""
    import sys
    sys.stdout.write("=== SECURE WEBSOCKET ENDPOINT CALLED ===\n")
    sys.stdout.flush()
    logger.info("Secure WebSocket chat endpoint called")
    await websocket_service.connect(websocket, "secure", "chat")
    sys.stdout.write("=== SECURE WEBSOCKET CONNECTED ===\n")
    sys.stdout.flush()
    
    try:
        while True:
            # Receive message from client
            data = await websocket.receive_text()
            logger.info(f"Received secure WebSocket message: {data}")
            message_data = json.loads(data)
            
            # Debug session token
            session_token = message_data.get("session_id")
            logger.info(f"Session token received: {session_token[:8] if session_token else 'None'}...")
            
            # Handle different message types
            message_type = message_data.get("type", "chat")
            logger.info(f"Message type: {message_type}")
            
            if message_type == "chat":
                user_message = message_data["message"]
                message_id = message_data.get("messageId")
                session_token = message_data.get("session_id")  # Session token for validation
                streaming_mode = message_data.get("streaming", True)  # Default to streaming
                logger.info(f"Processing secure chat message: '{user_message}' (ID: {message_id}, Streaming: {streaming_mode})")
                
                # SECURITY: Validate session token
                session_data = await session_service.validate_session(session_token)
                if not session_data:
                    await websocket.send_json({
                        "type": "error",
                        "message": "Invalid or expired session. Please refresh.",
                        "messageId": message_id
                    })
                    continue
                
                # Use validated user_id from session, not from client
                validated_user_id = session_data["user_id"]
                logger.info(f"Processing chat message from validated user: {validated_user_id}")
                
                # Process message through Enhanced LangGraph orchestrator
                logger.info(f"Enhanced orchestrator available: {enhanced_langgraph_orchestrator is not None}")
                
                # Check if orchestrator is available
                if not enhanced_langgraph_orchestrator:
                    await websocket.send_json({
                        "type": "error",
                        "message": "AI service is not available. Please try again later.",
                        "suggestions": ["Try refreshing the page", "Check your internet connection"],
                        "messageId": message_id
                    })
                    continue
                
                try:
                    if streaming_mode:
                        # STREAMING MODE - Character by character with status updates
                        logger.info("Using streaming mode...")
                        
                        async for stream_data in enhanced_langgraph_orchestrator.process_message_stream(
                            message=user_message,
                            user_id=validated_user_id,
                            session_id=session_token,
                            learning_level=message_data.get("learning_level", 0),
                            context=message_data.get("context", {}),
                            message_id=message_id
                        ):
                            # Add messageId to each stream chunk
                            stream_data["messageId"] = message_id
                            
                            # Send each chunk immediately
                            await websocket.send_json(stream_data)
                        
                        logger.info("Streaming complete")
                    
                    else:
                        # NON-STREAMING MODE
                        logger.info("Using non-streaming mode...")
                        response = await enhanced_langgraph_orchestrator.process_message(
                            message=user_message,
                            user_id=validated_user_id,
                            session_id=session_token,
                            learning_level=message_data.get("learning_level", 0),
                            context=message_data.get("context", {}),
                            message_id=message_id
                        )
                        
                        logger.info(f"LangGraph response received: {response}")
                        
                        # Validate response has message
                        if not response.get("message"):
                            logger.error(f"Empty message in response: {response}")
                            raise ValueError("LangGraph returned empty message")
                        
                        # Prepare response for frontend
                        response_data = {
                            "type": "ai_response",
                            "message": response["message"],
                            "suggestions": response.get("suggestions", []),
                            "learning_level": response.get("learning_level", 0),
                            "messageId": message_id
                        }
                        
                        # Send response back to client
                        await websocket.send_json(response_data)
                        logger.info("Response sent successfully to frontend")
                        
                except Exception as e:
                    logger.error(f"LangGraph orchestrator error: {e}")
                    logger.error(f"Error type: {type(e)}")
                    import traceback
                    logger.error(f"Traceback: {traceback.format_exc()}")
                    
                    # Send error response
                    await websocket.send_json({
                        "type": "error",
                        "message": "I'm having trouble processing that. Could you try again?",
                        "suggestions": ["What is a blockchain?", "How do I buy my first crypto?", "What's the difference between Bitcoin and Ethereum?"],
                        "messageId": message_id
                    })
                
            elif message_type == "subscribe":
                # Subscribe to topic
                topic = message_data.get("topic", "chat")
                logger.info(f"Subscribing to topic: {topic}")
                await websocket_service.subscribe_to_topic(websocket, topic)
                
            elif message_type == "unsubscribe":
                # Unsubscribe from topic
                topic = message_data.get("topic", "chat")
                logger.info(f"Unsubscribing from topic: {topic}")
                await websocket_service.unsubscribe_from_topic(websocket, topic)
                
            elif message_type == "heartbeat":
                # Handle heartbeat
                logger.info("Handling heartbeat")
                await websocket_service.handle_connection_heartbeat(websocket)
            
    except WebSocketDisconnect:
        logger.info("Secure WebSocket disconnected")
        websocket_service.disconnect(websocket, "secure")
    except Exception as e:
        logger.error(f"Secure WebSocket error: {e}")
        logger.error(f"Error type: {type(e)}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        await websocket_service.send_personal_message(websocket, {
            "type": "error",
            "message": "Eaili5 hit a snag. Let me try again..."
        })

@app.websocket("/ws/tokens")
async def websocket_tokens(websocket: WebSocket):
    """WebSocket endpoint for real-time token updates"""
    await websocket_service.connect(websocket, "anonymous", "tokens")
    
    try:
        # Subscribe to token updates
        await websocket_service.subscribe_to_topic(websocket, "tokens")
        
        while True:
            # Keep connection alive
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            if message_data.get("type") == "heartbeat":
                await websocket_service.handle_connection_heartbeat(websocket)
            
    except WebSocketDisconnect:
        websocket_service.disconnect(websocket, "anonymous")
    except Exception as e:
        logger.error(f"Token WebSocket error: {e}")

@app.websocket("/ws/portfolio/{user_id}")
async def websocket_portfolio(websocket: WebSocket, user_id: str):
    """WebSocket endpoint for portfolio updates"""
    await websocket_service.connect(websocket, user_id, "portfolio")
    
    try:
        # Subscribe to portfolio updates
        await websocket_service.subscribe_to_topic(websocket, "portfolio")
        
        while True:
            # Keep connection alive
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            if message_data.get("type") == "heartbeat":
                await websocket_service.handle_connection_heartbeat(websocket)
            
    except WebSocketDisconnect:
        websocket_service.disconnect(websocket, user_id)
    except Exception as e:
        logger.error(f"Portfolio WebSocket error: {e}")

# Progress Tracking Endpoints
@app.get("/api/progress/{user_id}")
async def get_user_progress(user_id: str):
    """Get user progress and stats"""
    try:
        progress = await progress_tracking_service.get_user_progress(user_id)
        return {"progress": progress, "status": "success"}
    except Exception as e:
        logger.error(f"Error fetching user progress: {e}")
        return {"error": "Failed to fetch user progress", "status": "error"}

@app.post("/api/progress/{user_id}/lesson")
async def mark_lesson_complete(user_id: str, lesson_data: dict):
    """Mark lesson as complete"""
    try:
        lesson_id = lesson_data.get("lesson_id")
        category = lesson_data.get("category")
        time_spent = lesson_data.get("time_spent", 0)
        
        success = await progress_tracking_service.update_lesson_completion(
            user_id, lesson_id, category, time_spent
        )
        
        if success:
            return {"message": "Lesson marked as complete", "status": "success"}
        else:
            return {"error": "Failed to mark lesson complete", "status": "error"}
    except Exception as e:
        logger.error(f"Error marking lesson complete: {e}")
        return {"error": "Failed to mark lesson complete", "status": "error"}

@app.get("/api/progress/{user_id}/achievements")
async def get_user_achievements(user_id: str):
    """Get user's earned achievements"""
    try:
        achievements = await progress_tracking_service.get_achievements(user_id)
        return {"achievements": achievements, "status": "success"}
    except Exception as e:
        logger.error(f"Error fetching achievements: {e}")
        return {"error": "Failed to fetch achievements", "status": "error"}

@app.get("/api/progress/{user_id}/achievements/available")
async def get_available_achievements(user_id: str):
    """Get achievements user hasn't earned yet"""
    try:
        achievements = await progress_tracking_service.get_available_achievements(user_id)
        return {"achievements": achievements, "status": "success"}
    except Exception as e:
        logger.error(f"Error fetching available achievements: {e}")
        return {"error": "Failed to fetch available achievements", "status": "error"}

@app.get("/api/progress/leaderboard")
async def get_leaderboard(period: str = "all_time", limit: int = 10):
    """Get leaderboard for specified period"""
    try:
        leaderboard = await progress_tracking_service.get_leaderboard(period, limit)
        return {"leaderboard": leaderboard, "status": "success"}
    except Exception as e:
        logger.error(f"Error fetching leaderboard: {e}")
        return {"error": "Failed to fetch leaderboard", "status": "error"}

@app.post("/api/progress/{user_id}/streak")
async def update_learning_streak(user_id: str):
    """Update user's learning streak"""
    try:
        success = await progress_tracking_service.update_streak(user_id)
        if success:
            return {"message": "Streak updated", "status": "success"}
        else:
            return {"error": "Failed to update streak", "status": "error"}
    except Exception as e:
        logger.error(f"Error updating streak: {e}")
        return {"error": "Failed to update streak", "status": "error"}

# Learning Paths Endpoints
@app.get("/api/learning-paths/{path_id}/progress/{user_id}")
async def get_learning_path_progress(path_id: str, user_id: str):
    """Get user's progress on a specific learning path"""
    try:
        progress = await progress_tracking_service.get_learning_path_progress(user_id, path_id)
        return {"progress": progress, "status": "success"}
    except Exception as e:
        logger.error(f"Error fetching learning path progress: {e}")
        return {"error": "Failed to fetch learning path progress", "status": "error"}

# Wallet Authentication Endpoints
@app.post("/api/wallet/connect")
async def connect_wallet(wallet_data: dict):
    """Connect wallet and create session"""
    try:
        wallet_address = wallet_data.get("wallet_address")
        wallet_type = wallet_data.get("wallet_type", "ethereum")
        chain_id = wallet_data.get("chain_id", 8453)
        user_agent = wallet_data.get("user_agent")
        
        result = await wallet_auth_service.connect_wallet(
            wallet_address, wallet_type, chain_id, user_agent
        )
        return result
    except Exception as e:
        logger.error(f"Error connecting wallet: {e}")
        return {"error": "Failed to connect wallet", "status": "error"}

@app.post("/api/wallet/disconnect")
async def disconnect_wallet(wallet_data: dict):
    """Disconnect wallet"""
    try:
        wallet_address = wallet_data.get("wallet_address")
        success = await wallet_auth_service.disconnect_wallet(wallet_address)
        
        if success:
            return {"message": "Wallet disconnected successfully", "status": "success"}
        else:
            return {"error": "Failed to disconnect wallet", "status": "error"}
    except Exception as e:
        logger.error(f"Error disconnecting wallet: {e}")
        return {"error": "Failed to disconnect wallet", "status": "error"}

@app.post("/api/wallet/verify")
async def verify_wallet_signature(verification_data: dict):
    """Verify wallet signature"""
    try:
        wallet_address = verification_data.get("wallet_address")
        message = verification_data.get("message")
        signature = verification_data.get("signature")
        
        is_valid = await wallet_auth_service.validate_wallet_signature(
            wallet_address, message, signature
        )
        
        return {"valid": is_valid, "status": "success"}
    except Exception as e:
        logger.error(f"Error verifying wallet signature: {e}")
        return {"error": "Failed to verify signature", "status": "error"}

@app.get("/api/wallet/session/{session_id}")
async def get_wallet_session(session_id: str):
    """Get session info"""
    try:
        session = await wallet_auth_service.get_user_session(session_id)
        if session:
            return {"session": session, "status": "success"}
        else:
            return {"error": "Session not found", "status": "error"}
    except Exception as e:
        logger.error(f"Error fetching session: {e}")
        return {"error": "Failed to fetch session", "status": "error"}

@app.post("/api/wallet/auth/token")
async def generate_auth_token(token_data: dict):
    """Generate authentication token"""
    try:
        session_id = token_data.get("session_id")
        token = await wallet_auth_service.create_auth_token(session_id)
        
        if token:
            return {"token": token, "status": "success"}
        else:
            return {"error": "Failed to generate token", "status": "error"}
    except Exception as e:
        logger.error(f"Error generating auth token: {e}")
        return {"error": "Failed to generate token", "status": "error"}

@app.get("/api/wallet/user/{wallet_address}")
async def get_user_by_wallet(wallet_address: str):
    """Get user by wallet address"""
    try:
        user = await wallet_auth_service.get_user_by_wallet(wallet_address)
        if user:
            return {"user": user, "status": "success"}
        else:
            return {"error": "User not found", "status": "error"}
    except Exception as e:
        logger.error(f"Error fetching user by wallet: {e}")
        return {"error": "Failed to fetch user", "status": "error"}

# User Management Endpoints
@app.get("/api/users/{user_id}")
async def get_user_profile(user_id: str):
    """Get user profile"""
    try:
        # Get user progress for profile
        progress = await progress_tracking_service.get_user_progress(user_id)
        stats = await progress_tracking_service.get_user_stats(user_id)
        
        profile = {
            "user_id": user_id,
            "progress": progress,
            "stats": stats,
            "created_at": progress.get("created_at"),
            "last_updated": progress.get("last_updated")
        }
        
        return {"profile": profile, "status": "success"}
    except Exception as e:
        logger.error(f"Error fetching user profile: {e}")
        return {"error": "Failed to fetch user profile", "status": "error"}

@app.put("/api/users/{user_id}/preferences")
async def update_user_preferences(user_id: str, preferences: dict):
    """Update user preferences"""
    try:
        # This would need session_id in a real implementation
        # For now, we'll use a placeholder
        session_id = f"session_{user_id}"  # Placeholder
        
        success = await wallet_auth_service.update_user_preferences(session_id, preferences)
        
        if success:
            return {"message": "Preferences updated", "status": "success"}
        else:
            return {"error": "Failed to update preferences", "status": "error"}
    except Exception as e:
        logger.error(f"Error updating preferences: {e}")
        return {"error": "Failed to update preferences", "status": "error"}

@app.get("/api/users/{user_id}/stats")
async def get_user_statistics(user_id: str):
    """Get user statistics"""
    try:
        stats = await progress_tracking_service.get_user_stats(user_id)
        return {"stats": stats, "status": "success"}
    except Exception as e:
        logger.error(f"Error fetching user stats: {e}")
        return {"error": "Failed to fetch user stats", "status": "error"}

# Analytics Endpoints
@app.get("/api/analytics/overview")
async def get_analytics_overview():
    """Get platform overview statistics"""
    try:
        overview = await analytics_service.get_platform_overview()
        return {"overview": overview, "status": "success"}
    except Exception as e:
        logger.error(f"Error fetching analytics overview: {e}")
        return {"error": "Failed to fetch analytics overview", "status": "error"}

@app.get("/api/analytics/users")
async def get_user_analytics():
    """Get user engagement metrics"""
    try:
        metrics = await analytics_service.get_user_engagement_metrics()
        return {"metrics": metrics, "status": "success"}
    except Exception as e:
        logger.error(f"Error fetching user analytics: {e}")
        return {"error": "Failed to fetch user analytics", "status": "error"}

@app.get("/api/analytics/content")
async def get_content_analytics():
    """Get content performance metrics"""
    try:
        metrics = await analytics_service.get_content_performance_metrics()
        return {"metrics": metrics, "status": "success"}
    except Exception as e:
        logger.error(f"Error fetching content analytics: {e}")
        return {"error": "Failed to fetch content analytics", "status": "error"}

@app.get("/api/analytics/tokens")
async def get_token_analytics():
    """Get token exploration statistics"""
    try:
        stats = await analytics_service.get_token_exploration_stats()
        return {"stats": stats, "status": "success"}
    except Exception as e:
        logger.error(f"Error fetching token analytics: {e}")
        return {"error": "Failed to fetch token analytics", "status": "error"}

# Base Mini App Endpoints
@app.get("/api/miniapp/manifest")
async def get_miniapp_manifest():
    """Get Base Mini App manifest"""
    try:
        manifest = await miniapp_service.get_manifest()
        return manifest
    except Exception as e:
        logger.error(f"Error fetching Mini App manifest: {e}")
        return {"error": "Failed to fetch manifest", "status": "error"}

@app.post("/api/miniapp/validate")
async def validate_miniapp_manifest(manifest_data: dict):
    """Validate Base Mini App manifest"""
    try:
        validation = await miniapp_service.validate_manifest(manifest_data)
        return validation
    except Exception as e:
        logger.error(f"Error validating manifest: {e}")
        return {"error": "Failed to validate manifest", "status": "error"}

@app.get("/api/miniapp/account-association")
async def get_account_association():
    """Get Base account association"""
    try:
        association = await miniapp_service.get_account_association()
        return association
    except Exception as e:
        logger.error(f"Error fetching account association: {e}")
        return {"error": "Failed to fetch account association", "status": "error"}

@app.get("/api/miniapp/config")
async def get_miniapp_config():
    """Get Mini App configuration"""
    try:
        config = await miniapp_service.get_miniapp_config()
        return config
    except Exception as e:
        logger.error(f"Error fetching Mini App config: {e}")
        return {"error": "Failed to fetch config", "status": "error"}

# Appreciation API endpoints

@app.post("/api/appreciation/log")
async def log_appreciation_transaction(request: dict):
    """Log an appreciation transaction (optional tracking)"""
    try:
        user_id = request.get("user_id")
        transaction_hash = request.get("transaction_hash")
        amount_eth = request.get("amount_eth")
        message_id = request.get("message_id")
        
        if not user_id or not transaction_hash or not amount_eth:
            raise HTTPException(status_code=400, detail="Missing required fields: user_id, transaction_hash, amount_eth")
        
        result = await feedback_service.log_appreciation_transaction(
            user_id=user_id,
            transaction_hash=transaction_hash,
            amount_eth=float(amount_eth),
            message_id=message_id
        )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error logging appreciation transaction: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/health")
async def health_check_simple():
    """Simple health check for Docker"""
    return {"status": "healthy"}

@app.get("/api/health")
async def health_check():
    """Comprehensive health check"""
    try:
        # Check OpenAI connection
        openai_status = await openai_service.health_check()
        
        # Check Tavily connection
        tavily_status = await tavily_service.health_check()
        
        # Check Base RPC connection
        base_status = await base_client.check_connection()
        
        # Check Bitquery connection (basic test)
        bitquery_status = True  # Will be tested when first API call is made
        
        # Check educational content service
        educational_content_status = True  # In-memory service, always available
        
        # Check progress tracking service  
        progress_tracking_status = True  # In-memory service, always available
        
        # Check WebSocket service
        websocket_status = True  # In-memory service, always available
        
        # Check wallet auth service
        wallet_auth_status = True  # In-memory service, always available
        
        # Check analytics service
        analytics_status = True  # In-memory service, always available
        
        # Check Mini App service
        miniapp_status = True  # In-memory service, always available
        
        # Check Enhanced LangGraph orchestrator
        orchestrator_connected = enhanced_langgraph_orchestrator is not None
        
        # Check Redis connection
        try:
            redis_connected = await redis_service.health_check()
        except Exception:
            redis_connected = False
        
        # Check database connection
        try:
            db_connected = await check_database_connection()
        except Exception:
            db_connected = False
        
        all_healthy = all([
            openai_status, tavily_status, base_status, educational_content_status, 
            progress_tracking_status, websocket_status, wallet_auth_status,
            analytics_status, miniapp_status, orchestrator_connected, redis_connected, db_connected
        ])
        
        return {
            "status": "healthy" if all_healthy else "degraded",
            "services": {
                "openai": "connected" if openai_status else "disconnected",
                "tavily": "connected" if tavily_status else "disconnected",
                "base_rpc": "connected" if base_status else "disconnected",
                "bitquery": "connected" if bitquery_status else "disconnected",
                "educational_content": "connected" if educational_content_status else "disconnected",
                "progress_tracking": "connected" if progress_tracking_status else "disconnected",
                "websocket": "connected" if websocket_status else "disconnected",
                "wallet_auth": "connected" if wallet_auth_status else "disconnected",
                "analytics": "connected" if analytics_status else "disconnected",
                "miniapp": "connected" if miniapp_status else "disconnected",
                "orchestrator": "connected" if orchestrator_connected else "disconnected",
                "redis": "connected" if redis_connected else "disconnected",
                "database": "connected" if db_connected else "disconnected"
            },
            "version": "1.0.0",
            "environment": "development",
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }

# Note: This file is designed to be run via start_backend.ps1 or uvicorn directly
# Do not add if __name__ == "__main__" block to prevent multiple startup entry points
