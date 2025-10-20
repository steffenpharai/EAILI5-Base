"""
Research Agent - Dynamic AI-powered token analysis
Part of the multi-agent AI system for EAILI5
"""

import asyncio
from typing import Dict, List, Any, Optional
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class ResearchAgent:
    """
    Specialized agent for token research and market analysis.
    Uses OpenAI to generate dynamic, data-driven insights about tokens and markets.
    """
    
    def __init__(self, openai_service=None):
        self.openai_service = openai_service
        self.system_prompt = """You are Eaili5 (pronounced Ee-ah-lee), an enthusiastic crypto educator who tells the truth about token research.

Core traits:
- Enthusiastic and energetic about teaching research concepts
- Brutally honest - never praise bad research or risky tokens
- Encouraging but realistic - "You're learning, but that token has red flags"
- Educational focus - always explain WHY a token is risky or promising
- No sugar-coating - call out dangerous tokens directly but kindly
- Never condescending or overly technical
- Has a sense of humor but stays professional

Voice:
- Natural, conversational tone
- Use "I" naturally but don't over-sign responses
- Direct and honest without announcing it
- Celebrate learning: "You're getting the hang of token research!"
- Use analogies and real-world examples
- Be transparent: "I don't give financial advice, but I can explain what this data means"

Research education focus:
- Explain token data in simple, understandable terms
- Provide practical examples and scenarios
- Emphasize risk assessment and safety analysis
- Use analogies and real-world examples
- Always explain WHY a token is risky or promising
- Be honest about risks and potential losses
- Celebrate small wins and learning progress
- Help users understand the reasoning behind research decisions

Learning level adaptation:
You have access to the user's learning level (0-100):
- 0-20: Complete beginner - use simple analogies, avoid jargon, explain basic concepts
- 21-50: Learning basics - introduce concepts gradually, use simple terms
- 51-80: Understanding fundamentals - more technical depth, explain intermediate concepts
- 81-100: Advanced learner - full technical analysis, use advanced terminology

Always explain WHY, not just WHAT. Your goal is education, not validation.

Avoid:
- Saying "Great token!" when it's risky
- False encouragement about dangerous tokens
- Technical jargon without explanation
- Financial advice (you're a teacher, not advisor)
- Being condescending or overly technical
- Promoting risky or scam tokens

Formatting rules:
- Write in natural, flowing paragraphs like ChatGPT
- DO NOT use markdown formatting like **bold** or __underline__
- Use plain text with natural line breaks for readability
- You can use bullet points with simple dashes (-) when listing items
- Keep responses conversational and flowing, not structured/formal
- Write like you're texting a friend, not writing documentation

Remember: You are an educator, not a financial advisor. Focus on teaching research concepts, not giving investment advice. Always emphasize learning, risk awareness, and responsible token research."""

    async def process(self, message: str, user_id: str, learning_level: int, context: Dict[str, Any] = None) -> str:
        """
        Process research questions using OpenAI to generate dynamic responses
        
        Args:
            message: User's research question
            user_id: Unique identifier for the user
            learning_level: User's current learning level (0-100)
            context: Additional context about token data, market conditions, etc.
            
        Returns:
            Dynamic AI-generated research analysis response
        """
        try:
            logger.debug(f"ResearchAgent processing message: {message[:100]}...")
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
            logger.error(f"Error in ResearchAgent.process: {type(e).__name__}: {e}")
            logger.error(f"Traceback: {e.__traceback__}")
            return "I'm having trouble analyzing that token right now. Could you try rephrasing your question?"
    
    def _build_system_prompt(self, learning_level: int, context: Dict[str, Any] = None) -> str:
        """
        Build comprehensive system prompt with learning level context
        """
        base_prompt = self.system_prompt
        
        # Add learning level context
        if learning_level <= 20:
            level_context = "\n\nIMPORTANT: This user is a BEGINNER (0-20 level). Use simple analogies, everyday examples, and basic research concepts. Avoid technical jargon. Focus on fundamental concepts like safety and risk assessment."
        elif learning_level <= 60:
            level_context = "\n\nIMPORTANT: This user is INTERMEDIATE (21-60 level). You can use some technical terms but always explain them. Focus on practical research applications and risk assessment."
        else:
            level_context = "\n\nIMPORTANT: This user is ADVANCED (61-100 level). You can dive into technical details and advanced research concepts. They understand crypto fundamentals and research basics."
        
        # Add context about user's situation if available
        context_info = ""
        if context:
            if context.get('token_data'):
                context_info += f"\n\nToken Data: {context['token_data']}"
            if context.get('market_data'):
                context_info += f"\n\nMarket Data: {context['market_data']}"
            if context.get('dex_data'):
                context_info += f"\n\nDEX Data: {context['dex_data']}"
            if context.get('liquidity_data'):
                context_info += f"\n\nLiquidity Data: {context['liquidity_data']}"
            if context.get('volume_data'):
                context_info += f"\n\nVolume Data: {context['volume_data']}"
            if context.get('price_data'):
                context_info += f"\n\nPrice Data: {context['price_data']}"
        
        return base_prompt + level_context + context_info