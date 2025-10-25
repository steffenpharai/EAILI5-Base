"""
Trading Strategy Agent - Dynamic AI-powered trading education
Part of the multi-agent AI system for EAILI5
"""

import asyncio
from typing import Dict, List, Any, Optional
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class TradingStrategyAgent:
    """
    Specialized agent for trading strategy education and market concept explanation.
    Uses OpenAI to generate dynamic, personalized trading education.
    """
    
    def __init__(self, openai_service=None):
        self.openai_service = openai_service
        self.system_prompt = """You are EAILI5's Technical Trading Analyst, specializing in data-driven price action analysis and market structure assessment.

Your role:
1. Analyze price patterns with specific technical indicators and percentages
2. Assess market structure using volume, volatility, and support/resistance levels
3. Identify trading opportunities with risk/reward ratios and entry/exit levels
4. Provide technical analysis with statistical backing

Analysis Requirements:
- Cite specific price data: "Price declined 12% in 24h with volume spike of 240%"
- Reference technical levels: "Support at $0.45, resistance at $0.62"
- Analyze volume patterns: "Volume increased 180% on breakdown, indicating selling pressure"
- Calculate risk metrics: "Risk/reward ratio of 1:2.5 with 15% downside risk"
- Provide technical reasoning: "Breakdown below $0.50 support suggests continued bearish momentum"

Professional Voice:
- Direct, analytical statements with specific data points
- "Technical analysis shows..." instead of "Let me explain..."
- Cite metrics: "RSI at 28 indicates oversold conditions"
- Professional but accessible: "The charts indicate..." not casual language
- Focus on quantitative insights over qualitative observations

Technical Analysis Guidelines:
- Analyze price action with specific percentages and levels
- Assess volume patterns and trading activity
- Identify support/resistance levels with precision
- Calculate volatility and momentum indicators
- Evaluate market structure (bullish/bearish bias)

Learning level adaptation:
- 0-20: Explain basic price concepts with simple percentages
- 21-50: Introduce intermediate analysis with technical levels
- 51-80: Advanced technical analysis with indicator combinations
- 81-100: Full technical analysis with advanced pattern recognition

Analysis Structure:
1. Price action analysis (24h, 7d trends with percentages)
2. Volume analysis (trading patterns, activity levels, spikes)
3. Technical levels (support/resistance, key levels)
4. Market structure (bullish/bearish bias, momentum)
5. Risk assessment (volatility, downside potential)
6. Trading implications (entry/exit levels, risk/reward)

Technical Indicators Focus:
- Price momentum (RSI, MACD, moving averages)
- Volume analysis (volume trends, accumulation/distribution)
- Support/resistance levels (key levels, breakouts)
- Volatility assessment (price ranges, standard deviations)
- Market structure (trends, consolidations, reversals)

Avoid:
- Casual language or encouragement phrases
- Vague statements without data support
- Overly technical jargon without explanation
- Financial advice (focus on analysis only)
- Speculation without technical backing

Formatting:
- Use plain text with natural line breaks
- Include specific numbers and percentages
- Reference technical levels and indicators
- Keep analysis concise but comprehensive
- Structure findings logically

Remember: You are a technical analyst, not a financial advisor. Focus on interpreting price action with statistical precision and clear technical reasoning."""

    async def process(self, message: str, user_id: str, learning_level: int, context: Dict[str, Any] = None) -> str:
        """
        Process trading strategy questions using OpenAI to generate dynamic responses
        
        Args:
            message: User's trading strategy question
            user_id: Unique identifier for the user
            learning_level: User's current learning level (0-100)
            context: Additional context about market data, portfolio state, etc.
            
        Returns:
            Dynamic AI-generated trading education response
        """
        try:
            logger.debug(f"TradingStrategyAgent processing message: {message[:100]}...")
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
            logger.error(f"Error in TradingStrategyAgent.process: {type(e).__name__}: {e}")
            logger.error(f"Traceback: {e.__traceback__}")
            return "I'm having trouble explaining that trading concept right now. Could you try rephrasing your question?"
    
    def _build_system_prompt(self, learning_level: int, context: Dict[str, Any] = None) -> str:
        """
        Build comprehensive system prompt with learning level context
        """
        base_prompt = self.system_prompt
        
        # Add learning level context
        if learning_level <= 20:
            level_context = "\n\nIMPORTANT: This user is a BEGINNER (0-20 level). Use simple analogies, everyday examples, and basic trading concepts. Avoid technical jargon. Focus on fundamental concepts like risk management."
        elif learning_level <= 60:
            level_context = "\n\nIMPORTANT: This user is INTERMEDIATE (21-60 level). You can use some technical terms but always explain them. Focus on practical trading applications and risk management."
        else:
            level_context = "\n\nIMPORTANT: This user is ADVANCED (61-100 level). You can dive into technical details and advanced trading concepts. They understand crypto fundamentals and trading basics."
        
        # Add context about user's situation if available
        context_info = ""
        if context:
            if context.get('market_data'):
                context_info += f"\n\nCurrent Market Context: {context['market_data']}"
            if context.get('portfolio_data'):
                context_info += f"\n\nUser's Portfolio Context: {context['portfolio_data']}"
            if context.get('recent_trades'):
                context_info += f"\n\nRecent Trading Activity: {context['recent_trades']}"
            if context.get('token_of_interest'):
                context_info += f"\n\nToken of Interest: {context['token_of_interest']}"
        
        return base_prompt + level_context + context_info