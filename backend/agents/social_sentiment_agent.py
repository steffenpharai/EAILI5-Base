"""
Social Sentiment Agent - AI Reasoning Engine for onchain context
Part of the multi-agent AI system for EAILI5
"""

import asyncio
from typing import Dict, List, Any, Optional
import logging
from datetime import datetime, timedelta
import json

logger = logging.getLogger(__name__)

class SocialSentimentAgent:
    """
    Specialized agent for social sentiment analysis and causal narrative generation.
    Acts as a cognitive interpreter for blockchain behavior, explaining sentiment shifts
    and social phenomena as cause-and-effect narratives.
    """
    
    def __init__(self, openai_service=None, sentiment_service=None):
        self.openai_service = openai_service
        self.sentiment_service = sentiment_service
        self.system_prompt = """You are EAILI5's Social Sentiment AI Engine, specializing in causal reasoning about community behavior.

Your role:
1. Analyze multi-platform sentiment (Reddit, News, CoinGecko) 
2. Generate clear cause-and-effect narratives explaining patterns
3. Identify drivers and implications of sentiment shifts
4. Detect and explain anomalies

Narrative Guidelines:
- Concise (3-4 sentences max)
- EAILI5 style: clear, educational, friendly
- Explain cause → effect relationships
- Reference specific platforms
- Provide actionable insights

When sentiment_data is in context, generate narrative directly without fetching new data.

Core traits:
- Enthusiastic and energetic about teaching social sentiment concepts
- Brutally honest - never praise bad sentiment analysis or unreliable social data
- Encouraging but realistic - "You're learning, but that social signal isn't reliable"
- Educational focus - always explain WHY social sentiment matters and what it means
- No sugar-coating - call out unreliable social signals directly but kindly
- Never condescending or overly technical
- Has a sense of humor but stays professional

Voice:
- Natural, conversational tone
- Use "I" naturally but don't over-sign responses
- Direct and honest when assessing social sentiment
- Celebrate learning: "You're getting the hang of reading social signals!"
- Use analogies and real-world examples
- Be transparent: "I don't give financial advice, but I can explain what this social sentiment means"

Social sentiment education focus:
- Explain social sentiment in simple, understandable terms
- Provide practical examples and scenarios
- Emphasize correlation vs causation in social signals
- Use analogies and real-world examples
- Always explain WHY social sentiment shifts happen
- Be honest about the limitations of social sentiment analysis
- Celebrate small wins and learning progress
- Help users understand the reasoning behind sentiment analysis

Learning level adaptation:
You have access to the user's learning level (0-100):
- 0-20: Complete beginner - use simple analogies, avoid jargon, explain basic concepts
- 21-50: Learning basics - introduce concepts gradually, use simple terms
- 51-80: Understanding fundamentals - more technical depth, explain intermediate concepts
- 81-100: Advanced learner - full technical analysis, use advanced terminology

Always explain WHY, not just WHAT. Your goal is education, not validation.

Avoid:
- Saying "Great sentiment!" when it's unreliable
- False encouragement about unreliable social signals
- Technical jargon without explanation
- Financial advice (you're a teacher, not advisor)
- Being condescending or overly technical
- Promoting unreliable or manipulated social sentiment

Formatting rules:
- Write in natural, flowing paragraphs like ChatGPT
- DO NOT use markdown formatting like **bold** or __underline__
- Use plain text with natural line breaks for readability
- You can use bullet points with simple dashes (-) when listing items
- Keep responses conversational and flowing, not structured/formal
- Write like you're texting a friend, not writing documentation

Remember: You are an educator, not a financial advisor. Focus on teaching social sentiment concepts, not giving investment advice. Always emphasize learning, critical thinking, and responsible social sentiment analysis."""

    async def process(self, message: str, user_id: str, learning_level: int, context: Dict[str, Any] = None) -> str:
        """
        Process social sentiment questions using OpenAI to generate dynamic responses
        
        Args:
            message: User's social sentiment question
            user_id: Unique identifier for the user
            learning_level: User's current learning level (0-100)
            context: Additional context about token data, social sentiment, etc.
            
        Returns:
            Dynamic AI-generated social sentiment analysis response
        """
        try:
            logger.debug(f"SocialSentimentAgent processing message: {message[:100]}...")
            logger.debug(f"User ID: {user_id}, Learning Level: {learning_level}")
            logger.debug(f"Context: {context}")
            
            if not self.openai_service:
                logger.error("OpenAI service not available")
                return "I'm having trouble connecting to my AI brain right now. Please try again!"
            
            # Get social sentiment data if token context is available
            sentiment_data = None
            if context and context.get('token_data'):
                token_address = context['token_data'].get('address')
                token_symbol = context['token_data'].get('symbol')
                
                if token_address and self.sentiment_service:
                    try:
                        sentiment_data = await self.sentiment_service.get_multi_platform_sentiment(
                            token_address, token_symbol
                        )
                    except Exception as e:
                        logger.warning(f"Failed to get sentiment data: {e}")
            
            # Build comprehensive system prompt with learning level context
            system_prompt = self._build_system_prompt(learning_level, context, sentiment_data)
            
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
            
            # Add current message with sentiment context
            enhanced_message = message
            if sentiment_data:
                enhanced_message += f"\n\nCurrent Social Sentiment Data:\n{self._format_sentiment_data(sentiment_data)}"
            
            messages.append({"role": "user", "content": enhanced_message})
            
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
            logger.error(f"Error in SocialSentimentAgent.process: {type(e).__name__}: {e}")
            logger.error(f"Traceback: {e.__traceback__}")
            return "I'm having trouble analyzing social sentiment right now. Could you try rephrasing your question?"
    
    def _build_system_prompt(self, learning_level: int, context: Dict[str, Any] = None, sentiment_data: Dict[str, Any] = None) -> str:
        """
        Build comprehensive system prompt with learning level context
        """
        base_prompt = self.system_prompt
        
        # Add learning level context
        if learning_level <= 20:
            level_context = "\n\nIMPORTANT: This user is a BEGINNER (0-20 level). Use simple analogies, everyday examples, and basic social sentiment concepts. Avoid technical jargon. Focus on fundamental concepts like understanding what social sentiment means."
        elif learning_level <= 60:
            level_context = "\n\nIMPORTANT: This user is INTERMEDIATE (21-60 level). You can use some technical terms but always explain them. Focus on practical applications and social sentiment evaluation."
        else:
            level_context = "\n\nIMPORTANT: This user is ADVANCED (61-100 level). You can dive into technical details and advanced social sentiment concepts. They understand crypto fundamentals and social sentiment analysis."
        
        # Add context about user's situation if available
        context_info = ""
        if context:
            if context.get('token_data'):
                context_info += f"\n\nToken Data: {context['token_data']}"
            if context.get('social_sentiment_data'):
                context_info += f"\n\nSocial Sentiment Data: {context['social_sentiment_data']}"
            if context.get('platform_data'):
                context_info += f"\n\nPlatform Data: {context['platform_data']}"
        
        # Add sentiment data context
        sentiment_context = ""
        if sentiment_data:
            sentiment_context = f"\n\nAvailable Sentiment Data: {self._format_sentiment_data(sentiment_data)}"
        
        return base_prompt + level_context + context_info + sentiment_context
    
    def _format_sentiment_data(self, sentiment_data: Dict[str, Any]) -> str:
        """
        Format sentiment data for AI consumption
        """
        try:
            if not sentiment_data or sentiment_data.get('error'):
                return "No sentiment data available."
            
            metrics = sentiment_data.get('sentiment_metrics', {})
            platforms = sentiment_data.get('platform_breakdown', {})
            anomalies = sentiment_data.get('anomalies', [])
            
            formatted = f"Overall Sentiment Score: {metrics.get('overall_score', 0):.2f}\n"
            formatted += f"Total Social Volume: {metrics.get('total_volume', 0)}\n"
            formatted += f"Confidence: {metrics.get('confidence', 0):.2f}\n\n"
            
            formatted += "Platform Breakdown:\n"
            for platform, data in platforms.items():
                if data.get('available'):
                    formatted += f"- {platform.title()}: Sentiment {data.get('sentiment', 0):.2f}, "
                    if platform == 'reddit':
                        formatted += f"Posts: {data.get('posts', 0)}, Engagement: {data.get('engagement', 0)}\n"
                    elif platform == 'farcaster':
                        formatted += f"Casts: {data.get('casts', 0)}, Engagement: {data.get('engagement', 0)}\n"
                    elif platform == 'news':
                        formatted += f"Mentions: {data.get('mentions', 0)}\n"
                    else:
                        formatted += f"Score: {data.get('engagement_score', 0)}\n"
            
            if anomalies:
                formatted += f"\nAnomalies Detected: {len(anomalies)}\n"
                for anomaly in anomalies[:3]:  # Show top 3 anomalies
                    formatted += f"- {anomaly.get('type', 'unknown')}: {anomaly.get('description', '')}\n"
            
            return formatted
            
        except Exception as e:
            logger.error(f"Error formatting sentiment data: {e}")
            return "Error formatting sentiment data."
    
    async def generate_causal_narrative(self, token_address: str, token_symbol: str = None) -> str:
        """
        Generate causal narrative explaining social sentiment shifts
        
        Args:
            token_address: Token contract address
            token_symbol: Token symbol for better analysis
            
        Returns:
            Causal narrative explaining sentiment patterns
        """
        try:
            if not self.sentiment_service:
                return "I need access to sentiment data to generate a causal narrative."
            
            # Get comprehensive sentiment data
            sentiment_data = await self.sentiment_service.get_multi_platform_sentiment(
                token_address, token_symbol
            )
            
            if sentiment_data.get('error'):
                return f"I couldn't analyze the social sentiment for this token: {sentiment_data['error']}"
            
            # Get social events timeline
            timeline_data = await self.sentiment_service.get_social_events_timeline(
                token_address, hours=24
            )
            
            # Generate narrative using AI
            narrative_prompt = f"""
            Based on the following social sentiment data, generate a causal narrative explaining what's happening with {token_symbol or token_address}:
            
            Sentiment Metrics: {sentiment_data.get('sentiment_metrics', {})}
            Platform Breakdown: {sentiment_data.get('platform_breakdown', {})}
            Anomalies: {sentiment_data.get('anomalies', [])}
            Timeline: {timeline_data.get('events', [])}
            
            Explain the cause-and-effect relationships you see in the social sentiment data. 
            What events or factors might be driving the current sentiment? 
            How do different platforms (Reddit, Farcaster, news) compare?
            Are there any anomalies or unusual patterns?
            
            Write this as a clear, educational narrative that helps someone understand what's happening socially with this token.
            """
            
            messages = [
                {"role": "system", "content": self.system_prompt},
                {"role": "user", "content": narrative_prompt}
            ]
            
            response_dict = await self.openai_service.generate_response(
                messages=messages,
                temperature=0.7,
                max_tokens=1000
            )
            
            return response_dict.get('content', 'Unable to generate narrative.')
            
        except Exception as e:
            logger.error(f"Error generating causal narrative: {e}")
            return f"I had trouble generating a causal narrative: {str(e)}"
    
    async def analyze_sentiment_shifts(self, token_address: str, hours: int = 24) -> Dict[str, Any]:
        """
        Analyze sentiment shifts over time
        
        Args:
            token_address: Token contract address
            hours: Number of hours to analyze
            
        Returns:
            Dict containing shift analysis
        """
        try:
            if not self.sentiment_service:
                return {"error": "Sentiment service not available"}
            
            # Get time series data
            time_series = await self.sentiment_service.get_sentiment_time_series(
                token_address, hours
            )
            
            if time_series.get('error'):
                return {"error": time_series['error']}
            
            # Analyze shifts
            data_points = time_series.get('time_series', [])
            if len(data_points) < 2:
                return {"error": "Insufficient data for shift analysis"}
            
            # Calculate shift metrics
            first_score = data_points[0].get('sentiment_score', 0)
            last_score = data_points[-1].get('sentiment_score', 0)
            shift_magnitude = abs(last_score - first_score)
            
            # Find peak and valley
            scores = [point.get('sentiment_score', 0) for point in data_points]
            peak_score = max(scores)
            valley_score = min(scores)
            volatility = peak_score - valley_score
            
            # Determine trend
            if shift_magnitude < 0.1:
                trend = "stable"
            elif last_score > first_score:
                trend = "improving"
            else:
                trend = "declining"
            
            return {
                "shift_magnitude": shift_magnitude,
                "trend": trend,
                "volatility": volatility,
                "peak_score": peak_score,
                "valley_score": valley_score,
                "data_points": len(data_points),
                "analysis_period_hours": hours
            }
            
        except Exception as e:
            logger.error(f"Error analyzing sentiment shifts: {e}")
            return {"error": str(e)}
    
    async def correlate_social_with_onchain(self, token_address: str, onchain_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Correlate social sentiment with onchain activity
        
        Args:
            token_address: Token contract address
            onchain_data: Onchain metrics (price, volume, holders, etc.)
            
        Returns:
            Dict containing correlation analysis
        """
        try:
            if not self.sentiment_service:
                return {"error": "Sentiment service not available"}
            
            # Get current sentiment
            sentiment_data = await self.sentiment_service.get_multi_platform_sentiment(
                token_address
            )
            
            if sentiment_data.get('error'):
                return {"error": sentiment_data['error']}
            
            sentiment_score = sentiment_data.get('sentiment_metrics', {}).get('overall_score', 0)
            social_volume = sentiment_data.get('sentiment_metrics', {}).get('total_volume', 0)
            
            # Extract onchain metrics
            price = onchain_data.get('price', 0)
            volume_24h = onchain_data.get('volume_24h', 0)
            holders = onchain_data.get('holders', 0)
            market_cap = onchain_data.get('market_cap', 0)
            
            # Simple correlation analysis (in production, use proper statistical methods)
            correlations = {}
            
            # Price correlation (simplified)
            if price > 0 and sentiment_score != 0:
                price_sentiment_ratio = price / abs(sentiment_score) if sentiment_score != 0 else 0
                correlations['price_sentiment'] = {
                    'ratio': price_sentiment_ratio,
                    'interpretation': 'positive' if sentiment_score > 0 and price > 0 else 'negative'
                }
            
            # Volume correlation
            if volume_24h > 0 and social_volume > 0:
                volume_ratio = volume_24h / social_volume
                correlations['volume_social'] = {
                    'ratio': volume_ratio,
                    'interpretation': 'high' if volume_ratio > 1000 else 'normal'
                }
            
            return {
                "sentiment_score": sentiment_score,
                "social_volume": social_volume,
                "onchain_metrics": {
                    "price": price,
                    "volume_24h": volume_24h,
                    "holders": holders,
                    "market_cap": market_cap
                },
                "correlations": correlations,
                "analysis_timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error correlating social with onchain: {e}")
            return {"error": str(e)}
