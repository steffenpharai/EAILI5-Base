"""
Coordinator Agent - Routes queries to specialist agents
Part of the multi-agent AI system for EAILI5
"""

import asyncio
import json
from typing import Dict, List, Any, Optional
from datetime import datetime
import logging

from .research_agent import ResearchAgent
from .educator_agent import EducatorAgent
from .portfolio_agent import PortfolioAdvisorAgent
from .trading_strategy_agent import TradingStrategyAgent
from .web_search_agent import WebSearchAgent

logger = logging.getLogger(__name__)

class CoordinatorAgent:
    """
    Main coordinator that routes user queries to appropriate specialist agents
    and maintains conversation context and user learning level.
    """
    
    def __init__(self, openai_service=None, tavily_service=None):
        self.openai_service = openai_service
        self.tavily_service = tavily_service
        
        # Initialize agents with dependencies
        self.research_agent = ResearchAgent(openai_service)
        self.educator_agent = EducatorAgent(openai_service)
        self.portfolio_agent = PortfolioAdvisorAgent(openai_service)
        self.trading_strategy_agent = TradingStrategyAgent(openai_service)
        self.web_search_agent = WebSearchAgent(openai_service, tavily_service)
        
        # User learning levels (0-100)
        self.user_levels: Dict[str, int] = {}
        
        # Conversation history
        self.conversation_history: Dict[str, List[Dict]] = {}
    
    async def process_message(self, message: str, user_id: str, context: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Process user message and route to appropriate agent(s)
        
        Args:
            message: User's question/message
            user_id: Unique user identifier
            context: Additional context (token data, portfolio state, etc.)
            
        Returns:
            Dict containing response, suggestions, and updated learning level
        """
        try:
            # Get or initialize user learning level
            learning_level = self.user_levels.get(user_id, 0)
            
            # Get conversation history from context
            conversation_history = context.get("conversation_history", {}) if context else {}
            recent_messages = context.get("recent_messages", []) if context else []
            previous_messages = context.get("previous_messages", []) if context else []
            
            # Add to conversation history
            if user_id not in self.conversation_history:
                self.conversation_history[user_id] = []
            
            self.conversation_history[user_id].append({
                "timestamp": datetime.now().isoformat(),
                "user_message": message,
                "learning_level": learning_level
            })
            
            # Build enhanced context with conversation history
            enhanced_context = {
                **(context or {}),
                "conversation_history": conversation_history,
                "recent_messages": recent_messages,
                "previous_messages": previous_messages,
                "user_id": user_id
            }
            
            # Analyze message intent and route to appropriate agent(s)
            intent = await self.analyze_intent(message, enhanced_context)
            
            # Route to specialist agents based on intent
            response = await self._route_to_agents(message, intent, user_id, learning_level, enhanced_context)
            
            # Update learning level based on interaction
            new_level = await self._update_learning_level(user_id, message, response)
            self.user_levels[user_id] = new_level
            
            # Generate follow-up suggestions
            suggestions = await self._generate_suggestions(intent, learning_level, enhanced_context)
            
            return {
                "message": response,
                "suggestions": suggestions,
                "learning_level": new_level,
                "intent": intent,
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error processing message: {e}")
            return {
                "message": "I'm sorry, I encountered an issue processing your question. Could you try rephrasing it?",
                "suggestions": ["What is cryptocurrency?", "How do I start learning?", "Explain trading basics"],
                "learning_level": learning_level,
                "error": str(e)
            }
    
    async def analyze_intent(self, message: str, context: Dict[str, Any] = None) -> str:
        """
        Analyze user message to determine intent and routing
        """
        message_lower = message.lower()
        
        # Token analysis workflow (when user asks to analyze a specific token)
        if any(word in message_lower for word in ["analyze", "analysis", "research this", "tell me about"]) and context and context.get('token_data'):
            return "token_analysis"
        
        # Trading strategy questions
        if any(word in message_lower for word in ["trade", "trading", "buy", "sell", "long", "short", "scalp", "swing"]):
            return "trading_strategy"
        
        # Portfolio/simulation questions
        if any(word in message_lower for word in ["portfolio", "simulate", "virtual", "practice", "balance"]):
            return "portfolio"
        
        # Token/research questions
        if any(word in message_lower for word in ["token", "price", "liquidity", "volume", "market cap", "dex"]):
            return "research"
        
        # Educational questions
        if any(word in message_lower for word in ["what is", "explain", "how does", "why", "learn", "understand"]):
            return "education"
        
        # Web search questions (latest news, current events)
        if any(word in message_lower for word in ["news", "latest", "recent", "today", "current", "happening"]):
            return "web_search"
        
        # Default to education for general questions
        return "education"
    
    async def _route_to_agents(self, message: str, intent: str, user_id: str, learning_level: int, context: Dict[str, Any] = None) -> str:
        """
        Route message to appropriate specialist agent(s)
        """
        try:
            if intent == "token_analysis":
                # Multi-agent workflow for comprehensive token analysis
                return await self.analyze_token_comprehensive(
                    message=message,
                    user_id=user_id,
                    learning_level=learning_level,
                    context=context
                )
            
            elif intent == "trading_strategy":
                return await self.trading_strategy_agent.process(
                    message=message,
                    user_id=user_id,
                    learning_level=learning_level,
                    context=context
                )
            
            elif intent == "portfolio":
                return await self.portfolio_agent.process(
                    message=message,
                    user_id=user_id,
                    learning_level=learning_level,
                    context=context
                )
            
            elif intent == "research":
                return await self.research_agent.process(
                    message=message,
                    user_id=user_id,
                    learning_level=learning_level,
                    context=context
                )
            
            elif intent == "web_search":
                return await self.web_search_agent.process(
                    message=message,
                    user_id=user_id,
                    learning_level=learning_level,
                    context=context
                )
            
            else:  # education (default)
                return await self.educator_agent.process(
                    message=message,
                    user_id=user_id,
                    learning_level=learning_level,
                    context=context
                )
                
        except Exception as e:
            logger.error(f"Error routing to agents: {e}")
            return "I'm having trouble processing your question right now. Could you try asking it differently?"
    
    async def _update_learning_level(self, user_id: str, message: str, response: str) -> int:
        """
        Update user's learning level based on interaction complexity and engagement
        """
        current_level = self.user_levels.get(user_id, 0)
        
        # Simple heuristics for level progression
        # This would be more sophisticated in production
        
        # Increase level for complex questions
        if any(word in message.lower() for word in ["advanced", "complex", "technical", "strategy"]):
            return min(current_level + 2, 100)
        
        # Increase level for successful interactions
        if len(response) > 200:  # Detailed responses indicate engagement
            return min(current_level + 1, 100)
        
        # Maintain current level for basic questions
        return current_level
    
    async def _generate_suggestions(self, intent: str, learning_level: int, context: Dict[str, Any] = None) -> List[str]:
        """
        Generate contextual follow-up suggestions based on intent and learning level
        """
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
        
        elif intent == "trading_strategy":
            suggestions = [
                "What's the difference between long and short positions?",
                "How do I manage risk when trading?",
                "Explain day trading vs swing trading"
            ]
        
        elif intent == "portfolio":
            suggestions = [
                "How do I diversify my portfolio?",
                "What's position sizing?",
                "How do I track my performance?"
            ]
        
        elif intent == "research":
            suggestions = [
                "What should I look for in a token?",
                "How do I check if a token is safe?",
                "What's market cap and why does it matter?"
            ]
        
        return suggestions[:3]  # Limit to 3 suggestions
    
    def get_user_learning_level(self, user_id: str) -> int:
        """Get user's current learning level"""
        return self.user_levels.get(user_id, 0)
    
    def get_conversation_history(self, user_id: str) -> List[Dict]:
        """Get user's conversation history"""
        return self.conversation_history.get(user_id, [])
    
    async def reset_user_session(self, user_id: str):
        """Reset user's learning session"""
        if user_id in self.user_levels:
            del self.user_levels[user_id]
        if user_id in self.conversation_history:
            del self.conversation_history[user_id]
        logger.info(f"Reset session for user {user_id}")
    
    async def analyze_token_comprehensive(self, message: str, user_id: str, learning_level: int, context: Dict[str, Any] = None) -> str:
        """
        Comprehensive multi-agent token analysis workflow
        
        This orchestrates multiple agents to provide deep token analysis:
        1. Research Agent - Gathers on-chain data (liquidity, holders, volume)
        2. Web Search Agent - Finds team info, news, social sentiment
        3. Trading Strategy Agent - Analyzes price patterns and trading signals
        4. Educator Agent - Synthesizes everything into clear, actionable insights
        """
        try:
            token_data = context.get('token_data', {}) if context else {}
            token_symbol = token_data.get('symbol', 'this token')
            token_address = token_data.get('address', '')
            
            # Step 1: Research Agent - On-chain analysis
            research_context = {
                **(context or {}),
                'focus': 'on_chain_metrics',
                'token_data': token_data
            }
            on_chain_analysis = await self.research_agent.process(
                message=f"Analyze the on-chain metrics for {token_symbol}: holders, liquidity, volume, and market cap. What do these numbers tell us about the token's health?",
                user_id=user_id,
                learning_level=learning_level,
                context=research_context
            )
            
            # Step 2: Web Search Agent - Latest news and team info
            web_search_query = f"Latest news and information about {token_symbol} cryptocurrency token team developers"
            web_context = {
                **(context or {}),
                'search_focus': 'team_and_news',
                'token_data': token_data
            }
            try:
                web_research = await self.web_search_agent.process(
                    message=web_search_query,
                    user_id=user_id,
                    learning_level=learning_level,
                    context=web_context
                )
            except Exception as e:
                logger.warning(f"Web search failed: {e}")
                web_research = "I couldn't find recent news, but I'll analyze the on-chain data."
            
            # Step 3: Trading Strategy Agent - Price analysis
            trading_context = {
                **(context or {}),
                'focus': 'price_action',
                'token_data': token_data
            }
            price_analysis = await self.trading_strategy_agent.process(
                message=f"Analyze the price action and trading patterns for {token_symbol}. Based on the 24h change of {token_data.get('priceChange24h', 0)}% and volume of ${token_data.get('volume24h', 0):,.0f}, what should traders know?",
                user_id=user_id,
                learning_level=learning_level,
                context=trading_context
            )
            
            # Step 4: Educator Agent - Synthesize all findings
            synthesis_context = {
                **(context or {}),
                'on_chain_analysis': on_chain_analysis,
                'web_research': web_research,
                'price_analysis': price_analysis,
                'token_data': token_data
            }
            
            final_analysis = await self.educator_agent.process(
                message=f"Based on all the research about {token_symbol}, give me a comprehensive analysis that explains: 1) Liquidity and holder analysis, 2) Recent news/developments, 3) Price trends and trading signals, 4) Overall assessment with specific risks and opportunities. Be direct and specific.",
                user_id=user_id,
                learning_level=learning_level,
                context=synthesis_context
            )
            
            return final_analysis
            
        except Exception as e:
            logger.error(f"Error in comprehensive token analysis: {e}")
            return f"I analyzed {token_symbol} but encountered some issues. Let me give you what I found from the available data: {token_data.get('symbol', 'Token')} is trading at ${token_data.get('price', 0):.2f} with a safety score of {token_data.get('safetyScore', 0)}/100. The 24h volume is ${token_data.get('volume24h', 0):,.0f}. I recommend being cautious and asking specific questions about what concerns you most."
