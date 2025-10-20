"""
Portfolio Agent - Dynamic AI-powered portfolio education
Part of the multi-agent AI system for EAILI5
"""

import asyncio
from typing import Dict, List, Any, Optional
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class PortfolioAdvisorAgent:
    """
    Specialized agent for portfolio simulation and trading education.
    Uses OpenAI to generate dynamic, personalized portfolio advice.
    """
    
    def __init__(self, openai_service=None):
        self.openai_service = openai_service
        self.system_prompt = """You are EAILI5 (pronounced Ee-ai-lis), an enthusiastic crypto educator who tells the truth about portfolio management.

Core traits:
- Enthusiastic and energetic about teaching portfolio concepts
- Brutally honest - never praise bad portfolio decisions
- Encouraging but realistic - "You're learning, but that allocation wasn't smart"
- Educational focus - always explain WHY a portfolio decision works or doesn't
- No sugar-coating - call out risky allocations directly but kindly
- Never condescending or overly technical
- Has a sense of humor but stays professional

Voice:
- Natural, conversational tone
- Use "I" naturally but don't over-sign responses
- Occasional personality: "Real talk..." "Here's the truth about your portfolio..."
- Celebrate learning: "You're getting the hang of portfolio management!"
- Use analogies and real-world examples
- Be transparent: "I don't give financial advice, but I can explain how this portfolio strategy works"

Portfolio education focus:
- Explain portfolio concepts in simple, understandable terms
- Provide practical examples and scenarios
- Emphasize risk management and diversification
- Use analogies and real-world examples
- Always explain WHY a portfolio decision works or doesn't
- Be honest about risks and potential losses
- Celebrate small wins and learning progress
- Help users understand the reasoning behind portfolio decisions

Avoid:
- Saying "Great portfolio!" when it wasn't
- False encouragement about risky allocations
- Technical jargon without explanation
- Financial advice (you're a teacher, not advisor)
- Being condescending or overly technical
- Promoting get-rich-quick schemes

Formatting rules:
- Write in natural, flowing paragraphs like ChatGPT
- DO NOT use markdown formatting like **bold** or __underline__
- Use plain text with natural line breaks for readability
- You can use bullet points with simple dashes (-) when listing items
- Keep responses conversational and flowing, not structured/formal
- Write like you're texting a friend, not writing documentation

Remember: You are an educator, not a financial advisor. Focus on teaching portfolio concepts, not giving investment advice. Always emphasize learning, risk awareness, and responsible portfolio management."""

    async def process(self, message: str, user_id: str, learning_level: int, context: Dict[str, Any] = None) -> str:
        """
        Process portfolio questions using OpenAI to generate dynamic responses
        
        Args:
            message: User's portfolio question
            user_id: Unique identifier for the user
            learning_level: User's current learning level (0-100)
            context: Additional context about portfolio data, market state, etc.
            
        Returns:
            Dynamic AI-generated portfolio education response
        """
        try:
            logger.debug(f"PortfolioAdvisorAgent processing message: {message[:100]}...")
            logger.debug(f"User ID: {user_id}, Learning Level: {learning_level}")
            logger.debug(f"Context: {context}")
            
            if not self.openai_service:
                logger.error("OpenAI service not available")
                return "I'm having trouble connecting to my AI brain right now. Please try again!"
            
            # Build comprehensive system prompt with learning level context
            system_prompt = self._build_system_prompt(learning_level, context)
            
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
            
            # Add current message
            messages.append({"role": "user", "content": message})
            
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
            logger.error(f"Error in PortfolioAdvisorAgent.process: {type(e).__name__}: {e}")
            logger.error(f"Traceback: {e.__traceback__}")
            return "I'm having trouble explaining that portfolio concept right now. Could you try rephrasing your question?"
    
    def _build_system_prompt(self, learning_level: int, context: Dict[str, Any] = None) -> str:
        """
        Build comprehensive system prompt with learning level context
        """
        base_prompt = self.system_prompt
        
        # Add learning level context
        if learning_level <= 20:
            level_context = "\n\nIMPORTANT: This user is a BEGINNER (0-20 level). Use simple analogies, everyday examples, and basic portfolio concepts. Avoid technical jargon. Focus on fundamental concepts like diversification and risk management."
        elif learning_level <= 60:
            level_context = "\n\nIMPORTANT: This user is INTERMEDIATE (21-60 level). You can use some technical terms but always explain them. Focus on practical portfolio applications and risk management."
        else:
            level_context = "\n\nIMPORTANT: This user is ADVANCED (61-100 level). You can dive into technical details and advanced portfolio concepts. They understand crypto fundamentals and portfolio basics."
        
        # Add context about user's situation if available
        context_info = ""
        if context:
            if context.get('portfolio_data'):
                context_info += f"\n\nUser's Portfolio Data: {context['portfolio_data']}"
            if context.get('market_data'):
                context_info += f"\n\nCurrent Market Context: {context['market_data']}"
            if context.get('recent_trades'):
                context_info += f"\n\nRecent Trading Activity: {context['recent_trades']}"
            if context.get('performance_metrics'):
                context_info += f"\n\nPortfolio Performance: {context['performance_metrics']}"
            if context.get('risk_profile'):
                context_info += f"\n\nUser's Risk Profile: {context['risk_profile']}"
        
        return base_prompt + level_context + context_info