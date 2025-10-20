"""
Redis Service - Caching and session management
Part of the DeCrypt backend services
"""

import asyncio
import json
from typing import Dict, List, Any, Optional, Union
import logging
from datetime import datetime, timedelta
import redis.asyncio as redis

logger = logging.getLogger(__name__)

class RedisService:
    """
    Service for Redis caching and session management
    """
    
    def __init__(self):
        self.redis_client = None
        self.connection_url = None
        
        # Cache TTL settings (in seconds)
        self.cache_ttl = {
            "token_data": 300,      # 5 minutes
            "trending_tokens": 600, # 10 minutes
            "token_price": 60,      # 1 minute
            "token_volume": 300,    # 5 minutes
            "token_liquidity": 300, # 5 minutes
            "portfolio": 3600,      # 1 hour
            "user_session": 86400,  # 24 hours
            "ai_response": 1800,    # 30 minutes
            "web_search": 3600     # 1 hour
        }
    
    async def initialize(self, connection_url: str):
        """Initialize Redis connection"""
        try:
            self.connection_url = connection_url
            self.redis_client = redis.from_url(connection_url, decode_responses=True)
            
            # Test connection
            await self.redis_client.ping()
            logger.info("Redis service initialized successfully")
            
        except Exception as e:
            logger.error(f"Error initializing Redis service: {e}")
            raise
    
    async def get(self, key: str) -> Optional[Any]:
        """Get value from Redis cache"""
        try:
            if not self.redis_client:
                return None
            
            value = await self.redis_client.get(key)
            if value:
                return json.loads(value)
            return None
            
        except Exception as e:
            logger.error(f"Error getting from Redis: {e}")
            return None
    
    async def set(self, key: str, value: Any, ttl: Optional[int] = None) -> bool:
        """Set value in Redis cache"""
        try:
            if not self.redis_client:
                return False
            
            json_value = json.dumps(value, default=str)
            
            if ttl:
                await self.redis_client.setex(key, ttl, json_value)
            else:
                await self.redis_client.set(key, json_value)
            
            return True
            
        except Exception as e:
            logger.error(f"Error setting Redis cache: {e}")
            return False
    
    async def setex(self, key: str, ttl: int, value: Any) -> bool:
        """Set key with TTL (for session management)"""
        try:
            if not self.redis_client:
                return False
            
            json_value = json.dumps(value, default=str)
            await self.redis_client.setex(key, ttl, json_value)
            return True
            
        except Exception as e:
            logger.error(f"Error setting key with TTL: {e}")
            return False
    
    async def delete(self, key: str) -> bool:
        """Delete key from Redis cache"""
        try:
            if not self.redis_client:
                return False
            
            result = await self.redis_client.delete(key)
            return result > 0
            
        except Exception as e:
            logger.error(f"Error deleting from Redis: {e}")
            return False
    
    async def exists(self, key: str) -> bool:
        """Check if key exists in Redis"""
        try:
            if not self.redis_client:
                return False
            
            result = await self.redis_client.exists(key)
            return result > 0
            
        except Exception as e:
            logger.error(f"Error checking Redis key existence: {e}")
            return False
    
    async def expire(self, key: str, ttl: int) -> bool:
        """Set expiration for a key"""
        try:
            if not self.redis_client:
                return False
            
            result = await self.redis_client.expire(key, ttl)
            return result
            
        except Exception as e:
            logger.error(f"Error setting Redis expiration: {e}")
            return False
    
    # Token data caching
    async def cache_token_data(self, token_address: str, data: Dict[str, Any]) -> bool:
        """Cache token data"""
        key = f"token_data:{token_address}"
        return await self.set(key, data, self.cache_ttl["token_data"])
    
    async def get_cached_token_data(self, token_address: str) -> Optional[Dict[str, Any]]:
        """Get cached token data"""
        key = f"token_data:{token_address}"
        return await self.get(key)
    
    async def cache_trending_tokens(self, tokens: List[Dict[str, Any]]) -> bool:
        """Cache trending tokens"""
        key = "trending_tokens"
        return await self.set(key, tokens, self.cache_ttl["trending_tokens"])
    
    async def get_cached_trending_tokens(self) -> Optional[List[Dict[str, Any]]]:
        """Get cached trending tokens"""
        key = "trending_tokens"
        return await self.get(key)
    
    async def cache_token_price(self, token_address: str, price: float) -> bool:
        """Cache token price"""
        key = f"token_price:{token_address}"
        return await self.set(key, price, self.cache_ttl["token_price"])
    
    async def get_cached_token_price(self, token_address: str) -> Optional[float]:
        """Get cached token price"""
        key = f"token_price:{token_address}"
        return await self.get(key)
    
    async def cache_token_volume(self, token_address: str, timeframe: str, volume: float) -> bool:
        """Cache token volume"""
        key = f"token_volume:{token_address}:{timeframe}"
        return await self.set(key, volume, self.cache_ttl["token_volume"])
    
    async def get_cached_token_volume(self, token_address: str, timeframe: str) -> Optional[float]:
        """Get cached token volume"""
        key = f"token_volume:{token_address}:{timeframe}"
        return await self.get(key)
    
    async def cache_token_liquidity(self, token_address: str, liquidity: float) -> bool:
        """Cache token liquidity"""
        key = f"token_liquidity:{token_address}"
        return await self.set(key, liquidity, self.cache_ttl["token_liquidity"])
    
    async def get_cached_token_liquidity(self, token_address: str) -> Optional[float]:
        """Get cached token liquidity"""
        key = f"token_liquidity:{token_address}"
        return await self.get(key)
    
    # Portfolio caching
    async def cache_portfolio(self, user_id: str, portfolio: Dict[str, Any]) -> bool:
        """Cache user portfolio"""
        key = f"portfolio:{user_id}"
        return await self.set(key, portfolio, self.cache_ttl["portfolio"])
    
    async def get_cached_portfolio(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get cached user portfolio"""
        key = f"portfolio:{user_id}"
        return await self.get(key)
    
    async def cache_portfolio_performance(self, user_id: str, performance: Dict[str, Any]) -> bool:
        """Cache portfolio performance"""
        key = f"portfolio_performance:{user_id}"
        return await self.set(key, performance, self.cache_ttl["portfolio"])
    
    async def get_cached_portfolio_performance(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get cached portfolio performance"""
        key = f"portfolio_performance:{user_id}"
        return await self.get(key)
    
    # User session management
    async def cache_user_session(self, user_id: str, session_data: Dict[str, Any]) -> bool:
        """Cache user session data"""
        key = f"user_session:{user_id}"
        return await self.set(key, session_data, self.cache_ttl["user_session"])
    
    async def get_cached_user_session(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get cached user session data"""
        key = f"user_session:{user_id}"
        return await self.get(key)
    
    async def update_user_learning_level(self, user_id: str, level: int) -> bool:
        """Update user learning level"""
        key = f"user_session:{user_id}"
        session_data = await self.get(key)
        
        if session_data:
            session_data["learning_level"] = level
            session_data["last_updated"] = datetime.now().isoformat()
            return await self.set(key, session_data, self.cache_ttl["user_session"])
        
        return False
    
    async def get_user_learning_level(self, user_id: str) -> int:
        """Get user learning level"""
        key = f"user_session:{user_id}"
        session_data = await self.get(key)
        
        if session_data:
            return session_data.get("learning_level", 0)
        
        return 0
    
    # AI response caching
    async def cache_ai_response(self, query_hash: str, response: Dict[str, Any]) -> bool:
        """Cache AI response"""
        key = f"ai_response:{query_hash}"
        return await self.set(key, response, self.cache_ttl["ai_response"])
    
    async def get_cached_ai_response(self, query_hash: str) -> Optional[Dict[str, Any]]:
        """Get cached AI response"""
        key = f"ai_response:{query_hash}"
        return await self.get(key)
    
    # Web search caching
    async def cache_web_search(self, query: str, results: List[Dict[str, Any]]) -> bool:
        """Cache web search results"""
        key = f"web_search:{hash(query)}"
        return await self.set(key, results, self.cache_ttl["web_search"])
    
    async def get_cached_web_search(self, query: str) -> Optional[List[Dict[str, Any]]]:
        """Get cached web search results"""
        key = f"web_search:{hash(query)}"
        return await self.get(key)
    
    # Conversation history
    async def cache_conversation(self, user_id: str, conversation: List[Dict[str, Any]]) -> bool:
        """Cache conversation history"""
        key = f"conversation:{user_id}"
        return await self.set(key, conversation, self.cache_ttl["user_session"])
    
    async def get_cached_conversation(self, user_id: str) -> Optional[List[Dict[str, Any]]]:
        """Get cached conversation history"""
        key = f"conversation:{user_id}"
        return await self.get(key)
    
    async def add_to_conversation(self, user_id: str, message: Dict[str, Any]) -> bool:
        """Add message to conversation history"""
        key = f"conversation:{user_id}"
        conversation = await self.get(key) or []
        
        conversation.append({
            **message,
            "timestamp": datetime.now().isoformat()
        })
        
        # Keep only last 50 messages
        if len(conversation) > 50:
            conversation = conversation[-50:]
        
        return await self.set(key, conversation, self.cache_ttl["user_session"])
    
    # Analytics and metrics
    async def increment_counter(self, key: str, amount: int = 1) -> bool:
        """Increment a counter"""
        try:
            if not self.redis_client:
                return False
            
            result = await self.redis_client.incrby(key, amount)
            return result > 0
            
        except Exception as e:
            logger.error(f"Error incrementing counter: {e}")
            return False
    
    async def get_counter(self, key: str) -> int:
        """Get counter value"""
        try:
            if not self.redis_client:
                return 0
            
            value = await self.redis_client.get(key)
            return int(value) if value else 0
            
        except Exception as e:
            logger.error(f"Error getting counter: {e}")
            return 0
    
    async def set_counter(self, key: str, value: int) -> bool:
        """Set counter value"""
        try:
            if not self.redis_client:
                return False
            
            await self.redis_client.set(key, value)
            return True
            
        except Exception as e:
            logger.error(f"Error setting counter: {e}")
            return False
    
    # Health check
    async def health_check(self) -> bool:
        """Check Redis connection health"""
        try:
            if not self.redis_client:
                return False
            
            await self.redis_client.ping()
            return True
            
        except Exception as e:
            logger.error(f"Redis health check failed: {e}")
            return False
    
    async def get_info(self) -> Dict[str, Any]:
        """Get Redis server information"""
        try:
            if not self.redis_client:
                return {}
            
            info = await self.redis_client.info()
            return {
                "redis_version": info.get("redis_version"),
                "used_memory": info.get("used_memory_human"),
                "connected_clients": info.get("connected_clients"),
                "uptime_in_seconds": info.get("uptime_in_seconds")
            }
            
        except Exception as e:
            logger.error(f"Error getting Redis info: {e}")
            return {}
    
    # List operations for memory systems
    async def lpush(self, key: str, *values: Any) -> int:
        """Push values to the head of a list"""
        try:
            if not self.redis_client:
                return 0
            
            json_values = [json.dumps(v, default=str) for v in values]
            result = await self.redis_client.lpush(key, *json_values)
            return result
            
        except Exception as e:
            logger.error(f"Error lpush to Redis: {e}")
            return 0
    
    async def lrange(self, key: str, start: int, stop: int) -> List[Any]:
        """Get a range of elements from a list"""
        try:
            if not self.redis_client:
                return []
            
            values = await self.redis_client.lrange(key, start, stop)
            return [json.loads(v) for v in values]
            
        except Exception as e:
            logger.error(f"Error lrange from Redis: {e}")
            return []
    
    async def ltrim(self, key: str, start: int, stop: int) -> bool:
        """Trim a list to the specified range"""
        try:
            if not self.redis_client:
                return False
            
            await self.redis_client.ltrim(key, start, stop)
            return True
            
        except Exception as e:
            logger.error(f"Error ltrim in Redis: {e}")
            return False
    
    # Set operations for memory systems
    async def sadd(self, key: str, *members: Any) -> int:
        """Add members to a set"""
        try:
            if not self.redis_client:
                return 0
            
            json_members = [json.dumps(m, default=str) for m in members]
            result = await self.redis_client.sadd(key, *json_members)
            return result
            
        except Exception as e:
            logger.error(f"Error sadd to Redis: {e}")
            return 0
    
    async def smembers(self, key: str) -> List[Any]:
        """Get all members of a set"""
        try:
            if not self.redis_client:
                return []
            
            values = await self.redis_client.smembers(key)
            return [json.loads(v) for v in values]
            
        except Exception as e:
            logger.error(f"Error smembers from Redis: {e}")
            return []
    
    async def srem(self, key: str, *members: Any) -> int:
        """Remove members from a set"""
        try:
            if not self.redis_client:
                return 0
            
            json_members = [json.dumps(m, default=str) for m in members]
            result = await self.redis_client.srem(key, *json_members)
            return result
            
        except Exception as e:
            logger.error(f"Error srem from Redis: {e}")
            return 0
    
    # Hash operations for memory systems
    async def hset(self, key: str, field: str, value: Any) -> bool:
        """Set field in a hash"""
        try:
            if not self.redis_client:
                return False
            
            json_value = json.dumps(value, default=str)
            await self.redis_client.hset(key, field, json_value)
            return True
            
        except Exception as e:
            logger.error(f"Error hset in Redis: {e}")
            return False
    
    async def hget(self, key: str, field: str) -> Optional[Any]:
        """Get field from a hash"""
        try:
            if not self.redis_client:
                return None
            
            value = await self.redis_client.hget(key, field)
            return json.loads(value) if value else None
            
        except Exception as e:
            logger.error(f"Error hget from Redis: {e}")
            return None
    
    async def hgetall(self, key: str) -> Dict[str, Any]:
        """Get all fields and values from a hash"""
        try:
            if not self.redis_client:
                return {}
            
            values = await self.redis_client.hgetall(key)
            return {k: json.loads(v) for k, v in values.items()}
            
        except Exception as e:
            logger.error(f"Error hgetall from Redis: {e}")
            return {}
    
    async def hdel(self, key: str, *fields: str) -> int:
        """Delete fields from a hash"""
        try:
            if not self.redis_client:
                return 0
            
            result = await self.redis_client.hdel(key, *fields)
            return result
            
        except Exception as e:
            logger.error(f"Error hdel from Redis: {e}")
            return 0
    
    async def close(self):
        """Close Redis connection"""
        try:
            if self.redis_client:
                await self.redis_client.close()
                logger.info("Redis connection closed")
        except Exception as e:
            logger.error(f"Error closing Redis connection: {e}")
