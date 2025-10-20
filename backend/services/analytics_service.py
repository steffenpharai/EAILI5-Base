"""
Analytics Service - Platform analytics and metrics
Part of the EAILI5 backend services
"""

import asyncio
from typing import Dict, List, Any, Optional
import logging
from datetime import datetime, timedelta
import json

logger = logging.getLogger(__name__)

class AnalyticsService:
    """
    Service for platform analytics and metrics
    """
    
    def __init__(self):
        self.redis_client = None
        self.metrics_cache = {}
        
        # Cache settings
        self.cache_ttl = 300  # 5 minutes
        self.daily_metrics_ttl = 86400  # 24 hours
    
    async def initialize(self, redis_client=None):
        """Initialize analytics service"""
        try:
            self.redis_client = redis_client
            logger.info("Analytics service initialized successfully")
            
        except Exception as e:
            logger.error(f"Error initializing analytics service: {e}")
            raise
    
    async def get_platform_overview(self) -> Dict[str, Any]:
        """Get platform overview statistics"""
        try:
            # Try Redis cache first
            if self.redis_client:
                try:
                    cached_data = await self.redis_client.get("analytics:overview")
                    if cached_data:
                        return json.loads(cached_data)
                except Exception as e:
                    logger.warning(f"Redis get failed: {e}")
            
            # Generate overview metrics
            overview = {
                "total_users": await self._get_total_users(),
                "active_users_24h": await self._get_active_users_24h(),
                "total_lessons_completed": await self._get_total_lessons_completed(),
                "total_achievements_earned": await self._get_total_achievements_earned(),
                "total_trades_simulated": await self._get_total_trades_simulated(),
                "average_learning_level": await self._get_average_learning_level(),
                "top_categories": await self._get_top_categories(),
                "platform_uptime": await self._get_platform_uptime(),
                "last_updated": datetime.now().isoformat()
            }
            
            # Cache the results
            if self.redis_client:
                try:
                    await self.redis_client.set(
                        "analytics:overview", 
                        json.dumps(overview), 
                        ex=self.cache_ttl
                    )
                except Exception as e:
                    logger.warning(f"Redis set failed: {e}")
            
            return overview
            
        except Exception as e:
            logger.error(f"Error getting platform overview: {e}")
            return {}
    
    async def get_user_engagement_metrics(self) -> Dict[str, Any]:
        """Get user engagement metrics"""
        try:
            metrics = {
                "daily_active_users": await self._get_daily_active_users(),
                "weekly_active_users": await self._get_weekly_active_users(),
                "monthly_active_users": await self._get_monthly_active_users(),
                "user_retention_7d": await self._get_user_retention_7d(),
                "user_retention_30d": await self._get_user_retention_30d(),
                "average_session_duration": await self._get_average_session_duration(),
                "lessons_per_user": await self._get_lessons_per_user(),
                "achievements_per_user": await self._get_achievements_per_user(),
                "last_updated": datetime.now().isoformat()
            }
            
            return metrics
            
        except Exception as e:
            logger.error(f"Error getting user engagement metrics: {e}")
            return {}
    
    async def get_content_performance_metrics(self) -> Dict[str, Any]:
        """Get content performance metrics"""
        try:
            metrics = {
                "total_content_items": await self._get_total_content_items(),
                "most_popular_categories": await self._get_most_popular_categories(),
                "completion_rates_by_category": await self._get_completion_rates_by_category(),
                "average_time_per_lesson": await self._get_average_time_per_lesson(),
                "learning_path_progress": await self._get_learning_path_progress(),
                "content_ratings": await self._get_content_ratings(),
                "last_updated": datetime.now().isoformat()
            }
            
            return metrics
            
        except Exception as e:
            logger.error(f"Error getting content performance metrics: {e}")
            return {}
    
    async def get_token_exploration_stats(self) -> Dict[str, Any]:
        """Get token exploration statistics"""
        try:
            stats = {
                "total_tokens_explored": await self._get_total_tokens_explored(),
                "most_popular_tokens": await self._get_most_popular_tokens(),
                "tokens_by_category": await self._get_tokens_by_category(),
                "exploration_trends": await self._get_exploration_trends(),
                "user_token_interactions": await self._get_user_token_interactions(),
                "last_updated": datetime.now().isoformat()
            }
            
            return stats
            
        except Exception as e:
            logger.error(f"Error getting token exploration stats: {e}")
            return {}
    
    # Helper methods for metrics calculation
    async def _get_total_users(self) -> int:
        """Get total number of users"""
        try:
            if self.redis_client:
                # Count unique user keys
                keys = await self.redis_client.keys("progress:*")
                return len(keys)
            return 0
        except Exception as e:
            logger.error(f"Error getting total users: {e}")
            return 0
    
    async def _get_active_users_24h(self) -> int:
        """Get users active in last 24 hours"""
        try:
            if self.redis_client:
                # This would need more sophisticated tracking
                # For now, return a placeholder
                return 0
            return 0
        except Exception as e:
            logger.error(f"Error getting active users: {e}")
            return 0
    
    async def _get_total_lessons_completed(self) -> int:
        """Get total lessons completed"""
        try:
            if self.redis_client:
                # Sum up completed lessons from all users
                total = 0
                keys = await self.redis_client.keys("progress:*")
                for key in keys:
                    progress_data = await self.redis_client.get(key)
                    if progress_data:
                        progress = json.loads(progress_data)
                        total += len(progress.get("completed_lessons", []))
                return total
            return 0
        except Exception as e:
            logger.error(f"Error getting total lessons: {e}")
            return 0
    
    async def _get_total_achievements_earned(self) -> int:
        """Get total achievements earned"""
        try:
            if self.redis_client:
                total = 0
                keys = await self.redis_client.keys("progress:*")
                for key in keys:
                    progress_data = await self.redis_client.get(key)
                    if progress_data:
                        progress = json.loads(progress_data)
                        total += len(progress.get("achievements", []))
                return total
            return 0
        except Exception as e:
            logger.error(f"Error getting total achievements: {e}")
            return 0
    
    async def _get_total_trades_simulated(self) -> int:
        """Get total trades simulated"""
        try:
            if self.redis_client:
                # Count portfolio trades
                keys = await self.redis_client.keys("portfolio:*")
                total = 0
                for key in keys:
                    portfolio_data = await self.redis_client.get(key)
                    if portfolio_data:
                        portfolio = json.loads(portfolio_data)
                        total += len(portfolio.get("trades", []))
                return total
            return 0
        except Exception as e:
            logger.error(f"Error getting total trades: {e}")
            return 0
    
    async def _get_average_learning_level(self) -> float:
        """Get average learning level across all users"""
        try:
            if self.redis_client:
                levels = []
                keys = await self.redis_client.keys("progress:*")
                for key in keys:
                    progress_data = await self.redis_client.get(key)
                    if progress_data:
                        progress = json.loads(progress_data)
                        levels.append(progress.get("learning_level", 0))
                
                if levels:
                    return sum(levels) / len(levels)
            return 0.0
        except Exception as e:
            logger.error(f"Error getting average learning level: {e}")
            return 0.0
    
    async def _get_top_categories(self) -> List[Dict[str, Any]]:
        """Get top learning categories"""
        try:
            # This would need more sophisticated tracking
            return [
                {"category": "basics", "users": 0, "completion_rate": 0.0},
                {"category": "trading", "users": 0, "completion_rate": 0.0},
                {"category": "defi", "users": 0, "completion_rate": 0.0}
            ]
        except Exception as e:
            logger.error(f"Error getting top categories: {e}")
            return []
    
    async def _get_platform_uptime(self) -> str:
        """Get platform uptime"""
        try:
            # This would be calculated from actual uptime tracking
            return "99.9%"
        except Exception as e:
            logger.error(f"Error getting platform uptime: {e}")
            return "Unknown"
    
    # Placeholder methods for other metrics
    async def _get_daily_active_users(self) -> int:
        return 0
    
    async def _get_weekly_active_users(self) -> int:
        return 0
    
    async def _get_monthly_active_users(self) -> int:
        return 0
    
    async def _get_user_retention_7d(self) -> float:
        return 0.0
    
    async def _get_user_retention_30d(self) -> float:
        return 0.0
    
    async def _get_average_session_duration(self) -> int:
        return 0
    
    async def _get_lessons_per_user(self) -> float:
        return 0.0
    
    async def _get_achievements_per_user(self) -> float:
        return 0.0
    
    async def _get_total_content_items(self) -> int:
        return 0
    
    async def _get_most_popular_categories(self) -> List[Dict[str, Any]]:
        return []
    
    async def _get_completion_rates_by_category(self) -> Dict[str, float]:
        return {}
    
    async def _get_average_time_per_lesson(self) -> int:
        return 0
    
    async def _get_learning_path_progress(self) -> Dict[str, Any]:
        return {}
    
    async def _get_content_ratings(self) -> Dict[str, float]:
        return {}
    
    async def _get_total_tokens_explored(self) -> int:
        return 0
    
    async def _get_most_popular_tokens(self) -> List[Dict[str, Any]]:
        return []
    
    async def _get_tokens_by_category(self) -> Dict[str, int]:
        return {}
    
    async def _get_exploration_trends(self) -> List[Dict[str, Any]]:
        return []
    
    async def _get_user_token_interactions(self) -> Dict[str, int]:
        return {}
