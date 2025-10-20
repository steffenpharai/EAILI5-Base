"""
LangGraph Orchestrator - Multi-agent AI coordination
Part of the DeCrypt backend services
"""

import asyncio
from typing import Dict, List, Any, Optional, TypedDict, Annotated
import logging
from datetime import datetime
from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolExecutor
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage

logger = logging.getLogger(__name__)

class AgentState(TypedDict):
    """State for the multi-agent system"""
    messages: List[BaseMessage]
    user_id: str
    learning_level: int
    context: Dict[str, Any]
    current_agent: Optional[str]
    agent_responses: Dict[str, Any]
    final_response: Optional[str]
    suggestions: List[str]
    intent: str
    routed_agent: Optional[str]

class LangGraphOrchestrator:
    """
    LangGraph-based orchestrator for multi-agent AI system
    """
    
    def __init__(self):
        self.graph = None
        self.agents = {}
        self.tools = {}
        
    async def initialize(self, agents: Dict[str, Any], tools: Dict[str, Any]):
        """Initialize the LangGraph orchestrator"""
        try:
            self.agents = agents
            self.tools = tools
            
            # Create the state graph
            workflow = self._create_graph()
            logger.info(f"Created workflow: {workflow}")
            
            # The workflow is already compiled in newer versions of LangGraph
            self.graph = workflow
            logger.info(f"Graph ready: {self.graph}")
            
            logger.info("LangGraph orchestrator initialized successfully")
            
        except Exception as e:
            logger.error(f"Error initializing LangGraph orchestrator: {e}")
            raise
    
    def _create_graph(self) -> StateGraph:
        """Create the LangGraph state graph"""
        
        # Define the graph
        workflow = StateGraph(AgentState)
        
        # Add nodes for each agent
        workflow.add_node("coordinator", self._coordinator_node)
        workflow.add_node("research", self._research_node)
        workflow.add_node("educator", self._educator_node)
        workflow.add_node("portfolio", self._portfolio_node)
        workflow.add_node("trading_strategy", self._trading_strategy_node)
        workflow.add_node("web_search", self._web_search_node)
        workflow.add_node("synthesizer", self._synthesizer_node)
        
        # Define the flow
        workflow.set_entry_point("coordinator")
        
        # Coordinator routes to appropriate agents
        workflow.add_conditional_edges(
            "coordinator",
            self._route_to_agents,
            {
                "research": "research",
                "educator": "educator", 
                "portfolio": "portfolio",
                "trading_strategy": "trading_strategy",
                "web_search": "web_search",
                "synthesizer": "synthesizer"
            }
        )
        
        # All agents route to synthesizer
        workflow.add_edge("research", "synthesizer")
        workflow.add_edge("educator", "synthesizer")
        workflow.add_edge("portfolio", "synthesizer")
        workflow.add_edge("trading_strategy", "synthesizer")
        workflow.add_edge("web_search", "synthesizer")
        
        # Synthesizer is the end
        workflow.add_edge("synthesizer", END)
        
        return workflow.compile()
    
    async def _coordinator_node(self, state: AgentState) -> AgentState:
        """Coordinator node - analyzes intent and routes"""
        try:
            messages = state["messages"]
            user_id = state["user_id"]
            learning_level = state["learning_level"]
            context = state["context"]
            
            # Get the latest user message
            user_message = messages[-1].content if messages else ""
            
            # Analyze intent using coordinator agent
            coordinator_agent = self.agents.get("coordinator")
            if coordinator_agent:
                intent = await coordinator_agent.analyze_intent(user_message, context)
                state["intent"] = intent
                state["current_agent"] = intent
            else:
                state["intent"] = "educator"  # Default to educator
                state["current_agent"] = "educator"
            
            return state
            
        except Exception as e:
            logger.error(f"Error in coordinator node: {e}")
            state["current_agent"] = "educator"
            return state
    
    async def _research_node(self, state: AgentState) -> AgentState:
        """Research agent node"""
        try:
            research_agent = self.agents.get("research")
            if research_agent:
                response = await research_agent.process(
                    message=state["messages"][-1].content,
                    user_id=state["user_id"],
                    learning_level=state["learning_level"],
                    context=state["context"]
                )
                state["agent_responses"]["research"] = response
            
            return state
            
        except Exception as e:
            logger.error(f"Error in research node: {e}")
            return state
    
    async def _educator_node(self, state: AgentState) -> AgentState:
        """Educator agent node"""
        try:
            logger.info(f"Educator node - processing message: '{state['messages'][-1].content}'")
            educator_agent = self.agents.get("educator")
            logger.info(f"Educator node - agent available: {educator_agent is not None}")
            
            if educator_agent:
                logger.info("Educator node - calling educator agent process method")
                response = await educator_agent.process(
                    message=state["messages"][-1].content,
                    user_id=state["user_id"],
                    learning_level=state["learning_level"],
                    context=state["context"]
                )
                logger.info(f"Educator node - received response: '{response}'")
                logger.info(f"Educator node - response length: {len(response) if response else 0}")
                state["agent_responses"]["educator"] = response
            else:
                logger.error("Educator node - educator agent not available")
            
            return state
            
        except Exception as e:
            logger.error(f"Error in educator node: {e}")
            import traceback
            logger.error(f"Educator node traceback: {traceback.format_exc()}")
            return state
    
    async def _portfolio_node(self, state: AgentState) -> AgentState:
        """Portfolio agent node"""
        try:
            portfolio_agent = self.agents.get("portfolio")
            if portfolio_agent:
                response = await portfolio_agent.process(
                    message=state["messages"][-1].content,
                    user_id=state["user_id"],
                    learning_level=state["learning_level"],
                    context=state["context"]
                )
                state["agent_responses"]["portfolio"] = response
            
            return state
            
        except Exception as e:
            logger.error(f"Error in portfolio node: {e}")
            return state
    
    async def _trading_strategy_node(self, state: AgentState) -> AgentState:
        """Trading strategy agent node"""
        try:
            trading_agent = self.agents.get("trading_strategy")
            if trading_agent:
                response = await trading_agent.process(
                    message=state["messages"][-1].content,
                    user_id=state["user_id"],
                    learning_level=state["learning_level"],
                    context=state["context"]
                )
                state["agent_responses"]["trading_strategy"] = response
            
            return state
            
        except Exception as e:
            logger.error(f"Error in trading strategy node: {e}")
            return state
    
    async def _web_search_node(self, state: AgentState) -> AgentState:
        """Web search agent node"""
        try:
            web_search_agent = self.agents.get("web_search")
            if web_search_agent:
                response = await web_search_agent.process(
                    message=state["messages"][-1].content,
                    user_id=state["user_id"],
                    learning_level=state["learning_level"],
                    context=state["context"]
                )
                state["agent_responses"]["web_search"] = response
            
            return state
            
        except Exception as e:
            logger.error(f"Error in web search node: {e}")
            return state
    
    async def _synthesizer_node(self, state: AgentState) -> AgentState:
        """Synthesizer node - combines agent responses"""
        try:
            agent_responses = state["agent_responses"]
            intent = state["intent"]
            
            logger.info(f"Synthesizer node - agent_responses: {agent_responses}")
            logger.info(f"Synthesizer node - intent: {intent}")
            logger.info(f"Synthesizer node - routed_agent: {state.get('routed_agent', 'educator')}")
            
            # Use the routed agent name instead of the original intent
            routed_agent = state.get("routed_agent", "educator")
            primary_response = agent_responses.get(routed_agent, "")
            
            logger.info(f"Synthesizer node - routed_agent: {routed_agent}")
            logger.info(f"Synthesizer node - agent_responses keys: {list(agent_responses.keys())}")
            logger.info(f"Synthesizer node - primary_response: '{primary_response}'")
            logger.info(f"Synthesizer node - primary_response length: {len(primary_response)}")
            logger.info(f"Synthesizer node - primary_response type: {type(primary_response)}")
            
            # If we have multiple responses, synthesize them
            if len(agent_responses) > 1:
                # Use OpenAI to synthesize multiple responses
                synthesis_prompt = f"""
                You are EAILI5, an AI teacher. You have received responses from multiple specialist agents.
                Please synthesize these responses into a coherent, educational response.
                
                Intent: {intent}
                Primary Response: {primary_response}
                
                Additional Responses:
                {self._format_agent_responses(agent_responses)}
                
                Please provide a comprehensive, educational response that combines the best insights from all agents.
                """
                
                # Use OpenAI to synthesize
                openai_service = self.agents.get("openai")
                if openai_service:
                    synthesized = await openai_service.generate_response([
                        {"role": "user", "content": synthesis_prompt}
                    ])
                    state["final_response"] = synthesized.get("content", primary_response)
                else:
                    state["final_response"] = primary_response
            else:
                state["final_response"] = primary_response
            
            # Generate suggestions based on intent and learning level
            state["suggestions"] = await self._generate_suggestions(intent, state["learning_level"])
            
            logger.info(f"Synthesizer node - final_response set to: '{state['final_response']}'")
            logger.info(f"Synthesizer node - final_response length: {len(state['final_response']) if state['final_response'] else 0}")
            logger.info(f"Synthesizer node - suggestions: {state['suggestions']}")
            
            return state
            
        except Exception as e:
            logger.error(f"Error in synthesizer node: {e}")
            state["final_response"] = "I'm sorry, I encountered an issue processing your request."
            return state
    
    def _route_to_agents(self, state: AgentState) -> str:
        """Route to appropriate agents based on intent"""
        intent = state.get("intent", "educator")
        
        # Map coordinator intents to node names
        intent_mapping = {
            "education": "educator",
            "research": "research", 
            "portfolio": "portfolio",
            "trading_strategy": "trading_strategy",
            "web_search": "web_search"
        }
        
        # Get the correct node name
        node_name = intent_mapping.get(intent, "educator")
        
        # Store the routed agent name in state for synthesizer
        state["routed_agent"] = node_name
        
        # Route to specific agent
        if node_name in ["research", "educator", "portfolio", "trading_strategy", "web_search"]:
            return node_name
        
        # Default to educator
        return "educator"
    
    def _format_agent_responses(self, responses: Dict[str, Any]) -> str:
        """Format agent responses for synthesis"""
        formatted = []
        for agent, response in responses.items():
            formatted.append(f"{agent.upper()}: {response}")
        return "\n".join(formatted)
    
    async def _generate_suggestions(self, intent: str, learning_level: int) -> List[str]:
        """Generate follow-up suggestions"""
        suggestions = []
        
        if intent == "education":
            if learning_level < 20:
                suggestions = [
                    "What is a blockchain?",
                    "How do I buy my first crypto?",
                    "What's the difference between Bitcoin and Ethereum?"
                ]
            elif learning_level < 50:
                suggestions = [
                    "Explain DeFi to me",
                    "What are liquidity pools?",
                    "How do decentralized exchanges work?"
                ]
            else:
                suggestions = [
                    "Advanced trading strategies",
                    "Risk management techniques",
                    "Technical analysis indicators"
                ]
        
        elif intent == "research":
            suggestions = [
                "What should I look for in a token?",
                "How do I check if a token is safe?",
                "What's market cap and why does it matter?"
            ]
        
        elif intent == "portfolio":
            suggestions = [
                "How do I diversify my portfolio?",
                "What's position sizing?",
                "How do I track my performance?"
            ]
        
        elif intent == "trading_strategy":
            suggestions = [
                "What's the difference between long and short positions?",
                "How do I manage risk when trading?",
                "Explain day trading vs swing trading"
            ]
        
        elif intent == "web_search":
            suggestions = [
                "What's the latest crypto news?",
                "What are the current market trends?",
                "What's happening with Base ecosystem?"
            ]
        
        return suggestions[:3]  # Limit to 3 suggestions
    
    async def process_message(
        self,
        message: str,
        user_id: str,
        learning_level: int = 0,
        context: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """
        Process a message through the multi-agent system
        """
        try:
            logger.info(f"LangGraph orchestrator processing message: '{message}' for user {user_id}")
            logger.info(f"Learning level: {learning_level}, Context: {context}")
            
            # Create initial state
            initial_state = AgentState(
                messages=[HumanMessage(content=message)],
                user_id=user_id,
                learning_level=learning_level,
                context=context or {},
                current_agent=None,
                agent_responses={},
                final_response=None,
                suggestions=[],
                intent="",
                routed_agent=None
            )
            logger.info(f"Created initial state: {initial_state}")
            
            # Run the graph
            logger.info("Invoking LangGraph...")
            if self.graph is None:
                logger.error("Graph is None! Orchestrator not properly initialized.")
                raise Exception("Graph is None - orchestrator not initialized")
            
            final_state = await self.graph.ainvoke(initial_state)
            logger.info(f"LangGraph completed. Final state: {final_state}")
            logger.info(f"Final state final_response: '{final_state.get('final_response', '')}'")
            logger.info(f"Final state agent_responses: {final_state.get('agent_responses', {})}")
            
            result = {
                "message": final_state["final_response"],
                "suggestions": final_state["suggestions"],
                "learning_level": learning_level,
                "intent": final_state["intent"],
                "timestamp": datetime.now().isoformat()
            }
            logger.info(f"Returning result: {result}")
            return result
            
        except Exception as e:
            logger.error(f"Error processing message: {e}")
            logger.error(f"Error type: {type(e)}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            return {
                "message": "I'm sorry, I encountered an issue processing your question. Could you try rephrasing it?",
                "suggestions": ["What is cryptocurrency?", "How do I start learning?", "Explain trading basics"],
                "learning_level": learning_level,
                "intent": "educator",
                "timestamp": datetime.now().isoformat()
            }
    
    def is_healthy(self) -> bool:
        """Check if the orchestrator is healthy and ready to process messages"""
        return self.graph is not None and bool(self.agents)
    
    async def _ensure_healthy(self):
        """Ensure the orchestrator is healthy by reinitializing if needed"""
        try:
            logger.info("Attempting to ensure orchestrator health...")
            
            # Check if we have agents available
            if not self.agents:
                logger.error("No agents available for reinitialization")
                return False
            
            # Create the state graph
            workflow = self._create_graph()
            logger.info("Created workflow for health check")
            
            # Compile the graph
            self.graph = workflow.compile()
            logger.info("Successfully reinitialized graph for health check")
            return True
            
        except Exception as e:
            logger.error(f"Failed to ensure orchestrator health: {e}")
            return False
    
    async def health_check(self) -> Dict[str, Any]:
        """Get detailed health status of the orchestrator"""
        return {
            "status": "healthy" if self.is_healthy() else "unhealthy",
            "graph_available": self.graph is not None,
            "agents_available": bool(self.agents),
            "agent_count": len(self.agents) if self.agents else 0,
            "timestamp": datetime.now().isoformat()
        }
