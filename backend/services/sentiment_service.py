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
import os
import praw
import httpx
from textblob import TextBlob
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
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
        
        # Initialize Reddit API (PRAW)
        self.reddit = None
        self._init_reddit()
        
        # Initialize sentiment analyzers
        self.vader_analyzer = SentimentIntensityAnalyzer()
        
        # Crypto-specific sentiment keywords
        self.crypto_positive_keywords = [
            "bullish", "moon", "hodl", "diamond hands", "pump", "gains", "breakthrough",
            "adoption", "partnership", "upgrade", "launch", "listing", "surge", "rally"
        ]
        self.crypto_negative_keywords = [
            "bearish", "dump", "paper hands", "crash", "scam", "rug", "hack",
            "regulation", "ban", "decline", "sell-off", "fud", "bear market"
        ]
        
        # Neynar API configuration (proper Farcaster API)
        self.neynar_base_url = "https://api.neynar.com/v2"
        self.neynar_api_key = os.getenv("NEYNAR_API_KEY")
        
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
            # Get token data from CoinGecko service
            token_info = await self.coingecko_service.get_token_info(token_address)
            
            if not token_info:
                logger.warning(f"No CoinGecko data found for {token_address}")
                return {}
            
            return {
                "engagement_score": token_info.get("community_score", 0) * 1000,
                "trending_rank": token_info.get("market_cap_rank", 0),
                "community_data": {
                    "twitter_followers": token_info.get("community_data", {}).get("twitter_followers", 0),
                    "reddit_subscribers": token_info.get("community_data", {}).get("reddit_subscribers", 0),
                    "reddit_active_users": token_info.get("community_data", {}).get("reddit_active_users", 0),
                    "telegram_users": token_info.get("community_data", {}).get("telegram_users", 0)
                }
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
                max_results=10
            )
            
            if not news_results:
                return {}
            
            # Debug: Log the structure of news_results
            logger.info(f"News results type: {type(news_results)}, length: {len(news_results) if isinstance(news_results, list) else 'N/A'}")
            if news_results and len(news_results) > 0:
                logger.info(f"First news result type: {type(news_results[0])}, content: {str(news_results[0])[:100]}")
            
            # Analyze sentiment of news titles and content using class-level keywords
            positive_keywords = self.crypto_positive_keywords
            negative_keywords = self.crypto_negative_keywords
            
            sentiment_scores = []
            total_mentions = 0
            
            for article in news_results[:5]:  # Analyze top 5 articles
                # Handle different response structures from Tavily API
                if isinstance(article, dict):
                    title = article.get("title", "").lower()
                    content = article.get("content", "").lower()
                else:
                    # If article is a string or other type, use it as content
                    title = ""
                    content = str(article).lower()
                
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
            
            if not reddit_results:
                return {}
            
            # Analyze Reddit sentiment using class-level keywords
            positive_keywords = self.crypto_positive_keywords
            negative_keywords = self.crypto_negative_keywords
            
            # Add debug logging for Reddit results
            logger.info(f"Reddit results type: {type(reddit_results)}, length: {len(reddit_results) if isinstance(reddit_results, list) else 'N/A'}")
            if reddit_results and len(reddit_results) > 0:
                logger.info(f"First reddit result type: {type(reddit_results[0])}, content: {str(reddit_results[0])[:100]}")
            
            sentiment_scores = []
            total_mentions = 0
            
            for post in reddit_results:
                # Handle different response structures from Tavily API
                if isinstance(post, dict):
                    title = post.get("title", "").lower()
                    content = post.get("content", "").lower()
                else:
                    # If post is a string or other type, use it as content
                    title = ""
                    content = str(post).lower()
                
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
    
    def _init_reddit(self):
        """Initialize Reddit API with PRAW"""
        try:
            reddit_client_id = os.getenv("REDDIT_CLIENT_ID")
            reddit_client_secret = os.getenv("REDDIT_CLIENT_SECRET")
            reddit_user_agent = os.getenv("REDDIT_USER_AGENT", "EAILI5-SentimentBot/1.0")
            
            if reddit_client_id and reddit_client_secret:
                self.reddit = praw.Reddit(
                    client_id=reddit_client_id,
                    client_secret=reddit_client_secret,
                    user_agent=reddit_user_agent
                )
                logger.info("Reddit API initialized successfully")
            else:
                logger.warning("Reddit credentials not found, using Tavily fallback")
        except Exception as e:
            logger.error(f"Failed to initialize Reddit API: {e}")
    
    async def get_multi_platform_sentiment(self, token_address: str, token_symbol: str = None) -> Dict[str, Any]:
        """
        Get comprehensive sentiment analysis from all platforms with enhanced data
        
        Args:
            token_address: Token contract address
            token_symbol: Token symbol for better search results
            
        Returns:
            Dict containing detailed sentiment data from all platforms
        """
        try:
            logger.info(f"Analyzing multi-platform sentiment for token {token_address}")
            
            # Get data from all sources in parallel (Farcaster disabled - requires paid API)
            tasks = [
                self._get_coingecko_sentiment(token_address, token_symbol),
                self._get_news_sentiment(token_symbol or token_address),
                self._get_reddit_sentiment_enhanced(token_symbol or token_address),
                # DISABLED: self._get_farcaster_sentiment(token_symbol or token_address),
            ]
            
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            # Process results (Farcaster disabled)
            coingecko_data = results[0] if not isinstance(results[0], Exception) else {}
            news_data = results[1] if not isinstance(results[1], Exception) else {}
            reddit_data = results[2] if not isinstance(results[2], Exception) else {}
            # farcaster_data = {}  # DISABLED - requires paid Neynar API
            
            # Calculate enhanced sentiment metrics (Farcaster disabled)
            sentiment_metrics = self._calculate_enhanced_sentiment(
                coingecko_data, news_data, reddit_data
            )
            
            # Generate platform breakdown (Farcaster disabled)
            platform_breakdown = self._generate_platform_breakdown(
                coingecko_data, news_data, reddit_data
            )
            
            # Detect sentiment anomalies
            anomalies = await self._detect_sentiment_anomalies(token_address, sentiment_metrics)
            
            return {
                "sentiment_metrics": sentiment_metrics,
                "platform_breakdown": platform_breakdown,
                "anomalies": anomalies,
                "data_sources": {
                    "coingecko": bool(coingecko_data),
                    "news": bool(news_data),
                    "reddit": bool(reddit_data)
                    # "farcaster": False  # DISABLED - requires paid API
                },
                "last_updated": datetime.now().isoformat(),
                "token_address": token_address,
                "token_symbol": token_symbol
            }
            
        except Exception as e:
            logger.error(f"Error in multi-platform sentiment analysis: {e}")
            return {"error": str(e)}
    
    async def get_sentiment_time_series(self, token_address: str, hours: int = 24) -> Dict[str, Any]:
        """
        Get historical sentiment data for time series analysis
        
        Args:
            token_address: Token contract address
            hours: Number of hours to look back
            
        Returns:
            Dict containing time series sentiment data
        """
        try:
            # TODO: Query historical sentiment from database (future enhancement)
            # For now, return current sentiment snapshot only
            current_sentiment = await self.get_multi_platform_sentiment(token_address)
            
            # Return single data point (current state)
            time_series = [{
                "timestamp": datetime.now().isoformat(),
                "sentiment_score": current_sentiment.get("sentiment_metrics", {}).get("overall_score", 0),
                "social_volume": current_sentiment.get("sentiment_metrics", {}).get("total_volume", 0),
                "platforms": {
                    "reddit": {
                        "score": current_sentiment.get("platform_breakdown", {}).get("reddit", {}).get("sentiment", 0), 
                        "volume": current_sentiment.get("platform_breakdown", {}).get("reddit", {}).get("posts", 0)
                    },
                    "farcaster": {
                        "score": current_sentiment.get("platform_breakdown", {}).get("farcaster", {}).get("sentiment", 0), 
                        "volume": current_sentiment.get("platform_breakdown", {}).get("farcaster", {}).get("casts", 0)
                    },
                    "news": {
                        "score": current_sentiment.get("platform_breakdown", {}).get("news", {}).get("sentiment", 0), 
                        "volume": current_sentiment.get("platform_breakdown", {}).get("news", {}).get("mentions", 0)
                    }
                }
            }]
            
            return {
                "token_address": token_address,
                "time_series": time_series,
                "period_hours": hours,
                "generated_at": datetime.now().isoformat(),
                "note": "Historical data not yet available - showing current snapshot"
            }
            
        except Exception as e:
            logger.error(f"Timeline generation failed: {e}")
            return {"error": str(e)}
    
    async def get_social_events_timeline(self, token_address: str, hours: int = 24) -> Dict[str, Any]:
        """
        Get chronological timeline of social events for causal analysis
        
        Args:
            token_address: Token contract address
            hours: Number of hours to look back
            
        Returns:
            Dict containing chronological social events
        """
        try:
            # Get recent social data
            reddit_events = await self._get_reddit_events_timeline(token_address, hours)
            farcaster_events = await self._get_farcaster_events_timeline(token_address, hours)
            news_events = await self._get_news_events_timeline(token_address, hours)
            
            # Combine and sort all events chronologically
            all_events = reddit_events + farcaster_events + news_events
            all_events.sort(key=lambda x: x.get("timestamp", ""))
            
            return {
                "token_address": token_address,
                "events": all_events,
                "total_events": len(all_events),
                "period_hours": hours,
                "generated_at": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error generating social events timeline: {e}")
            return {"error": str(e)}
    
    async def _get_reddit_sentiment_enhanced(self, search_term: str) -> Dict[str, Any]:
        """Enhanced Reddit sentiment analysis using PRAW"""
        try:
            if not self.reddit:
                # Fallback to Tavily if Reddit API not available
                return await self._get_reddit_sentiment(search_term)
            
            # Search relevant subreddits
            subreddits = ["CryptoCurrency", "ethereum", "bitcoin", "defi", "base"]
            all_posts = []
            
            for subreddit_name in subreddits:
                try:
                    subreddit = self.reddit.subreddit(subreddit_name)
                    # Search for posts containing the search term
                    posts = subreddit.search(search_term, time_filter="day", limit=10)
                    
                    for post in posts:
                        all_posts.append({
                            "title": post.title,
                            "selftext": post.selftext,
                            "score": post.score,
                            "num_comments": post.num_comments,
                            "created_utc": post.created_utc,
                            "subreddit": subreddit_name,
                            "url": post.url
                        })
                except Exception as e:
                    logger.warning(f"Error searching subreddit {subreddit_name}: {e}")
                    continue
            
            if not all_posts:
                return {}
            
            # Analyze sentiment of posts
            sentiment_scores = []
            total_engagement = 0
            
            for post in all_posts:
                text = f"{post['title']} {post['selftext']}"
                
                # Use VADER sentiment analysis
                vader_scores = self.vader_analyzer.polarity_scores(text)
                
                # Calculate crypto-specific sentiment
                crypto_sentiment = self._calculate_crypto_sentiment(text)
                
                # Combine VADER and crypto-specific sentiment
                combined_sentiment = (vader_scores['compound'] + crypto_sentiment) / 2
                sentiment_scores.append(combined_sentiment)
                
                # Calculate engagement score
                engagement = post['score'] + (post['num_comments'] * 2)
                total_engagement += engagement
            
            if sentiment_scores:
                avg_sentiment = sum(sentiment_scores) / len(sentiment_scores)
                return {
                    "reddit_sentiment": avg_sentiment,
                    "reddit_posts": len(all_posts),
                    "reddit_engagement": total_engagement,
                    "sentiment_scores": sentiment_scores,
                    "posts": all_posts[:5]  # Return top 5 posts for context
                }
            
            return {}
            
        except Exception as e:
            logger.warning(f"Enhanced Reddit sentiment analysis failed: {e}")
            return await self._get_reddit_sentiment(search_term)  # Fallback
    
    async def _get_farcaster_sentiment(self, search_term: str) -> Dict[str, Any]:
        """Get sentiment from Farcaster using Neynar API"""
        try:
            if not self.neynar_api_key:
                logger.warning("Neynar API key not configured")
                return {}
            
            # Search for casts mentioning the token using Neynar API
            async with httpx.AsyncClient() as client:
                headers = {
                    "api_key": self.neynar_api_key,  # Neynar uses api_key in header
                    "Content-Type": "application/json"
                }
                
                # Neynar search endpoint
                search_url = f"{self.neynar_base_url}/farcaster/casts/search"
                params = {
                    "q": search_term,
                    "limit": 20
                }
                
                response = await client.get(search_url, headers=headers, params=params)
                
                if response.status_code != 200:
                    logger.warning(f"Neynar API error: {response.status_code}")
                    return {}
                
                data = response.json()
                casts = data.get("result", {}).get("casts", [])
                
                if not casts:
                    return {}
                
                # Analyze sentiment of casts
                sentiment_scores = []
                total_engagement = 0
                
                for cast in casts:
                    text = cast.get("text", "")
                    
                    # Use VADER sentiment analysis
                    vader_scores = self.vader_analyzer.polarity_scores(text)
                    crypto_sentiment = self._calculate_crypto_sentiment(text)
                    combined_sentiment = (vader_scores['compound'] + crypto_sentiment) / 2
                    
                    sentiment_scores.append(combined_sentiment)
                    
                    # Calculate engagement
                    reactions = cast.get("reactions", {})
                    likes = reactions.get("likes_count", 0)
                    recasts = reactions.get("recasts_count", 0)
                    replies = cast.get("replies", {}).get("count", 0)
                    total_engagement += likes + recasts + replies
                
                if sentiment_scores:
                    avg_sentiment = sum(sentiment_scores) / len(sentiment_scores)
                    return {
                        "farcaster_sentiment": avg_sentiment,
                        "farcaster_casts": len(casts),
                        "farcaster_engagement": total_engagement,
                        "sentiment_scores": sentiment_scores
                    }
                
                return {}
                
        except Exception as e:
            logger.warning(f"Farcaster sentiment analysis failed: {e}")
            return {}
    
    def _calculate_crypto_sentiment(self, text: str) -> float:
        """Calculate crypto-specific sentiment score"""
        text_lower = text.lower()
        
        positive_count = sum(1 for keyword in self.crypto_positive_keywords if keyword in text_lower)
        negative_count = sum(1 for keyword in self.crypto_negative_keywords if keyword in text_lower)
        
        if positive_count + negative_count == 0:
            return 0.0
        
        return (positive_count - negative_count) / (positive_count + negative_count)
    
    def _calculate_enhanced_sentiment(self, coingecko_data: Dict, news_data: Dict, reddit_data: Dict) -> Dict[str, Any]:
        """Calculate enhanced sentiment metrics"""
        scores = []
        weights = []
        volumes = []
        
        # Platform-specific scoring
        if coingecko_data:
            engagement_score = coingecko_data.get("engagement_score", 0)
            if engagement_score > 0:
                normalized_engagement = min(engagement_score / 10000, 1.0)
                scores.append(normalized_engagement)
                weights.append(0.2)
                volumes.append(engagement_score)
        
        if news_data and "news_sentiment" in news_data:
            scores.append(news_data["news_sentiment"])
            weights.append(0.3)
            volumes.append(news_data.get("news_mentions", 0) * 10)
        
        if reddit_data and "reddit_sentiment" in reddit_data:
            scores.append(reddit_data["reddit_sentiment"])
            weights.append(0.3)
            volumes.append(reddit_data.get("reddit_engagement", 0))
        
        # DISABLED: Farcaster requires paid Neynar API
        # if farcaster_data and "farcaster_sentiment" in farcaster_data:
        #     scores.append(farcaster_data["farcaster_sentiment"])
        #     weights.append(0.2)
        #     volumes.append(farcaster_data.get("farcaster_engagement", 0))
        
        if not scores:
            return {
                "overall_score": 0.0,
                "total_volume": 0,
                "confidence": 0.0,
                "platform_scores": {}
            }
        
        # Calculate weighted average
        weighted_sum = sum(score * weight for score, weight in zip(scores, weights))
        total_weight = sum(weights)
        overall_score = weighted_sum / total_weight if total_weight > 0 else 0.0
        
        # Calculate confidence based on data availability (3 platforms max)
        confidence = len(scores) / 3.0  # Max confidence when all 3 platforms have data
        
        return {
            "overall_score": overall_score,
            "total_volume": sum(volumes),
            "confidence": confidence,
            "platform_scores": {
                "coingecko": coingecko_data.get("engagement_score", 0) / 10000 if coingecko_data else 0,
                "news": news_data.get("news_sentiment", 0) if news_data else 0,
                "reddit": reddit_data.get("reddit_sentiment", 0) if reddit_data else 0
                # DISABLED: "farcaster": 0  # Requires paid Neynar API
            }
        }
    
    def _generate_platform_breakdown(self, coingecko_data: Dict, news_data: Dict, reddit_data: Dict) -> Dict[str, Any]:
        """Generate detailed platform breakdown"""
        return {
            "coingecko": {
                "available": bool(coingecko_data),
                "engagement_score": coingecko_data.get("engagement_score", 0) if coingecko_data else 0,
                "trending_rank": coingecko_data.get("trending_rank", 0) if coingecko_data else 0
            },
            "news": {
                "available": bool(news_data),
                "sentiment": news_data.get("news_sentiment", 0) if news_data else 0,
                "mentions": news_data.get("news_mentions", 0) if news_data else 0
            },
            "reddit": {
                "available": bool(reddit_data),
                "sentiment": reddit_data.get("reddit_sentiment", 0) if reddit_data else 0,
                "posts": reddit_data.get("reddit_posts", 0) if reddit_data else 0,
                "engagement": reddit_data.get("reddit_engagement", 0) if reddit_data else 0
            },
            # DISABLED: Farcaster requires paid Neynar API
            # "farcaster": {
            #     "available": False,
            #     "sentiment": 0,
            #     "casts": 0,
            #     "engagement": 0
            # }
        }
    
    async def _detect_sentiment_anomalies(self, token_address: str, current_metrics: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Detect sentiment anomalies using 3-sigma rule"""
        try:
            # This would typically compare against historical baselines
            # For now, we'll implement basic anomaly detection
            
            anomalies = []
            overall_score = current_metrics.get("overall_score", 0)
            total_volume = current_metrics.get("total_volume", 0)
            
            # Detect sentiment spikes (score > 0.7 or < -0.7)
            if abs(overall_score) > 0.7:
                anomalies.append({
                    "type": "sentiment_spike",
                    "severity": "high" if abs(overall_score) > 0.8 else "medium",
                    "description": f"Sentiment score {overall_score:.2f} is {'very positive' if overall_score > 0 else 'very negative'}",
                    "timestamp": datetime.now().isoformat()
                })
            
            # Detect volume spikes (would need historical data for proper 3-sigma)
            if total_volume > 1000:  # Arbitrary threshold for demo
                anomalies.append({
                    "type": "volume_spike",
                    "severity": "medium",
                    "description": f"Social volume {total_volume} is significantly higher than normal",
                    "timestamp": datetime.now().isoformat()
                })
            
            return anomalies
            
        except Exception as e:
            logger.error(f"Error detecting sentiment anomalies: {e}")
            return []
    
    async def _get_reddit_events_timeline(self, token_address: str, hours: int) -> List[Dict[str, Any]]:
        """Get Reddit events timeline"""
        # Simplified implementation - would query Reddit API for historical posts
        return []
    
    async def _get_farcaster_events_timeline(self, token_address: str, hours: int) -> List[Dict[str, Any]]:
        """Get Farcaster events timeline"""
        # Simplified implementation - would query Farcaster API for historical casts
        return []
    
    async def _get_news_events_timeline(self, token_address: str, hours: int) -> List[Dict[str, Any]]:
        """Get news events timeline"""
        # Simplified implementation - would query news APIs for historical articles
        return []
    
    def get_sentiment_context_for_narrative(
        self,
        token_address: str,
        token_symbol: str,
        sentiment_data: Dict[str, Any]
    ) -> str:
        """Build context string for LangGraph narrative generation"""
        try:
            # Extract key metrics
            metrics = sentiment_data.get('sentiment_metrics', {})
            breakdown = sentiment_data.get('platform_breakdown', {})
            anomalies = sentiment_data.get('anomalies', [])
            
            # Build context for LangGraph agent
            context = f"""Generate a causal narrative explaining social sentiment for {token_symbol or 'token ' + token_address[:10]}.

SENTIMENT METRICS:
- Overall Score: {metrics.get('overall_score', 0):.3f} (-1 to +1 scale)
- Confidence: {metrics.get('confidence', 0):.0%}
- Total Volume: {metrics.get('total_volume', 0)} mentions

PLATFORM BREAKDOWN:
- Reddit: {breakdown.get('reddit', {}).get('sentiment', 0):.2f} sentiment, {breakdown.get('reddit', {}).get('posts', 0)} posts
- News: {breakdown.get('news', {}).get('sentiment', 0):.2f} sentiment, {breakdown.get('news', {}).get('mentions', 0)} articles
- CoinGecko: {breakdown.get('coingecko', {}).get('engagement_score', 0)} community engagement

ANOMALIES: {len(anomalies)} detected
{chr(10).join([f"- {a.get('description', '')}" for a in anomalies[:3]])}

Explain in 3-4 sentences: what this sentiment indicates, which platforms drive it (cause), what it means for community perception (effect), and key trends to watch."""

            return context
            
        except Exception as e:
            logger.error(f"Error building sentiment context: {e}")
            return f"Generate a narrative explaining social sentiment for {token_symbol or token_address}."
