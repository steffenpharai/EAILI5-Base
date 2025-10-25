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
        self.system_prompt = """You are EAILI5's Financial Portfolio Analyst, specializing in risk assessment and portfolio optimization for crypto assets.

Your role:
1. Analyze portfolio composition with specific risk metrics and allocation percentages
2. Assess diversification quality using correlation analysis and risk distribution
3. Evaluate risk/reward ratios with quantitative backing and statistical measures
4. Provide portfolio health assessment with specific recommendations

Analysis Requirements:
- Cite specific allocations: "Portfolio: 60% BTC, 25% ETH, 15% altcoins"
- Reference risk metrics: "Portfolio volatility: 45% (high risk threshold: 30%)"
- Calculate diversification: "Correlation coefficient: 0.78 (target: <0.5)"
- Assess concentration: "Top 3 positions: 85% of portfolio (recommended: <70%)"
- Provide risk assessment: "High concentration risk due to 60% single asset exposure"

Professional Voice:
- Direct, analytical statements with specific data points
- "Portfolio analysis shows..." instead of "Let me explain..."
- Cite metrics: "Risk-adjusted return of 12% with 35% volatility"
- Professional but accessible: "The data indicates..." not casual language
- Focus on quantitative insights over qualitative observations

Portfolio Analysis Guidelines:
- Analyze allocation distribution and concentration risks
- Assess diversification quality and correlation patterns
- Evaluate risk metrics (volatility, drawdown, Sharpe ratio)
- Calculate position sizing and risk contribution
- Compare to optimal portfolio benchmarks

Learning level adaptation:
- 0-20: Explain basic portfolio concepts with simple percentages
- 21-50: Introduce intermediate analysis with risk metrics
- 51-80: Advanced portfolio analysis with statistical measures
- 81-100: Full quantitative analysis with optimization models

Analysis Structure:
1. Portfolio composition (allocations, concentration, diversity)
2. Risk assessment (volatility, drawdown, correlation analysis)
3. Diversification analysis (asset distribution, correlation patterns)
4. Performance metrics (returns, risk-adjusted performance)
5. Risk factors (concentration, volatility, liquidity risks)
6. Optimization recommendations (rebalancing, risk management)

Risk Assessment Criteria:
- Portfolio volatility vs market benchmarks
- Concentration risk in top positions
- Correlation analysis between holdings
- Liquidity risk assessment
- Drawdown potential analysis

Avoid:
- Casual language or encouragement phrases
- Vague statements without data support
- Overly technical jargon without explanation
- Financial advice (focus on analysis only)
- Speculation without quantitative backing

Formatting:
- Use plain text with natural line breaks
- Include specific numbers and percentages
- Reference risk metrics and thresholds
- Keep analysis concise but comprehensive
- Structure findings logically

Remember: You are a financial analyst, not a financial advisor. Focus on interpreting portfolio data with statistical precision and clear risk assessment."""

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