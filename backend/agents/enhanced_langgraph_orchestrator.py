"""
Enhanced LangGraph Orchestrator - Full agentic AI coordination with memory, context, and tools
Part of the EAILI5 multi-agent system
"""

import asyncio
from typing import Dict, List, Any, Optional, TypedDict, Annotated
import logging
from datetime import datetime
from langgraph.graph import StateGraph, END
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage
from .memory.memory_manager import MemoryManager
from .context.context_builder import ContextBuilder
from .context.user_state_tracker import UserStateTracker
from .tools.tool_registry import ToolRegistry
from .tools.tool_executor import ToolExecutor

logger = logging.getLogger(__name__)

class EnhancedAgentState(TypedDict):
    """Enhanced state for the multi-agent system with memory and tools"""
    # Core state
    messages: List[Dict[str, Any]]  # Changed from BaseMessage to Dict to avoid circular refs
    user_id: str
    learning_level: int
    context: Dict[str, Any]
    session_id: str
    
    # Memory state
    short_term_memory: List[Dict]
    relevant_episodes: List[Dict]
    user_profile: Dict
    semantic_context: List[Dict]
    
    # Tool state
    tool_calls: List[Dict]
    tool_results: List[Dict]
    pending_tool_calls: List[str]
    available_tools: List[str]
    
    # Enhanced routing
    intent_stack: List[str]
    confidence_scores: Dict[str, float]
    required_agents: List[str]
    completed_agents: List[str]
    
    # Agent responses
    current_agent: Optional[str]
    agent_responses: Dict[str, Any]
    final_response: Optional[str]
    suggestions: List[str]
    
    # Meta state
    turn_count: int
    needs_clarification: bool
    synthesis_ready: bool
    emotional_context: Dict[str, Any]
    learning_objectives: List[Dict]

class EnhancedLangGraphOrchestrator:
    """
    Enhanced LangGraph orchestrator with full agentic capabilities
    """
    
    def __init__(self, session_factory, redis_service):
        self.session_factory = session_factory
        self.redis_service = redis_service
        
        # Core components
        self.graph = None
        self.agents = {}
        self.tools = {}
        
        # Memory and context
        self.memory_manager = MemoryManager(session_factory, redis_service)
        self.context_builder = ContextBuilder(self.memory_manager)
        self.user_state_tracker = UserStateTracker(redis_service)
        
        # Tools
        self.tool_registry = ToolRegistry()
        self.tool_executor = ToolExecutor(self.tool_registry)
        
    async def initialize(self, agents: Dict[str, Any], tools: Dict[str, Any]):
        """Initialize the enhanced orchestrator"""
        try:
            self.agents = agents
            self.tools = tools
            
            # Initialize memory and context systems
            await self.memory_manager.initialize()
            
            # Register tools
            await self._register_all_tools()
            
            # Create the enhanced state graph
            workflow = self._create_enhanced_graph()
            self.graph = workflow
            
            logger.info("Enhanced LangGraph orchestrator initialized successfully")
            
        except Exception as e:
            logger.error(f"Error initializing enhanced orchestrator: {e}")
            raise
    
    def _create_enhanced_graph(self) -> StateGraph:
        """Create the enhanced LangGraph state graph"""
        try:
            workflow = StateGraph(EnhancedAgentState)
            
            # Add enhanced nodes
            workflow.add_node("context_analyzer", self._context_analyzer_node)
            workflow.add_node("intent_analyzer", self._intent_analyzer_node)
            workflow.add_node("tool_planner", self._tool_planner_node)
            workflow.add_node("tool_executor", self._tool_executor_node)
            workflow.add_node("coordinator", self._enhanced_coordinator_node)
            workflow.add_node("research", self._enhanced_research_node)
            workflow.add_node("educator", self._enhanced_educator_node)
            workflow.add_node("portfolio", self._enhanced_portfolio_node)
            workflow.add_node("trading_strategy", self._enhanced_trading_strategy_node)
            workflow.add_node("web_search", self._enhanced_web_search_node)
            workflow.add_node("social_sentiment", self._enhanced_social_sentiment_node)
            workflow.add_node("synthesizer", self._enhanced_synthesizer_node)
            workflow.add_node("memory_updater", self._memory_updater_node)
            
            # Define the enhanced flow
            workflow.set_entry_point("context_analyzer")
            
            # Context analysis leads to intent analysis
            workflow.add_edge("context_analyzer", "intent_analyzer")
            
            # Intent analysis leads to tool planning
            workflow.add_edge("intent_analyzer", "tool_planner")
            
            # Tool planning leads to tool execution or coordinator
            workflow.add_conditional_edges(
                "tool_planner",
                self._route_after_tool_planning,
                {
                    "execute_tools": "tool_executor",
                    "route_to_agents": "coordinator"
                }
            )
            
            # Tool execution leads back to coordinator
            workflow.add_edge("tool_executor", "coordinator")
            
            # Coordinator routes to appropriate agents
            workflow.add_conditional_edges(
                "coordinator",
                self._enhanced_route_to_agents,
                {
                    "research": "research",
                    "educator": "educator",
                    "portfolio": "portfolio",
                    "trading_strategy": "trading_strategy",
                    "web_search": "web_search",
                    "social_sentiment": "social_sentiment",
                    "synthesizer": "synthesizer"
                }
            )
            
            # All agents route to synthesizer
            workflow.add_edge("research", "synthesizer")
            workflow.add_edge("educator", "synthesizer")
            workflow.add_edge("portfolio", "synthesizer")
            workflow.add_edge("trading_strategy", "synthesizer")
            workflow.add_edge("web_search", "synthesizer")
            workflow.add_edge("social_sentiment", "synthesizer")
            
            # Synthesizer leads to memory update
            workflow.add_edge("synthesizer", "memory_updater")
            
            # Memory updater is the end
            workflow.add_edge("memory_updater", END)
            
            return workflow.compile()
            
        except Exception as e:
            logger.error(f"Error creating enhanced graph: {e}")
            raise
    
    async def _context_analyzer_node(self, state: EnhancedAgentState) -> EnhancedAgentState:
        """Analyze context and build comprehensive context for the interaction"""
        try:
            user_id = state["user_id"]
            query = state["messages"][-1]["content"] if state["messages"] else ""
            
            # Get conversation history from memory manager
            try:
                # Get relevant context from memory manager
                relevant_context = await self.memory_manager.retrieve_relevant_context(
                    user_id=user_id,
                    query=query,
                    max_items=5
                )
                conversation_context = {
                    "recent_messages": relevant_context.get("short_term", []),
                    "message_count": len(relevant_context.get("short_term", []))
                }
                
                # Log memory usage for verification
                logger.info(f"Memory recall for user {user_id}:")
                logger.info(f"  - Short-term: {len(relevant_context.get('short_term', []))} messages")
                logger.info(f"  - Episodes: {len(relevant_context.get('episodes', []))} episodes")
                logger.info(f"  - Procedures: {len(relevant_context.get('procedures', []))} procedures")
                logger.info(f"  - User profile: {bool(relevant_context.get('user_profile', {}))}")
                logger.info(f"  - Conversation summary: {bool(relevant_context.get('conversation_summary', ''))}")
            except Exception as e:
                logger.warning(f"Memory manager failed, using simplified context: {e}")
                conversation_context = {"recent_messages": [], "message_count": 0}
            
            # Build comprehensive context with conversation history
            state["context"] = {
                "user_id": user_id,
                "query": query,
                "timestamp": datetime.now().isoformat(),
                "conversation_history": conversation_context,
                "previous_messages": [msg["content"] for msg in state["messages"][-5:]],  # Last 5 messages
                "recent_messages": conversation_context.get("recent_messages", []),  # Add recent messages to context
                "message_count": conversation_context.get("message_count", 0)
            }
            state["user_profile"] = {
                "learning_level": 0,
                "user_id": user_id
            }
            state["short_term_memory"] = conversation_context.get("recent_messages", [])
            state["relevant_episodes"] = []
            state["semantic_context"] = {}
            state["emotional_context"] = {}
            
            logger.info(f"Context analyzed for user {user_id} with {len(conversation_context.get('recent_messages', []))} recent messages")
            return state
            
        except Exception as e:
            logger.error(f"Error in context analyzer: {e}")
            return state
    
    async def _intent_analyzer_node(self, state: EnhancedAgentState) -> EnhancedAgentState:
        """Analyze user intent with enhanced context awareness"""
        try:
            user_id = state["user_id"]
            message = state["messages"][-1]["content"] if state["messages"] else ""
            context = state["context"]
            
            # Get user state for intent analysis
            user_state = await self.user_state_tracker.get_user_state(user_id)
            
            # Analyze intent with context
            intent_analysis = await self._analyze_intent_with_context(
                message, context, user_state
            )
            
            # Update state with intent analysis
            state["intent_stack"] = intent_analysis.get("intents", ["education"])
            state["confidence_scores"] = intent_analysis.get("confidence_scores", {})
            state["required_agents"] = intent_analysis.get("required_agents", ["educator"])
            state["needs_clarification"] = intent_analysis.get("needs_clarification", False)
            
            # Update user state
            await self.user_state_tracker.update_user_state(user_id, {
                "current_learning_topic": intent_analysis.get("primary_topic"),
                "engagement_level": intent_analysis.get("engagement_level", "medium")
            })
            
            logger.info(f"Intent analyzed for user {user_id}: {state['intent_stack']}")
            return state
            
        except Exception as e:
            logger.error(f"Error in intent analyzer: {e}")
            return state
    
    async def _tool_planner_node(self, state: EnhancedAgentState) -> EnhancedAgentState:
        """Plan which tools are needed for the interaction"""
        try:
            user_id = state["user_id"]
            intents = state["intent_stack"]
            context = state["context"]
            
            # Determine required tools based on intent and context
            required_tools = await self._plan_required_tools(intents, context, user_id)
            
            # Get available tools for user
            available_tools = self.tool_registry.get_available_tools(
                user_id=user_id,
                categories=required_tools.get("categories", [])
            )
            
            # Update state with tool information
            state["available_tools"] = [tool.name for tool in available_tools]
            state["pending_tool_calls"] = required_tools.get("tool_calls", [])
            
            logger.info(f"Tool planning completed for user {user_id}")
            return state
            
        except Exception as e:
            logger.error(f"Error in tool planner: {e}")
            return state
    
    async def _tool_executor_node(self, state: EnhancedAgentState) -> EnhancedAgentState:
        """Execute planned tool calls"""
        try:
            user_id = state["user_id"]
            pending_calls = state["pending_tool_calls"]
            
            if not pending_calls:
                return state
            
            # Execute tool calls
            tool_results = await self.tool_executor.execute_batch_tool_calls(
                tool_calls=pending_calls,
                user_id=user_id
            )
            
            # Update state with tool results
            state["tool_results"] = tool_results
            state["pending_tool_calls"] = []
            
            logger.info(f"Executed {len(tool_results)} tool calls for user {user_id}")
            return state
            
        except Exception as e:
            logger.error(f"Error in tool executor: {e}")
            return state
    
    async def _enhanced_coordinator_node(self, state: EnhancedAgentState) -> EnhancedAgentState:
        """Enhanced coordinator with memory and context awareness"""
        try:
            user_id = state["user_id"]
            message = state["messages"][-1]["content"] if state["messages"] else ""
            context = state["context"]
            tool_results = state["tool_results"]
            
            # Get coordinator agent
            coordinator = self.agents.get("coordinator")
            if not coordinator:
                logger.error("Coordinator agent not found")
                return state
            
            # Build enhanced context for coordinator with conversation history
            enhanced_context = {
                **context,
                "tool_results": tool_results,
                "user_profile": state["user_profile"],
                "emotional_context": state["emotional_context"],
                "learning_objectives": state.get("learning_objectives", []),
                "conversation_history": context.get("conversation_history", {}),
                "recent_messages": context.get("recent_messages", []),
                "previous_messages": context.get("previous_messages", [])
            }
            
            # Process with coordinator
            response = await coordinator.process_message(
                message=message,
                user_id=user_id,
                context=enhanced_context
            )
            
            # Update state with simplified response
            state["agent_responses"]["coordinator"] = {
                "message": response.get("message", ""),
                "suggestions": response.get("suggestions", []),
                "learning_level": response.get("learning_level", 0)
            }
            state["current_agent"] = "coordinator"
            
            logger.info(f"Enhanced coordinator processed message for user {user_id}")
            return state
            
        except Exception as e:
            logger.error(f"Error in enhanced coordinator: {e}")
            return state
    
    async def _enhanced_educator_node(self, state: EnhancedAgentState) -> EnhancedAgentState:
        """Enhanced educator with memory and tool integration"""
        try:
            user_id = state["user_id"]
            message = state["messages"][-1]["content"] if state["messages"] else ""
            context = state["context"]
            tool_results = state["tool_results"]
            
            # Get educator agent
            educator = self.agents.get("educator")
            if not educator:
                logger.error("Educator agent not found")
                return state
            
            # Build enhanced context for educator
            enhanced_context = {
                **context,
                "tool_results": tool_results,
                "user_profile": state["user_profile"],
                "learning_progress": context.get("learning_context", {}),
                "knowledge_gaps": context.get("learning_context", {}).get("knowledge_gaps", [])
            }
            
            # Process with educator (include conversation history)
            conversation_history = state.get("context", {}).get("conversation_history", {})
            educator_context = {
                **enhanced_context,
                "conversation_history": conversation_history.get("recent_messages", []),
                "previous_messages": [msg["content"] for msg in state["messages"][-3:]]  # Last 3 messages
            }
            educator_response = await educator.process(
                message=message,
                user_id=user_id,
                learning_level=state.get("learning_level", 0),
                context=educator_context
            )
            response = {
                "message": educator_response,
                "suggestions": ["What is a blockchain?", "How do I buy my first crypto?", "What's the difference between Bitcoin and Ethereum?"],
                "learning_level": state.get("learning_level", 0)
            }
            
            # Update state with simplified response
            state["agent_responses"]["educator"] = {
                "message": response.get("message", ""),
                "suggestions": response.get("suggestions", []),
                "learning_level": response.get("learning_level", 0)
            }
            state["current_agent"] = "educator"
            state["completed_agents"].append("educator")
            
            logger.info(f"Enhanced educator processed message for user {user_id}")
            return state
            
        except Exception as e:
            logger.error(f"Error in enhanced educator: {e}")
            return state
    
    async def _enhanced_research_node(self, state: EnhancedAgentState) -> EnhancedAgentState:
        """Enhanced research agent with tool integration"""
        try:
            user_id = state["user_id"]
            message = state["messages"][-1]["content"] if state["messages"] else ""
            context = state["context"]
            tool_results = state["tool_results"]
            
            # Get research agent
            research = self.agents.get("research")
            if not research:
                logger.error("Research agent not found")
                return state
            
            # Build enhanced context for research
            enhanced_context = {
                **context,
                "tool_results": tool_results,
                "user_profile": state["user_profile"],
                "research_requirements": context.get("semantic_context", {})
            }
            
            # Process with research
            research_response = await research.process(
                message=message,
                user_id=user_id,
                learning_level=state.get("learning_level", 0),
                context=enhanced_context
            )
            response = {
                "message": research_response,
                "suggestions": ["What are the latest crypto trends?", "How is the market performing?", "What should I research next?"],
                "learning_level": state.get("learning_level", 0)
            }
            
            # Update state with simplified response
            state["agent_responses"]["research"] = {
                "message": response.get("message", ""),
                "suggestions": response.get("suggestions", []),
                "learning_level": response.get("learning_level", 0)
            }
            state["current_agent"] = "research"
            state["completed_agents"].append("research")
            
            logger.info(f"Enhanced research processed message for user {user_id}")
            return state
            
        except Exception as e:
            logger.error(f"Error in enhanced research: {e}")
            return state
    
    async def _enhanced_portfolio_node(self, state: EnhancedAgentState) -> EnhancedAgentState:
        """Enhanced portfolio agent with tool integration"""
        try:
            user_id = state["user_id"]
            message = state["messages"][-1]["content"] if state["messages"] else ""
            context = state["context"]
            tool_results = state["tool_results"]
            
            # Get portfolio agent
            portfolio = self.agents.get("portfolio")
            if not portfolio:
                logger.error("Portfolio agent not found")
                return state
            
            # Build enhanced context for portfolio
            enhanced_context = {
                **context,
                "tool_results": tool_results,
                "user_profile": state["user_profile"],
                "portfolio_state": context.get("user_profile", {}).get("portfolio_state", {})
            }
            
            # Process with portfolio
            portfolio_response = await portfolio.process(
                message=message,
                user_id=user_id,
                learning_level=state.get("learning_level", 0),
                context=enhanced_context
            )
            response = {
                "message": portfolio_response,
                "suggestions": ["How do I diversify my portfolio?", "What's a good risk management strategy?", "Should I invest in DeFi?"],
                "learning_level": state.get("learning_level", 0)
            }
            
            # Update state with simplified response
            state["agent_responses"]["portfolio"] = {
                "message": response.get("message", ""),
                "suggestions": response.get("suggestions", []),
                "learning_level": response.get("learning_level", 0)
            }
            state["current_agent"] = "portfolio"
            state["completed_agents"].append("portfolio")
            
            logger.info(f"Enhanced portfolio processed message for user {user_id}")
            return state
            
        except Exception as e:
            logger.error(f"Error in enhanced portfolio: {e}")
            return state
    
    async def _enhanced_trading_strategy_node(self, state: EnhancedAgentState) -> EnhancedAgentState:
        """Enhanced trading strategy agent with tool integration"""
        try:
            user_id = state["user_id"]
            message = state["messages"][-1]["content"] if state["messages"] else ""
            context = state["context"]
            tool_results = state["tool_results"]
            
            # Get trading strategy agent
            trading_strategy = self.agents.get("trading_strategy")
            if not trading_strategy:
                logger.error("Trading strategy agent not found")
                return state
            
            # Build enhanced context for trading strategy
            enhanced_context = {
                **context,
                "tool_results": tool_results,
                "user_profile": state["user_profile"],
                "market_context": context.get("semantic_context", {})
            }
            
            # Process with trading strategy
            trading_response = await trading_strategy.process(
                message=message,
                user_id=user_id,
                learning_level=state.get("learning_level", 0),
                context=enhanced_context
            )
            response = {
                "message": trading_response,
                "suggestions": ["What's a good trading strategy?", "How do I read market charts?", "What are the risks of day trading?"],
                "learning_level": state.get("learning_level", 0)
            }
            
            # Update state with simplified response
            state["agent_responses"]["trading_strategy"] = {
                "message": response.get("message", ""),
                "suggestions": response.get("suggestions", []),
                "learning_level": response.get("learning_level", 0)
            }
            state["current_agent"] = "trading_strategy"
            state["completed_agents"].append("trading_strategy")
            
            logger.info(f"Enhanced trading strategy processed message for user {user_id}")
            return state
            
        except Exception as e:
            logger.error(f"Error in enhanced trading strategy: {e}")
            return state
    
    async def _enhanced_web_search_node(self, state: EnhancedAgentState) -> EnhancedAgentState:
        """Enhanced web search agent with tool integration"""
        try:
            user_id = state["user_id"]
            message = state["messages"][-1]["content"] if state["messages"] else ""
            context = state["context"]
            tool_results = state["tool_results"]
            
            # Get web search agent
            web_search = self.agents.get("web_search")
            if not web_search:
                logger.error("Web search agent not found")
                return state
            
            # Build enhanced context for web search
            enhanced_context = {
                **context,
                "tool_results": tool_results,
                "user_profile": state["user_profile"],
                "search_requirements": context.get("semantic_context", {})
            }
            
            # Process with web search
            web_search_response = await web_search.process(
                message=message,
                user_id=user_id,
                learning_level=state.get("learning_level", 0),
                context=enhanced_context
            )
            response = {
                "message": web_search_response,
                "suggestions": ["What's the latest crypto news?", "How do I stay updated on crypto?", "What are reliable sources?"],
                "learning_level": state.get("learning_level", 0)
            }
            
            # Update state with simplified response
            state["agent_responses"]["web_search"] = {
                "message": response.get("message", ""),
                "suggestions": response.get("suggestions", []),
                "learning_level": response.get("learning_level", 0)
            }
            state["current_agent"] = "web_search"
            state["completed_agents"].append("web_search")
            
            logger.info(f"Enhanced web search processed message for user {user_id}")
            return state
            
        except Exception as e:
            logger.error(f"Error in enhanced web search: {e}")
            return state
    
    async def _enhanced_social_sentiment_node(self, state: EnhancedAgentState) -> EnhancedAgentState:
        """Enhanced social sentiment agent with tool integration"""
        try:
            user_id = state["user_id"]
            message = state["messages"][-1]["content"] if state["messages"] else ""
            context = state["context"]
            tool_results = state["tool_results"]
            
            # Get social sentiment agent
            social_sentiment = self.agents.get("social_sentiment")
            if not social_sentiment:
                logger.error("Social sentiment agent not found")
                return state
            
            # Build enhanced context for social sentiment
            enhanced_context = {
                **context,
                "tool_results": tool_results,
                "user_profile": state["user_profile"],
                "social_requirements": context.get("semantic_context", {})
            }
            
            # Process with social sentiment
            social_sentiment_response = await social_sentiment.process(
                message=message,
                user_id=user_id,
                learning_level=state.get("learning_level", 0),
                context=enhanced_context
            )
            response = {
                "message": social_sentiment_response,
                "suggestions": ["What's the latest social sentiment?", "How is the community reacting?", "What are the trending topics?"],
                "learning_level": state.get("learning_level", 0)
            }
            
            # Update state with simplified response
            state["agent_responses"]["social_sentiment"] = {
                "message": response.get("message", ""),
                "suggestions": response.get("suggestions", []),
                "learning_level": response.get("learning_level", 0)
            }
            state["current_agent"] = "social_sentiment"
            state["completed_agents"].append("social_sentiment")
            
            logger.info(f"Enhanced social sentiment processed message for user {user_id}")
            return state
            
        except Exception as e:
            logger.error(f"Error in enhanced social sentiment: {e}")
            return state
    
    async def _enhanced_synthesizer_node(self, state: EnhancedAgentState) -> EnhancedAgentState:
        """Enhanced synthesizer with memory and context awareness"""
        try:
            user_id = state["user_id"]
            agent_responses = state["agent_responses"]
            context = state["context"]
            tool_results = state["tool_results"]
            
            # Use coordinator as synthesizer
            synthesizer = self.agents.get("coordinator")
            if not synthesizer:
                logger.error("Coordinator agent not found for synthesis")
                return state
            
            # Build comprehensive context for synthesis
            synthesis_context = {
                **context,
                "agent_responses": agent_responses,
                "tool_results": tool_results,
                "user_profile": state["user_profile"],
                "emotional_context": state["emotional_context"],
                "learning_objectives": state.get("learning_objectives", [])
            }
            
            # Synthesize final response using coordinator
            synthesis_message = f"Please synthesize a final response based on the agent outputs: {agent_responses}"
            final_response = await synthesizer.process_message(
                message=synthesis_message,
                user_id=user_id,
                context=synthesis_context
            )
            
            # Update state
            state["final_response"] = final_response.get("message", "")
            state["suggestions"] = final_response.get("suggestions", [])
            state["synthesis_ready"] = True
            
            logger.info(f"Enhanced synthesizer completed for user {user_id}")
            return state
            
        except Exception as e:
            logger.error(f"Error in enhanced synthesizer: {e}")
            return state
    
    async def _memory_updater_node(self, state: EnhancedAgentState) -> EnhancedAgentState:
        """Update memory with the interaction"""
        try:
            user_id = state["user_id"]
            message = state["messages"][-1]["content"] if state["messages"] else ""
            final_response = state["final_response"]
            context = state["context"]
            
            # Store conversation context using existing memory manager
            try:
                await self.memory_manager.store_interaction(
                    user_id=user_id,
                    message=message,
                    response=final_response or "",
                    context={
                        "session_id": state["session_id"],
                        "agent_responses": state.get("agent_responses", {}),
                        "learning_level": state.get("learning_level", 0)
                    },
                    session_id=state["session_id"],
                    intent="education",
                    agent_used="enhanced_orchestrator",
                    importance_score=0.5
                )
                logger.info(f"Stored interaction in memory for user {user_id} with {len(final_response or '')} chars response")
                logger.info(f"Conversation context stored for user {user_id}")
            except Exception as e:
                logger.warning(f"Failed to store conversation context: {e}")
                # Fallback to simple logging
                logger.info(f"Would store conversation for user {user_id}")
            
            logger.info(f"Memory updated for user {user_id}")
            return state
            
        except Exception as e:
            logger.error(f"Error in memory updater: {e}")
            return state
    
    async def process_message(
        self,
        message: str,
        user_id: str,
        session_id: Optional[str] = None,
        message_id: Optional[str] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """Process a message with full agentic capabilities (non-streaming)"""
        try:
            # Create initial state
            initial_state = {
                "messages": [{"role": "user", "content": message, "timestamp": datetime.now().isoformat()}],
                "user_id": user_id,
                "learning_level": 0,  # Will be updated by context analyzer
                "context": {},
                "session_id": session_id or user_id,
                "turn_count": 0,
                "short_term_memory": [],
                "relevant_episodes": [],
                "user_profile": {},
                "semantic_context": [],
                "tool_calls": [],
                "tool_results": [],
                "pending_tool_calls": [],
                "available_tools": [],
                "intent_stack": [],
                "confidence_scores": {},
                "required_agents": [],
                "completed_agents": [],
                "current_agent": None,
                "agent_responses": {},
                "final_response": None,
                "suggestions": [],
                "needs_clarification": False,
                "synthesis_ready": False,
                "emotional_context": {},
                "learning_objectives": []
            }
            
            # Invoke the enhanced graph
            try:
                final_state = await self.graph.ainvoke(initial_state)
            except Exception as e:
                logger.error(f"Error in graph execution: {e}")
                # Return a simple fallback response
                return {
                    "message": "I'm having trouble processing your request right now. Please try again.",
                    "suggestions": ["Try asking a simpler question", "Check your internet connection"],
                    "learning_level": 0,
                    "error": str(e)
                }
            
            # Clean the final state to avoid circular references
            cleaned_state = self._clean_state_for_serialization(final_state)
            
            # Return response
            return {
                "message": cleaned_state.get("final_response", ""),
                "suggestions": cleaned_state.get("suggestions", []),
                "learning_level": cleaned_state.get("learning_level", 0),
                "context": cleaned_state.get("context", {}),
                "tools_used": [result.get("tool") for result in cleaned_state.get("tool_results", [])],
                "agents_used": cleaned_state.get("completed_agents", []),
                "emotional_context": cleaned_state.get("emotional_context", {}),
                "learning_objectives": cleaned_state.get("learning_objectives", []),
                "messageId": message_id  # Return the original message ID
            }
            
        except Exception as e:
            logger.error(f"Error processing message: {e}")
            return {
                "message": "I'm having trouble processing your request right now. Please try again.",
                "suggestions": ["Try asking a simpler question", "Check your internet connection"],
                "learning_level": 0,
                "error": str(e),
                "messageId": message_id  # Return the original message ID even on error
            }
    
    async def process_message_stream(
        self,
        message: str,
        user_id: str,
        session_id: Optional[str] = None,
        message_id: Optional[str] = None,
        **kwargs
    ):
        """
        Process a message with streaming response and agent status updates
        
        Yields:
            Dict with 'type' and data:
            - {'type': 'status', 'agent': 'coordinator', 'message': 'Analyzing your question...'}
            - {'type': 'chunk', 'content': 'char'} - Character chunk
            - {'type': 'complete', 'suggestions': [...], 'learning_level': 0, 'messageId': '...'}
            - {'type': 'error', 'message': '...'}
        """
        try:
            # Emit initial status
            yield {"type": "status", "agent": "coordinator", "message": "Analyzing your question..."}
            
            # Get coordinator for quick intent detection
            coordinator = self.agents.get("coordinator")
            if not coordinator:
                yield {"type": "error", "message": "System not ready. Please try again."}
                return
            
            # Build simple context for intent analysis
            context = {
                "user_id": user_id,
                "query": message,
                "timestamp": datetime.now().isoformat()
            }
            
            # Analyze intent (quick)
            yield {"type": "status", "agent": "coordinator", "message": "Understanding your request..."}
            intent = await coordinator.analyze_intent(message, context)
            
            # Check if this is token analysis with token_data in context
            token_data = kwargs.get('token_data') or context.get('token_data')
            if intent == "token_analysis" and token_data:
                # Use multi-agent synthesis for comprehensive token analysis
                yield {"type": "status", "agent": "coordinator", "message": "Initiating comprehensive token analysis..."}
                
                # Build enhanced context with token data
                enhanced_context = {
                    **context,
                    "token_data": token_data,
                    "conversation_history": {},
                    "previous_messages": [],
                    "recent_messages": []
                }
                
                # Call coordinator's comprehensive analysis method
                learning_level = kwargs.get("learning_level", 0)
                final_analysis = await coordinator.analyze_token_comprehensive(
                    message=message,
                    user_id=user_id,
                    learning_level=learning_level,
                    context=enhanced_context
                )
                
                # Stream the comprehensive analysis
                yield {"type": "chunk", "content": final_analysis}
                
                # Generate context-aware suggestions based on analysis
                suggestions = await coordinator._generate_suggestions(
                    intent="token_analysis",
                    learning_level=learning_level,
                    context={
                        **enhanced_context,
                        "analysis_complete": True,
                        "token_data": token_data
                    }
                )
                
                # Emit complete signal with metadata
                yield {
                    "type": "complete",
                    "suggestions": suggestions,
                    "learning_level": learning_level,
                    "messageId": message_id
                }
                
            else:
                # Single agent routing for non-token analysis
                agent_name = self._get_agent_from_intent(intent)
                yield {"type": "status", "agent": "coordinator", "message": f"Routing to {agent_name} agent..."}
                
                # Get the specialist agent
                specialist_agent = self.agents.get(agent_name.split()[0].lower())  # Extract first word (educator, research, etc.)
                if not specialist_agent:
                    specialist_agent = self.agents.get("educator")  # Fallback to educator
                
                # Emit agent-specific status
                agent_status_messages = {
                    "educator": "Preparing explanation...",
                    "research": "Fetching token data...",
                    "portfolio": "Calculating portfolio metrics...",
                    "trading_strategy": "Analyzing trading strategy...",
                    "web_search": "Searching latest crypto news...",
                    "social_sentiment": "Analyzing social sentiment..."
                }
                
                agent_key = agent_name.split()[0].lower()
                status_msg = agent_status_messages.get(agent_key, "Processing...")
                yield {"type": "status", "agent": agent_key, "message": status_msg}
                
                # Build enhanced context with conversation history
                enhanced_context = {
                    **context,
                    "conversation_history": {},
                    "previous_messages": [],
                    "recent_messages": []
                }
                
                # Process message through specialist agent
                learning_level = kwargs.get("learning_level", 0)
                
                # Check if it's the educator agent and use streaming
                if hasattr(specialist_agent, "process_stream"):
                    # Agent supports streaming - yield chunks directly
                    async for chunk in specialist_agent.process_stream(
                        message=message,
                        user_id=user_id,
                        learning_level=learning_level,
                        context=enhanced_context
                    ):
                        yield chunk
                else:
                    # Agent doesn't support streaming, use regular method and stream the result
                    response = await specialist_agent.process(
                        message=message,
                        user_id=user_id,
                        learning_level=learning_level,
                        context=enhanced_context
                    )
                    
                    # Stream the response as-is (don't break into characters)
                    if isinstance(response, str):
                        yield {"type": "chunk", "content": response}
                    elif isinstance(response, dict):
                        response_text = response.get("message", "")
                        yield {"type": "chunk", "content": response_text}
                
                # Generate suggestions based on intent
                suggestions = await coordinator._generate_suggestions(intent, learning_level, context)
                
                # Emit complete signal with metadata
                yield {
                    "type": "complete",
                    "suggestions": suggestions,
                    "learning_level": learning_level,
                    "messageId": message_id
                }
            
        except Exception as e:
            logger.error(f"Error in streaming processing: {e}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            yield {"type": "error", "message": str(e)}
    
    def _clean_state_for_serialization(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """Clean state to avoid circular references during serialization"""
        try:
            cleaned = {}
            for key, value in state.items():
                if isinstance(value, (str, int, float, bool, type(None))):
                    cleaned[key] = value
                elif isinstance(value, list):
                    cleaned[key] = [self._clean_value_for_serialization(item) for item in value]
                elif isinstance(value, dict):
                    cleaned[key] = {k: self._clean_value_for_serialization(v) for k, v in value.items()}
                else:
                    # Convert complex objects to strings
                    cleaned[key] = str(value)
            return cleaned
        except Exception as e:
            logger.error(f"Error cleaning state: {e}")
            return {"error": str(e)}
    
    def _clean_value_for_serialization(self, value: Any) -> Any:
        """Clean a single value for serialization"""
        try:
            if isinstance(value, (str, int, float, bool, type(None))):
                return value
            elif isinstance(value, list):
                return [self._clean_value_for_serialization(item) for item in value]
            elif isinstance(value, dict):
                return {k: self._clean_value_for_serialization(v) for k, v in value.items()}
            else:
                return str(value)
        except Exception:
            return str(value)
    
    # Helper methods
    async def _register_all_tools(self):
        """Register all available tools"""
        try:
            # Import tool classes
            from .tools.blockchain_tools import BlockchainTools
            from .tools.educational_tools import EducationalTools
            from .tools.register_social_tools import register_social_sentiment_tools
            
            # Initialize tool instances
            blockchain_tools = BlockchainTools(
                bitquery_service=self.tools.get("bitquery"),
                base_client=self.tools.get("base_client")
            )
            
            educational_tools = EducationalTools(
                educational_service=self.tools.get("educational"),
                progress_service=self.tools.get("progress")
            )
            
            # Register blockchain tools
            for tool_def in blockchain_tools.get_tool_definitions():
                from .tools.tool_registry import ToolDefinition
                tool = ToolDefinition(
                    name=tool_def["name"],
                    description=tool_def["description"],
                    parameters=tool_def["parameters"],
                    function=getattr(blockchain_tools, tool_def["name"]),
                    category=tool_def["category"],
                    requires_auth=tool_def["requires_auth"]
                )
                self.tool_registry.register_tool(tool)
            
            # Register educational tools
            for tool_def in educational_tools.get_tool_definitions():
                from .tools.tool_registry import ToolDefinition
                tool = ToolDefinition(
                    name=tool_def["name"],
                    description=tool_def["description"],
                    parameters=tool_def["parameters"],
                    function=getattr(educational_tools, tool_def["name"]),
                    category=tool_def["category"],
                    requires_auth=tool_def["requires_auth"]
                )
                self.tool_registry.register_tool(tool)
            
            # Register social sentiment tools
            sentiment_service = self.tools.get("sentiment")
            if sentiment_service:
                success = register_social_sentiment_tools(self.tool_registry, sentiment_service)
                if success:
                    logger.info("Social sentiment tools registered successfully")
                else:
                    logger.warning("Some social sentiment tools failed to register")
            else:
                logger.warning("Sentiment service not available for social sentiment tools")
            
            logger.info("All tools registered successfully")
            
        except Exception as e:
            logger.error(f"Error registering tools: {e}")
    
    async def _analyze_intent_with_context(
        self, 
        message: str, 
        context: Dict[str, Any], 
        user_state: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Analyze intent with enhanced context awareness"""
        try:
            # PRIORITY 1: Check if context explicitly provides intent
            if context and context.get('intent'):
                explicit_intent = context['intent']
                logger.info(f"Using explicit intent from context: {explicit_intent}")
                
                # Map explicit intents to required agents
                agent_mapping = {
                    "social_sentiment": ["social_sentiment"],
                    "token_analysis": ["research", "web_search", "social_sentiment", "trading_strategy"],
                    "trading_strategy": ["trading_strategy"],
                    "portfolio": ["portfolio"],
                    "research": ["research"],
                    "web_search": ["web_search"],
                    "education": ["educator"]
                }
                
                required_agents = agent_mapping.get(explicit_intent, ["educator"])
                
                return {
                    "intents": [explicit_intent],
                    "confidence_scores": {explicit_intent: 1.0},
                    "required_agents": required_agents,
                    "needs_clarification": False,
                    "primary_topic": explicit_intent,
                    "engagement_level": "high" if len(required_agents) > 1 else "medium"
                }
            
            # PRIORITY 2: Keyword detection (existing logic)
            message_lower = message.lower()
            
            # Determine intent based on keywords and context
            intents = []
            confidence_scores = {}
            required_agents = []
            
            # Social sentiment detection
            if any(word in message_lower for word in ["social", "sentiment", "reddit", "farcaster", "community buzz", "trending", "social media", "community", "hype", "fomo", "fud"]):
                intents.append("social_sentiment")
                confidence_scores["social_sentiment"] = 0.9
                required_agents.append("social_sentiment")
            
            # Token analysis detection
            elif any(word in message_lower for word in ["analyze", "analysis", "research this", "tell me about"]) and context and context.get('token_data'):
                intents.append("token_analysis")
                confidence_scores["token_analysis"] = 0.9
                required_agents.extend(["research", "web_search", "social_sentiment", "trading_strategy"])
            
            # Trading strategy detection
            elif any(word in message_lower for word in ["trade", "trading", "buy", "sell", "long", "short", "scalp", "swing"]):
                intents.append("trading_strategy")
                confidence_scores["trading_strategy"] = 0.8
                required_agents.append("trading_strategy")
            
            # Portfolio detection
            elif any(word in message_lower for word in ["portfolio", "simulate", "virtual", "practice", "balance"]):
                intents.append("portfolio")
                confidence_scores["portfolio"] = 0.8
                required_agents.append("portfolio")
            
            # Research detection
            elif any(word in message_lower for word in ["token", "price", "liquidity", "volume", "market cap", "dex"]):
                intents.append("research")
                confidence_scores["research"] = 0.8
                required_agents.append("research")
            
            # Web search detection
            elif any(word in message_lower for word in ["news", "latest", "recent", "today", "current", "happening"]):
                intents.append("web_search")
                confidence_scores["web_search"] = 0.8
                required_agents.append("web_search")
            
            # Default to education
            else:
                intents.append("education")
                confidence_scores["education"] = 0.8
                required_agents.append("educator")
            
            return {
                "intents": intents,
                "confidence_scores": confidence_scores,
                "required_agents": required_agents,
                "needs_clarification": False,
                "primary_topic": intents[0] if intents else "general",
                "engagement_level": "high" if len(required_agents) > 1 else "medium"
            }
            
        except Exception as e:
            logger.error(f"Error analyzing intent: {e}")
            return {
                "intents": ["education"],
                "confidence_scores": {"education": 0.5},
                "required_agents": ["educator"],
                "needs_clarification": False,
                "primary_topic": "general",
                "engagement_level": "medium"
            }
    
    async def _plan_required_tools(
        self, 
        intents: List[str], 
        context: Dict[str, Any], 
        user_id: str
    ) -> Dict[str, Any]:
        """Plan which tools are required for the interaction"""
        try:
            required_tools = {
                "categories": [],
                "tool_calls": []
            }
            
            # Determine tools based on intents
            for intent in intents:
                if intent in ["research", "web_search"]:
                    required_tools["categories"].extend(["web_search", "blockchain"])
                elif intent in ["portfolio", "trading"]:
                    required_tools["categories"].extend(["blockchain", "portfolio"])
                elif intent in ["social_sentiment"]:
                    required_tools["categories"].extend(["social_sentiment"])
                elif intent in ["education"]:
                    required_tools["categories"].extend(["educational"])
            
            return required_tools
            
        except Exception as e:
            logger.error(f"Error planning tools: {e}")
            return {"categories": [], "tool_calls": []}
    
    def _route_after_tool_planning(self, state: EnhancedAgentState) -> str:
        """Route after tool planning"""
        if state["pending_tool_calls"]:
            return "execute_tools"
        else:
            return "route_to_agents"
    
    def _enhanced_route_to_agents(self, state: EnhancedAgentState) -> str:
        """Enhanced routing logic"""
        try:
            # Check if all required agents have responded
            if set(state["required_agents"]) == set(state["completed_agents"]):
                return "synthesizer"
            
            # Route to next required agent
            for agent in state["required_agents"]:
                if agent not in state["completed_agents"]:
                    return agent
            
            return "synthesizer"
            
        except Exception as e:
            logger.error(f"Error in enhanced routing: {e}")
            return "synthesizer"
    
    def _calculate_importance_score(self, state: EnhancedAgentState) -> float:
        """Calculate importance score for memory storage"""
        try:
            score = 0.5  # Base score
            
            # Increase score for tool usage
            if state.get("tool_results"):
                score += 0.2
            
            # Increase score for multiple agents
            if len(state.get("completed_agents", [])) > 1:
                score += 0.1
            
            # Increase score for emotional context
            emotional_context = state.get("emotional_context", {})
            if emotional_context.get("current_emotional_state") in ["excited", "frustrated", "confused"]:
                score += 0.2
            
            return min(1.0, score)
            
        except Exception as e:
            logger.error(f"Error calculating importance score: {e}")
            return 0.5
    
    def _assess_engagement_level(self, state: EnhancedAgentState) -> str:
        """Assess user engagement level"""
        try:
            # Check for high engagement indicators
            if state.get("tool_results"):
                return "high"
            
            if len(state.get("completed_agents", [])) > 2:
                return "high"
            
            return "medium"
            
        except Exception as e:
            logger.error(f"Error assessing engagement: {e}")
            return "medium"
    
    def _assess_learning_velocity(self, state: EnhancedAgentState) -> str:
        """Assess learning velocity"""
        try:
            # This would analyze user's learning patterns
            return "medium"
            
        except Exception as e:
            logger.error(f"Error assessing learning velocity: {e}")
            return "medium"
    
    def _get_agent_from_intent(self, intent: str) -> str:
        """Map intent to agent name"""
        intent_to_agent = {
            "education": "educator",
            "research": "research",
            "portfolio": "portfolio",
            "trading_strategy": "trading strategy",
            "web_search": "web search"
        }
        return intent_to_agent.get(intent, "educator")
