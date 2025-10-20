"""
Sentiment Service - Social sentiment analysis for tokens
Part of the EAILI5 backend services
"""

import asyncio
import aiohttp
from typing import Dict, List, Any, Optional
import logging
from datetime import datetime, timedelta
import json
import re
from services.coingecko_service import CoinGeckoService
from services.tavily_service import TavilyService

logger = logging.getLogger(__name__)

class SentimentService:
    """
    Service for aggregating social sentiment data from multiple sources
    """
    
    def __init__(self, coingecko_service: CoinGeckoService, tavily_service: TavilyService):
        self.coingecko_service = coingecko_service
        self.tavily_service = tavily_service
        
    async def get_token_sentiment(self, token_address: str, token_symbol: str = None) -> Dict[str, Any]:
        """
        Get comprehensive sentiment analysis for a token
        
        Args:
            token_address: Token contract address
            token_symbol: Token symbol for better search results
            
        Returns:
            Dict containing sentiment data from multiple sources
        """
        try:
            logger.info(f"Analyzing sentiment for token {token_address}")
            
            # Get data from multiple sources in parallel
            tasks = [
                self._get_coingecko_sentiment(token_address, token_symbol),
                self._get_news_sentiment(token_symbol or token_address),
                self._get_reddit_sentiment(token_symbol or token_address),
            ]
            
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            # Process results
            coingecko_data = results[0] if not isinstance(results[0], Exception) else {}
            news_data = results[1] if not isinstance(results[1], Exception) else {}
            reddit_data = results[2] if not isinstance(results[2], Exception) else {}
            
            # Calculate overall sentiment score
            sentiment_score = self._calculate_sentiment_score(
                coingecko_data, news_data, reddit_data
            )
            
            # Aggregate social volume
            social_volume = self._calculate_social_volume(
                coingecko_data, news_data, reddit_data
            )
            
            # Generate sentiment breakdown
            sentiment_breakdown = self._generate_sentiment_breakdown(
                coingecko_data, news_data, reddit_data
            )
            
            return {
                "sentiment_score": sentiment_score,
                "social_volume": social_volume,
                "trending_rank": coingecko_data.get("trending_rank", 0),
                "mentions_24h": social_volume,
                "sentiment_breakdown": sentiment_breakdown,
                "data_sources": {
                    "coingecko": bool(coingecko_data),
                    "news": bool(news_data),
                    "reddit": bool(reddit_data)
                },
                "last_updated": datetime.now().isoformat(),
                "token_address": token_address,
                "token_symbol": token_symbol
            }
            
        except Exception as e:
            logger.error(f"Error analyzing sentiment for {token_address}: {e}")
            return {
                "sentiment_score": 0.0,
                "social_volume": 0,
                "trending_rank": 0,
                "mentions_24h": 0,
                "sentiment_breakdown": {"positive": 0.33, "neutral": 0.34, "negative": 0.33},
                "data_sources": {"coingecko": False, "news": False, "reddit": False},
                "last_updated": datetime.now().isoformat(),
                "token_address": token_address,
                "token_symbol": token_symbol,
                "error": str(e)
            }
    
    async def _get_coingecko_sentiment(self, token_address: str, token_symbol: str = None) -> Dict[str, Any]:
        """Get sentiment data from CoinGecko community stats"""
        try:
            # Get token details from CoinGecko
            token_data = await self.coingecko_service.get_token_details(token_address)
            
            if not token_data:
                return {}
            
            # Extract community sentiment indicators
            community_data = token_data.get("community_data", {})
            
            # Calculate sentiment from community metrics
            sentiment_indicators = {
                "twitter_followers": community_data.get("twitter_followers", 0),
                "reddit_subscribers": community_data.get("reddit_subscribers", 0),
                "reddit_active_users": community_data.get("reddit_active_users", 0),
                "telegram_users": community_data.get("telegram_users", 0),
            }
            
            # Calculate engagement score
            total_engagement = sum(sentiment_indicators.values())
            
            # Get trending status
            trending_rank = token_data.get("market_cap_rank", 0)
            is_trending = trending_rank > 0 and trending_rank <= 100
            
            return {
                "engagement_score": total_engagement,
                "trending_rank": trending_rank,
                "is_trending": is_trending,
                "community_size": total_engagement,
                "sentiment_indicators": sentiment_indicators
            }
            
        except Exception as e:
            logger.warning(f"CoinGecko sentiment analysis failed: {e}")
            return {}
    
    async def _get_news_sentiment(self, search_term: str) -> Dict[str, Any]:
        """Get sentiment from news articles using Tavily search"""
        try:
            # Search for recent news about the token
            search_query = f"{search_term} cryptocurrency news sentiment"
            news_results = await self.tavily_service.search(
                query=search_query,
                max_results=10,
                include_domains=["cointelegraph.com", "coindesk.com", "decrypt.co", "theblock.co"]
            )
            
            if not news_results or not news_results.get("results"):
                return {}
            
            # Analyze sentiment of news titles and content
            positive_keywords = ["bullish", "surge", "rally", "moon", "breakthrough", "adoption", "partnership"]
            negative_keywords = ["crash", "dump", "bearish", "decline", "scam", "hack", "regulation"]
            
            sentiment_scores = []
            total_mentions = 0
            
            for article in news_results["results"][:5]:  # Analyze top 5 articles
                title = article.get("title", "").lower()
                content = article.get("content", "").lower()
                text = f"{title} {content}"
                
                # Count positive and negative keywords
                positive_count = sum(1 for keyword in positive_keywords if keyword in text)
                negative_count = sum(1 for keyword in negative_keywords if keyword in text)
                
                # Calculate article sentiment (-1 to 1)
                if positive_count + negative_count > 0:
                    article_sentiment = (positive_count - negative_count) / (positive_count + negative_count)
                    sentiment_scores.append(article_sentiment)
                    total_mentions += 1
            
            if sentiment_scores:
                avg_sentiment = sum(sentiment_scores) / len(sentiment_scores)
                return {
                    "news_sentiment": avg_sentiment,
                    "news_mentions": total_mentions,
                    "sentiment_scores": sentiment_scores
                }
            
            return {}
            
        except Exception as e:
            logger.warning(f"News sentiment analysis failed: {e}")
            return {}
    
    async def _get_reddit_sentiment(self, search_term: str) -> Dict[str, Any]:
        """Get sentiment from Reddit discussions (simplified implementation)"""
        try:
            # For now, use Tavily to search Reddit discussions
            # In production, you'd use PRAW (Python Reddit API Wrapper)
            search_query = f"site:reddit.com {search_term} cryptocurrency discussion"
            reddit_results = await self.tavily_service.search(
                query=search_query,
                max_results=5
            )
            
            if not reddit_results or not reddit_results.get("results"):
                return {}
            
            # Analyze Reddit sentiment
            positive_keywords = ["bullish", "moon", "hodl", "diamond hands", "pump", "gains"]
            negative_keywords = ["bearish", "dump", "paper hands", "crash", "scam", "rug"]
            
            sentiment_scores = []
            total_mentions = 0
            
            for post in reddit_results["results"]:
                title = post.get("title", "").lower()
                content = post.get("content", "").lower()
                text = f"{title} {content}"
                
                positive_count = sum(1 for keyword in positive_keywords if keyword in text)
                negative_count = sum(1 for keyword in negative_keywords if keyword in text)
                
                if positive_count + negative_count > 0:
                    post_sentiment = (positive_count - negative_count) / (positive_count + negative_count)
                    sentiment_scores.append(post_sentiment)
                    total_mentions += 1
            
            if sentiment_scores:
                avg_sentiment = sum(sentiment_scores) / len(sentiment_scores)
                return {
                    "reddit_sentiment": avg_sentiment,
                    "reddit_mentions": total_mentions,
                    "sentiment_scores": sentiment_scores
                }
            
            return {}
            
        except Exception as e:
            logger.warning(f"Reddit sentiment analysis failed: {e}")
            return {}
    
    def _calculate_sentiment_score(self, coingecko_data: Dict, news_data: Dict, reddit_data: Dict) -> float:
        """Calculate overall sentiment score (-1 to 1)"""
        scores = []
        weights = []
        
        # CoinGecko community engagement (weight: 0.3)
        if coingecko_data:
            engagement_score = coingecko_data.get("engagement_score", 0)
            if engagement_score > 0:
                # Normalize engagement to sentiment (-1 to 1)
                # Higher engagement = more positive sentiment
                normalized_engagement = min(engagement_score / 10000, 1.0)  # Cap at 10k engagement
                scores.append(normalized_engagement)
                weights.append(0.3)
        
        # News sentiment (weight: 0.4)
        if news_data and "news_sentiment" in news_data:
            scores.append(news_data["news_sentiment"])
            weights.append(0.4)
        
        # Reddit sentiment (weight: 0.3)
        if reddit_data and "reddit_sentiment" in reddit_data:
            scores.append(reddit_data["reddit_sentiment"])
            weights.append(0.3)
        
        if not scores:
            return 0.0
        
        # Weighted average
        weighted_sum = sum(score * weight for score, weight in zip(scores, weights))
        total_weight = sum(weights)
        
        return weighted_sum / total_weight if total_weight > 0 else 0.0
    
    def _calculate_social_volume(self, coingecko_data: Dict, news_data: Dict, reddit_data: Dict) -> int:
        """Calculate total social volume across all sources"""
        volume = 0
        
        if coingecko_data:
            volume += coingecko_data.get("community_size", 0)
        
        if news_data:
            volume += news_data.get("news_mentions", 0) * 10  # Weight news mentions
        
        if reddit_data:
            volume += reddit_data.get("reddit_mentions", 0) * 5  # Weight Reddit mentions
        
        return volume
    
    def _generate_sentiment_breakdown(self, coingecko_data: Dict, news_data: Dict, reddit_data: Dict) -> Dict[str, float]:
        """Generate sentiment breakdown percentages"""
        total_positive = 0
        total_negative = 0
        total_neutral = 0
        
        # Analyze each source
        for data in [coingecko_data, news_data, reddit_data]:
            if not data:
                continue
                
            # Extract sentiment indicators
            sentiment_score = data.get("news_sentiment", data.get("reddit_sentiment", 0))
            
            if sentiment_score > 0.1:
                total_positive += 1
            elif sentiment_score < -0.1:
                total_negative += 1
            else:
                total_neutral += 1
        
        total = total_positive + total_negative + total_neutral
        
        if total == 0:
            return {"positive": 0.33, "neutral": 0.34, "negative": 0.33}
        
        return {
            "positive": total_positive / total,
            "neutral": total_neutral / total,
            "negative": total_negative / total
        }
