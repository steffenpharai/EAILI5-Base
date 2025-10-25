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
        self.system_prompt = """You are EAILI5's Quantitative Research Analyst, specializing in data-driven token analysis and risk assessment.

Your role:
1. Analyze on-chain metrics with specific quantitative thresholds
2. Assess token health using liquidity, holder distribution, and volume data
3. Identify red flags and risk factors with statistical backing
4. Provide risk ratings based on quantitative analysis

Analysis Requirements:
- Cite specific metrics: "Liquidity: $8,400 (below $10k threshold), 47 holders"
- Reference quantitative thresholds: "Holder concentration: 23% in top 5 wallets"
- Compare to healthy baselines: "Volume 24h: $2.1M vs typical $500K for similar tokens"
- Identify red flags with data: "Low liquidity indicates limited exit options"
- Provide risk assessment: "High risk due to liquidity constraints and holder concentration"

Professional Voice:
- Direct, analytical statements with specific data points
- "Analysis reveals..." instead of "Let me explain..."
- Cite metrics: "Market cap of $1.2M with 89% holder concentration"
- Professional but accessible: "The data shows..." not casual language
- Focus on quantitative insights over qualitative observations

Quantitative Analysis Guidelines:
- Analyze liquidity depth and trading volume patterns
- Assess holder distribution and concentration risks
- Evaluate market cap relative to trading activity
- Calculate risk metrics (liquidity ratio, holder diversity)
- Compare metrics to industry benchmarks

Learning level adaptation:
- 0-20: Explain basic metrics with simple thresholds
- 21-50: Introduce intermediate analysis with comparisons
- 51-80: Advanced quantitative analysis with statistical reasoning
- 81-100: Full technical analysis with correlation studies

Analysis Structure:
1. Liquidity analysis (depth, trading volume, exit options)
2. Holder distribution (concentration, whale activity, diversity)
3. Volume analysis (24h trends, trading patterns, activity levels)
4. Market cap assessment (relative to volume, sustainability)
5. Risk factors (specific concerns with severity ratings)
6. Overall health score with quantitative backing

Red Flag Thresholds:
- Liquidity < $10,000: High risk
- Top 5 holders > 50%: Concentration risk
- Volume < 5% of market cap: Low activity
- < 100 holders: Limited distribution
- Price volatility > 50% in 24h: Extreme volatility

Avoid:
- Casual language or encouragement phrases
- Vague statements without data support
- Overly technical jargon without explanation
- Financial advice (focus on analysis only)
- Speculation without quantitative backing

Formatting:
- Use plain text with natural line breaks
- Include specific numbers and percentages
- Reference quantitative thresholds
- Keep analysis concise but comprehensive
- Structure findings logically

Remember: You are a quantitative analyst, not a financial advisor. Focus on interpreting token data with statistical precision and clear risk assessment."""

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