"""
Social Sentiment Tools - Tools for social sentiment analysis and correlation
Part of the EAILI5 multi-agent tool system
"""

import asyncio
from typing import Dict, List, Any, Optional
import logging
from datetime import datetime, timedelta
import json
from services.sentiment_service import SentimentService

logger = logging.getLogger(__name__)

class SocialSentimentTools:
    """
    Tools for social sentiment analysis and correlation with onchain data
    """
    
    def __init__(self, sentiment_service: SentimentService):
        self.sentiment_service = sentiment_service
    
    async def fetch_reddit_sentiment(
        self, 
        token_symbol: str, 
        subreddit: str = "CryptoCurrency", 
        hours: int = 24
    ) -> Dict[str, Any]:
        """
        Fetch Reddit sentiment for a token from specific subreddit
        
        Args:
            token_symbol: Token symbol to search for
            subreddit: Reddit subreddit to search (default: CryptoCurrency)
            hours: Hours to look back (default: 24)
            
        Returns:
            Dict containing Reddit sentiment data
        """
        try:
            logger.info(f"Fetching Reddit sentiment for {token_symbol} in r/{subreddit}")
            
            # Use the enhanced Reddit sentiment method
            reddit_data = await self.sentiment_service._get_reddit_sentiment_enhanced(token_symbol)
            
            if not reddit_data:
                return {
                    "error": f"No Reddit data found for {token_symbol}",
                    "subreddit": subreddit,
                    "hours": hours
                }
            
            return {
                "token_symbol": token_symbol,
                "subreddit": subreddit,
                "sentiment_score": reddit_data.get("reddit_sentiment", 0),
                "posts_count": reddit_data.get("reddit_posts", 0),
                "engagement": reddit_data.get("reddit_engagement", 0),
                "posts": reddit_data.get("posts", [])[:3],  # Top 3 posts
                "hours_analyzed": hours,
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error fetching Reddit sentiment: {e}")
            return {"error": str(e)}
    
    async def fetch_farcaster_sentiment(
        self, 
        token_symbol: str, 
        channel: str = "crypto", 
        hours: int = 24
    ) -> Dict[str, Any]:
        """
        Fetch Farcaster sentiment for a token from specific channel
        
        Args:
            token_symbol: Token symbol to search for
            channel: Farcaster channel to search (default: crypto)
            hours: Hours to look back (default: 24)
            
        Returns:
            Dict containing Farcaster sentiment data
        """
        try:
            logger.info(f"Fetching Farcaster sentiment for {token_symbol} in {channel}")
            
            # Use the Farcaster sentiment method
            farcaster_data = await self.sentiment_service._get_farcaster_sentiment(token_symbol)
            
            if not farcaster_data:
                return {
                    "error": f"No Farcaster data found for {token_symbol}",
                    "channel": channel,
                    "hours": hours
                }
            
            return {
                "token_symbol": token_symbol,
                "channel": channel,
                "sentiment_score": farcaster_data.get("farcaster_sentiment", 0),
                "casts_count": farcaster_data.get("farcaster_casts", 0),
                "engagement": farcaster_data.get("farcaster_engagement", 0),
                "hours_analyzed": hours,
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error fetching Farcaster sentiment: {e}")
            return {"error": str(e)}
    
    async def analyze_sentiment_shift(
        self, 
        token_address: str, 
        timeframe: str = "24h"
    ) -> Dict[str, Any]:
        """
        Analyze sentiment shift over specified timeframe
        
        Args:
            token_address: Token contract address
            timeframe: Timeframe to analyze (24h, 7d, 30d)
            
        Returns:
            Dict containing sentiment shift analysis
        """
        try:
            logger.info(f"Analyzing sentiment shift for {token_address} over {timeframe}")
            
            # Convert timeframe to hours
            timeframe_hours = {
                "24h": 24,
                "7d": 168,
                "30d": 720
            }.get(timeframe, 24)
            
            # Get time series data
            time_series = await self.sentiment_service.get_sentiment_time_series(
                token_address, timeframe_hours
            )
            
            if time_series.get('error'):
                return {"error": time_series['error']}
            
            data_points = time_series.get('time_series', [])
            if len(data_points) < 2:
                return {"error": "Insufficient data for shift analysis"}
            
            # Calculate shift metrics
            scores = [point.get('sentiment_score', 0) for point in data_points]
            volumes = [point.get('social_volume', 0) for point in data_points]
            
            first_score = scores[0]
            last_score = scores[-1]
            shift_magnitude = abs(last_score - first_score)
            
            # Calculate trend
            if shift_magnitude < 0.1:
                trend = "stable"
            elif last_score > first_score:
                trend = "improving"
            else:
                trend = "declining"
            
            # Calculate volatility
            peak_score = max(scores)
            valley_score = min(scores)
            volatility = peak_score - valley_score
            
            # Calculate volume trend
            first_volume = volumes[0]
            last_volume = volumes[-1]
            volume_change = ((last_volume - first_volume) / first_volume * 100) if first_volume > 0 else 0
            
            return {
                "token_address": token_address,
                "timeframe": timeframe,
                "shift_magnitude": shift_magnitude,
                "trend": trend,
                "volatility": volatility,
                "peak_score": peak_score,
                "valley_score": valley_score,
                "volume_change_percent": volume_change,
                "data_points": len(data_points),
                "analysis_timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error analyzing sentiment shift: {e}")
            return {"error": str(e)}
    
    async def correlate_social_onchain(
        self, 
        token_address: str, 
        hours: int = 24
    ) -> Dict[str, Any]:
        """
        Correlate social sentiment with onchain activity
        
        Args:
            token_address: Token contract address
            hours: Hours to analyze (default: 24)
            
        Returns:
            Dict containing correlation analysis
        """
        try:
            logger.info(f"Correlating social sentiment with onchain data for {token_address}")
            
            # Get multi-platform sentiment
            sentiment_data = await self.sentiment_service.get_multi_platform_sentiment(token_address)
            
            if sentiment_data.get('error'):
                return {"error": sentiment_data['error']}
            
            # Extract sentiment metrics
            sentiment_metrics = sentiment_data.get('sentiment_metrics', {})
            platform_breakdown = sentiment_data.get('platform_breakdown', {})
            
            overall_score = sentiment_metrics.get('overall_score', 0)
            total_volume = sentiment_metrics.get('total_volume', 0)
            confidence = sentiment_metrics.get('confidence', 0)
            
            # Analyze platform correlations
            platform_correlations = {}
            for platform, data in platform_breakdown.items():
                if data.get('available'):
                    sentiment = data.get('sentiment', 0)
                    engagement = data.get('engagement', data.get('mentions', data.get('posts', data.get('casts', 0))))
                    
                    platform_correlations[platform] = {
                        "sentiment": sentiment,
                        "engagement": engagement,
                        "strength": "high" if abs(sentiment) > 0.5 else "medium" if abs(sentiment) > 0.2 else "low"
                    }
            
            # Calculate overall correlation strength
            avg_sentiment = sum(pc.get('sentiment', 0) for pc in platform_correlations.values()) / len(platform_correlations)
            correlation_strength = "strong" if abs(avg_sentiment) > 0.5 else "moderate" if abs(avg_sentiment) > 0.2 else "weak"
            
            return {
                "token_address": token_address,
                "overall_sentiment": overall_score,
                "total_social_volume": total_volume,
                "confidence": confidence,
                "platform_correlations": platform_correlations,
                "correlation_strength": correlation_strength,
                "analysis_hours": hours,
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error correlating social with onchain: {e}")
            return {"error": str(e)}
    
    async def get_social_narrative(
        self, 
        token_address: str
    ) -> Dict[str, Any]:
        """
        Generate social narrative explaining current sentiment patterns
        
        Args:
            token_address: Token contract address
            
        Returns:
            Dict containing social narrative and insights
        """
        try:
            logger.info(f"Generating social narrative for {token_address}")
            
            # Get comprehensive sentiment data
            sentiment_data = await self.sentiment_service.get_multi_platform_sentiment(token_address)
            
            if sentiment_data.get('error'):
                return {"error": sentiment_data['error']}
            
            # Get social events timeline
            timeline_data = await self.sentiment_service.get_social_events_timeline(token_address, 24)
            
            # Extract key insights
            sentiment_metrics = sentiment_data.get('sentiment_metrics', {})
            platform_breakdown = sentiment_data.get('platform_breakdown', {})
            anomalies = sentiment_data.get('anomalies', [])
            
            # Generate narrative components
            narrative_components = []
            
            # Overall sentiment narrative
            overall_score = sentiment_metrics.get('overall_score', 0)
            if overall_score > 0.3:
                narrative_components.append("The overall social sentiment is very positive")
            elif overall_score > 0.1:
                narrative_components.append("The overall social sentiment is positive")
            elif overall_score < -0.3:
                narrative_components.append("The overall social sentiment is very negative")
            elif overall_score < -0.1:
                narrative_components.append("The overall social sentiment is negative")
            else:
                narrative_components.append("The overall social sentiment is neutral")
            
            # Platform-specific narratives
            for platform, data in platform_breakdown.items():
                if data.get('available'):
                    sentiment = data.get('sentiment', 0)
                    if abs(sentiment) > 0.3:
                        platform_name = platform.title()
                        sentiment_desc = "very positive" if sentiment > 0.3 else "very negative"
                        narrative_components.append(f"{platform_name} shows {sentiment_desc} sentiment")
            
            # Anomaly narratives
            if anomalies:
                narrative_components.append(f"Detected {len(anomalies)} sentiment anomalies")
                for anomaly in anomalies[:2]:  # Top 2 anomalies
                    narrative_components.append(f"- {anomaly.get('description', 'Unknown anomaly')}")
            
            # Combine into narrative
            narrative = ". ".join(narrative_components) + "."
            
            return {
                "token_address": token_address,
                "narrative": narrative,
                "sentiment_score": overall_score,
                "platform_breakdown": platform_breakdown,
                "anomalies_count": len(anomalies),
                "events_timeline": timeline_data.get('events', []),
                "generated_at": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error generating social narrative: {e}")
            return {"error": str(e)}
    
    async def get_trending_social_topics(
        self, 
        platform: str = "all"
    ) -> Dict[str, Any]:
        """
        Get trending social topics across platforms
        
        Args:
            platform: Platform to analyze (reddit, farcaster, news, all)
            
        Returns:
            Dict containing trending topics
        """
        try:
            logger.info(f"Getting trending social topics for platform: {platform}")
            
            # This would typically query a database or API for trending topics
            # For now, we'll return a simplified response
            
            trending_topics = {
                "reddit": [
                    {"topic": "Base ecosystem", "mentions": 150, "sentiment": 0.3},
                    {"topic": "DeFi protocols", "mentions": 120, "sentiment": 0.2},
                    {"topic": "NFT projects", "mentions": 80, "sentiment": -0.1}
                ],
                "farcaster": [
                    {"topic": "Base L2", "mentions": 200, "sentiment": 0.4},
                    {"topic": "Crypto education", "mentions": 90, "sentiment": 0.5},
                    {"topic": "Trading strategies", "mentions": 60, "sentiment": 0.1}
                ],
                "news": [
                    {"topic": "Regulatory updates", "mentions": 50, "sentiment": -0.2},
                    {"topic": "Partnership announcements", "mentions": 30, "sentiment": 0.6},
                    {"topic": "Market analysis", "mentions": 40, "sentiment": 0.0}
                ]
            }
            
            if platform == "all":
                return {
                    "platform": "all",
                    "trending_topics": trending_topics,
                    "total_topics": sum(len(topics) for topics in trending_topics.values()),
                    "generated_at": datetime.now().isoformat()
                }
            else:
                return {
                    "platform": platform,
                    "trending_topics": trending_topics.get(platform, []),
                    "total_topics": len(trending_topics.get(platform, [])),
                    "generated_at": datetime.now().isoformat()
                }
            
        except Exception as e:
            logger.error(f"Error getting trending social topics: {e}")
            return {"error": str(e)}
