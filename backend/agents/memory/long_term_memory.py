"""
Long-Term Memory - Persistent user knowledge and profiles
Part of the EAILI5 multi-agent memory system
"""

import asyncio
from typing import Dict, List, Any, Optional
import logging
from datetime import datetime, timedelta
import json
import asyncpg
from sqlalchemy import text
from services.redis_service import RedisService

logger = logging.getLogger(__name__)

class LongTermMemory:
    """
    Manages persistent user knowledge, preferences, and learning history
    """
    
    def __init__(self, session_factory, redis_service: RedisService):
        self.session_factory = session_factory
        self.redis_service = redis_service
        self.cache_ttl = 3600  # 1 hour cache TTL
        
    async def initialize(self) -> None:
        """Initialize long-term memory tables"""
        try:
            async with self.session_factory() as session:
                # Create user_profiles table (avoiding catalog corruption)
                await session.execute(text("""
                    CREATE TABLE IF NOT EXISTS user_profiles (
                        user_id VARCHAR PRIMARY KEY,
                        learning_level INTEGER DEFAULT 0,
                        topics_learned JSONB DEFAULT '[]',
                        preferences JSONB DEFAULT '{}',
                        interaction_count INTEGER DEFAULT 0,
                        last_active TIMESTAMP DEFAULT NOW(),
                        memory_summary TEXT DEFAULT '',
                        created_at TIMESTAMP DEFAULT NOW(),
                        updated_at TIMESTAMP DEFAULT NOW()
                    )
                """))
                
                # Create conversation_history table
                await session.execute(text("""
                    CREATE TABLE IF NOT EXISTS conversation_history (
                        id SERIAL PRIMARY KEY,
                        user_id VARCHAR NOT NULL,
                        session_id VARCHAR,
                        message TEXT NOT NULL,
                        response TEXT NOT NULL,
                        intent VARCHAR,
                        agent_used VARCHAR,
                        timestamp TIMESTAMP DEFAULT NOW(),
                        metadata JSONB DEFAULT '{}',
                        importance_score FLOAT DEFAULT 0.5
                    )
                """))
                
                # Create indexes
                await session.execute(text("""
                    CREATE INDEX IF NOT EXISTS idx_conversation_user_id 
                    ON conversation_history(user_id)
                """))
                
                await session.execute(text("""
                    CREATE INDEX IF NOT EXISTS idx_conversation_timestamp 
                    ON conversation_history(timestamp)
                """))
                
                await session.execute(text("""
                    CREATE INDEX IF NOT EXISTS idx_conversation_importance 
                    ON conversation_history(importance_score)
                """))
                
                await session.commit()
                
            logger.info("Long-term memory tables initialized successfully")
            
        except Exception as e:
            logger.error(f"Error initializing long-term memory: {e}")
            raise
    
    async def get_user_profile(self, user_id: str) -> Dict[str, Any]:
        """Get user profile from cache or database"""
        try:
            # Try cache first
            cache_key = f"user_profile:{user_id}"
            cached_profile = await self.redis_service.get(cache_key)
            
            if cached_profile:
                return json.loads(cached_profile)
            
            # Get from database
            async with self.session_factory() as session:
                result = await session.execute(
                    text("SELECT * FROM user_profiles WHERE user_id = :user_id"),
                    {"user_id": user_id}
                )
                row = result.first()
                
                if row:
                    profile = row._asdict()
                    # Cache the result
                    await self.redis_service.set(
                        cache_key, 
                        json.dumps(profile, default=str),
                        ttl=self.cache_ttl
                    )
                    return profile
                else:
                    # Create new user profile
                    return await self._create_user_profile(user_id)
                    
        except Exception as e:
            logger.error(f"Error getting user profile: {e}")
            return await self._create_user_profile(user_id)
    
    async def update_user_profile(
        self, 
        user_id: str, 
        updates: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Update user profile"""
        try:
            # Get current profile
            current_profile = await self.get_user_profile(user_id)
            
            # Merge updates
            updated_profile = {**current_profile, **updates}
            updated_profile['updated_at'] = datetime.now()
            
            # Update database
            async with self.session_factory() as session:
                await session.execute(text("""
                    INSERT INTO user_profiles (
                        user_id, learning_level, topics_learned, preferences,
                        interaction_count, last_active, memory_summary, updated_at
                    ) VALUES (:user_id, :learning_level, :topics_learned, :preferences,
                        :interaction_count, :last_active, :memory_summary, :updated_at)
                    ON CONFLICT (user_id) DO UPDATE SET
                        learning_level = EXCLUDED.learning_level,
                        topics_learned = EXCLUDED.topics_learned,
                        preferences = EXCLUDED.preferences,
                        interaction_count = EXCLUDED.interaction_count,
                        last_active = EXCLUDED.last_active,
                        memory_summary = EXCLUDED.memory_summary,
                        updated_at = EXCLUDED.updated_at
                """), {
                    "user_id": user_id,
                    "learning_level": updated_profile.get('learning_level', 0),
                    "topics_learned": json.dumps(updated_profile.get('topics_learned', [])),
                    "preferences": json.dumps(updated_profile.get('preferences', {})),
                    "interaction_count": updated_profile.get('interaction_count', 0),
                    "last_active": updated_profile.get('last_active', datetime.now()),
                    "memory_summary": updated_profile.get('memory_summary', ''),
                    "updated_at": updated_profile.get('updated_at', datetime.now())
                })
                await session.commit()
            
            # Update cache
            cache_key = f"user_profile:{user_id}"
            await self.redis_service.set(
                cache_key,
                json.dumps(updated_profile, default=str),
                ttl=self.cache_ttl
            )
            
            logger.info(f"Updated user profile for {user_id}")
            return updated_profile
            
        except Exception as e:
            logger.error(f"Error updating user profile: {e}")
            return await self.get_user_profile(user_id)
    
    async def store_conversation(
        self,
        user_id: str,
        session_id: str,
        message: str,
        response: str,
        intent: str = None,
        agent_used: str = None,
        metadata: Dict[str, Any] = None,
        importance_score: float = 0.5
    ) -> None:
        """Store conversation in long-term memory"""
        try:
            async with self.db_pool.acquire() as conn:
                await conn.execute("""
                    INSERT INTO conversation_history (
                        user_id, session_id, message, response, intent,
                        agent_used, metadata, importance_score
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                """,
                user_id, session_id, message, response, intent,
                agent_used, json.dumps(metadata or {}), importance_score
                )
            
            # Update user interaction count
            await self._increment_interaction_count(user_id)
            
            logger.debug(f"Stored conversation for user {user_id}")
            
        except Exception as e:
            logger.error(f"Error storing conversation: {e}")
    
    async def get_conversation_history(
        self,
        user_id: str,
        limit: int = 50,
        since: datetime = None
    ) -> List[Dict[str, Any]]:
        """Get conversation history for a user"""
        try:
            async with self.db_pool.acquire() as conn:
                query = """
                    SELECT * FROM conversation_history 
                    WHERE user_id = $1
                """
                params = [user_id]
                
                if since:
                    query += " AND timestamp >= $2"
                    params.append(since)
                
                query += " ORDER BY timestamp DESC LIMIT $2"
                if not since:
                    params.append(limit)
                else:
                    params.append(limit)
                
                rows = await conn.fetch(query, *params)
                return [dict(row) for row in rows]
                
        except Exception as e:
            logger.error(f"Error getting conversation history: {e}")
            return []
    
    async def get_learning_progress(self, user_id: str) -> Dict[str, Any]:
        """Get user's learning progress and statistics"""
        try:
            profile = await self.get_user_profile(user_id)
            
            # Get conversation stats
            async with self.db_pool.acquire() as conn:
                # Total interactions
                total_interactions = await conn.fetchval(
                    "SELECT COUNT(*) FROM conversation_history WHERE user_id = $1",
                    user_id
                )
                
                # Recent activity (last 7 days)
                week_ago = datetime.now() - timedelta(days=7)
                recent_interactions = await conn.fetchval(
                    "SELECT COUNT(*) FROM conversation_history WHERE user_id = $1 AND timestamp >= $2",
                    user_id, week_ago
                )
                
                # Most used agents
                agent_usage = await conn.fetch(
                    "SELECT agent_used, COUNT(*) as count FROM conversation_history WHERE user_id = $1 AND agent_used IS NOT NULL GROUP BY agent_used ORDER BY count DESC",
                    user_id
                )
                
                # Topics discussed
                topics = await conn.fetch(
                    "SELECT intent, COUNT(*) as count FROM conversation_history WHERE user_id = $1 AND intent IS NOT NULL GROUP BY intent ORDER BY count DESC",
                    user_id
                )
            
            return {
                "learning_level": profile.get('learning_level', 0),
                "topics_learned": profile.get('topics_learned', []),
                "total_interactions": total_interactions or 0,
                "recent_interactions": recent_interactions or 0,
                "agent_usage": [dict(row) for row in agent_usage],
                "topics_discussed": [dict(row) for row in topics],
                "last_active": profile.get('last_active'),
                "interaction_count": profile.get('interaction_count', 0)
            }
            
        except Exception as e:
            logger.error(f"Error getting learning progress: {e}")
            return {}
    
    async def _create_user_profile(self, user_id: str) -> Dict[str, Any]:
        """Create a new user profile"""
        try:
            profile = {
                "user_id": user_id,
                "learning_level": 0,
                "topics_learned": [],
                "preferences": {},
                "interaction_count": 0,
                "last_active": datetime.now(),
                "memory_summary": "",
                "created_at": datetime.now(),
                "updated_at": datetime.now()
            }
            
            # Store in database
            async with self.db_pool.acquire() as conn:
                await conn.execute("""
                    INSERT INTO user_profiles (
                        user_id, learning_level, topics_learned, preferences,
                        interaction_count, last_active, memory_summary, created_at, updated_at
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                """,
                user_id, 0, json.dumps([]), json.dumps({}),
                0, datetime.now(), "", datetime.now(), datetime.now()
                )
            
            # Cache the profile
            cache_key = f"user_profile:{user_id}"
            await self.redis_service.set(
                cache_key,
                json.dumps(profile, default=str),
                ttl=self.cache_ttl
            )
            
            logger.info(f"Created new user profile for {user_id}")
            return profile
            
        except Exception as e:
            logger.error(f"Error creating user profile: {e}")
            return {
                "user_id": user_id,
                "learning_level": 0,
                "topics_learned": [],
                "preferences": {},
                "interaction_count": 0,
                "last_active": datetime.now(),
                "memory_summary": "",
                "created_at": datetime.now(),
                "updated_at": datetime.now()
            }
    
    async def _increment_interaction_count(self, user_id: str) -> None:
        """Increment user interaction count"""
        try:
            async with self.db_pool.acquire() as conn:
                await conn.execute("""
                    UPDATE user_profiles 
                    SET interaction_count = interaction_count + 1,
                        last_active = NOW(),
                        updated_at = NOW()
                    WHERE user_id = $1
                """, user_id)
            
            # Invalidate cache
            cache_key = f"user_profile:{user_id}"
            await self.redis_service.delete(cache_key)
            
        except Exception as e:
            logger.error(f"Error incrementing interaction count: {e}")
    
    async def forget_user_data(self, user_id: str) -> bool:
        """GDPR compliance - delete all user data"""
        try:
            async with self.db_pool.acquire() as conn:
                # Delete conversation history
                await conn.execute(
                    "DELETE FROM conversation_history WHERE user_id = $1",
                    user_id
                )
                
                # Delete user profile
                await conn.execute(
                    "DELETE FROM user_profiles WHERE user_id = $1",
                    user_id
                )
            
            # Clear cache
            cache_key = f"user_profile:{user_id}"
            await self.redis_service.delete(cache_key)
            
            logger.info(f"Deleted all data for user {user_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error deleting user data: {e}")
            return False
