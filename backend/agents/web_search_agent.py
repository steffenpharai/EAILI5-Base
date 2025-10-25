"""
Web Search Agent - Dynamic AI-powered web search and summarization
Part of the multi-agent AI system for EAILI5
"""

import asyncio
from typing import Dict, List, Any, Optional
import logging
from datetime import datetime
import httpx

logger = logging.getLogger(__name__)

class WebSearchAgent:
    """
    Specialized agent for real-time web searches and latest crypto information.
    Uses Tavily API for web search and OpenAI for summarization.
    """
    
    def __init__(self, openai_service=None, tavily_service=None):
        self.openai_service = openai_service
        self.tavily_service = tavily_service
        self.system_prompt = """You are EAILI5's Research Analyst, specializing in news synthesis and information verification for crypto markets.

Your role:
1. Synthesize news from multiple sources with credibility assessment
2. Extract key developments affecting token fundamentals and market sentiment
3. Timeline recent events with 24h, 7d, and 30d context
4. Provide trend analysis based on news patterns and source reliability

Analysis Requirements:
- Cite specific sources: "CoinDesk reports... while Reuters indicates..."
- Reference publication dates: "News from 6 hours ago shows..."
- Assess credibility: "Multiple sources confirm..." vs "Single source reports..."
- Extract key facts: "Partnership announced with..." or "Regulatory concerns raised..."
- Provide context: "This follows similar developments in..." or "Contrasting with previous..."

Professional Voice:
- Direct, analytical statements with specific information
- "Research shows..." instead of "Let me explain..."
- Cite sources: "According to 3 major publications..."
- Professional but accessible: "The news indicates..." not casual language
- Focus on factual synthesis over opinion

News Analysis Guidelines:
- Compare multiple sources for consistency and credibility
- Extract key developments affecting token fundamentals
- Timeline recent events with specific dates and context
- Assess market impact of news developments
- Identify trend patterns in news coverage

Learning level adaptation:
- 0-20: Explain basic news concepts with simple source verification
- 21-50: Introduce intermediate analysis with source comparison
- 51-80: Advanced news analysis with trend identification
- 81-100: Full research analysis with comprehensive synthesis

Analysis Structure:
1. Source credibility assessment (reputation, consistency, verification)
2. Key developments extraction (partnerships, regulatory, technical updates)
3. Timeline analysis (24h, 7d, 30d context and trends)
4. Market impact assessment (sentiment, price correlation, fundamentals)
5. Trend identification (news patterns, coverage changes)
6. Information gaps (missing data, conflicting reports)

Source Evaluation Criteria:
- Publication reputation and track record
- Multiple source confirmation
- Publication date and recency
- Author expertise and credentials
- Bias assessment and objectivity

Avoid:
- Casual language or encouragement phrases
- Vague statements without source support
- Overly technical jargon without explanation
- Financial advice (focus on information analysis only)
- Speculation without news backing

Formatting:
- Use plain text with natural line breaks
- Include specific dates and source names
- Reference publication credibility
- Keep analysis concise but comprehensive
- Structure findings logically

Remember: You are a research analyst, not a financial advisor. Focus on synthesizing information with source verification and clear trend analysis."""

    async def process(self, message: str, user_id: str, learning_level: int, context: Dict[str, Any] = None) -> str:
        """
        Process web search questions using Tavily and OpenAI to generate dynamic responses
        
        Args:
            message: User's search question
            user_id: Unique identifier for the user
            learning_level: User's current learning level (0-100)
            context: Additional context about search preferences, etc.
            
        Returns:
            Dynamic AI-generated search results and analysis
        """
        try:
            logger.debug(f"WebSearchAgent processing message: {message[:100]}...")
            logger.debug(f"User ID: {user_id}, Learning Level: {learning_level}")
            logger.debug(f"Context: {context}")
            
            if not self.openai_service:
                logger.error("OpenAI service not available")
                return "I'm having trouble connecting to my AI brain right now. Please try again!"
            
            if not self.tavily_service:
                logger.error("Tavily service not available")
                return "I'm having trouble searching the web right now. Please try again!"
            
            # Perform web search using Tavily
            search_results = await self.tavily_service.search(message)
            
            if not search_results or not search_results.get('results'):
                return "I couldn't find any relevant information about that topic. Could you try rephrasing your question?"
            
            # Build comprehensive system prompt with learning level context
            system_prompt = self._build_system_prompt(learning_level, context, search_results)
            
            # Build full message history for context awareness
            messages = [{"role": "system", "content": system_prompt}]
            
            # Add conversation history from context
            if context and context.get('recent_messages'):
                for msg in context['recent_messages'][-5:]:  # Last 5 exchanges
                    if isinstance(msg, dict):
                        user_msg = msg.get('message', '')
                        ai_response = msg.get('response', '')
                        if user_msg:
                            messages.append({"role": "user", "content": user_msg})
                        if ai_response:
                            messages.append({"role": "assistant", "content": ai_response})
            
            # Add current message with search results
            messages.append({"role": "user", "content": f"Based on these search results, please answer: {message}\n\nSearch Results:\n{self._format_search_results(search_results)}"})
            
            # Call OpenAI with full conversation history
            response_dict = await self.openai_service.generate_response(
                messages=messages,
                temperature=0.7,
                max_tokens=1500
            )
            
            # Extract content from response dictionary
            response_text = response_dict.get('content', '')
            logger.debug(f"Generated OpenAI response: {response_text[:200]}...")
            return response_text
            
        except Exception as e:
            logger.error(f"Error in WebSearchAgent.process: {type(e).__name__}: {e}")
            logger.error(f"Traceback: {e.__traceback__}")
            return "I'm having trouble searching for that information right now. Could you try rephrasing your question?"
    
    def _build_system_prompt(self, learning_level: int, context: Dict[str, Any] = None, search_results: Dict[str, Any] = None) -> str:
        """
        Build comprehensive system prompt with learning level context
        """
        base_prompt = self.system_prompt
        
        # Add learning level context
        if learning_level <= 20:
            level_context = "\n\nIMPORTANT: This user is a BEGINNER (0-20 level). Use simple analogies, everyday examples, and basic concepts. Avoid technical jargon. Focus on fundamental concepts like source verification."
        elif learning_level <= 60:
            level_context = "\n\nIMPORTANT: This user is INTERMEDIATE (21-60 level). You can use some technical terms but always explain them. Focus on practical applications and source evaluation."
        else:
            level_context = "\n\nIMPORTANT: This user is ADVANCED (61-100 level). You can dive into technical details and advanced concepts. They understand crypto fundamentals and information evaluation."
        
        # Add context about user's situation if available
        context_info = ""
        if context:
            if context.get('search_preferences'):
                context_info += f"\n\nUser's Search Preferences: {context['search_preferences']}"
            if context.get('recent_searches'):
                context_info += f"\n\nRecent Search History: {context['recent_searches']}"
        
        # Add search results context
        search_context = ""
        if search_results:
            search_context = f"\n\nSearch Results Available: {len(search_results.get('results', []))} results found"
            if search_results.get('results'):
                search_context += f"\n\nTop Sources: {', '.join([result.get('title', 'Unknown') for result in search_results['results'][:3]])}"
        
        return base_prompt + level_context + context_info + search_context
    
    def _format_search_results(self, search_results: Dict[str, Any]) -> str:
        """
        Format search results for OpenAI processing
        """
        if not search_results or not search_results.get('results'):
            return "No search results available."
        
        formatted_results = []
        for i, result in enumerate(search_results['results'][:5], 1):  # Limit to top 5 results
            formatted_result = f"{i}. {result.get('title', 'No title')}\n"
            formatted_result += f"   URL: {result.get('url', 'No URL')}\n"
            formatted_result += f"   Content: {result.get('content', 'No content')[:500]}...\n"
            formatted_results.append(formatted_result)
        
        return "\n".join(formatted_results)