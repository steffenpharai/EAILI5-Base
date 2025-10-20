"""
Episodic Memory - Significant learning moments and experiences
Part of the EAILI5 multi-agent memory system
"""

import asyncio
from typing import Dict, List, Any, Optional, Tuple
import logging
from datetime import datetime, timedelta
import json
import numpy as np
from services.redis_service import RedisService

logger = logging.getLogger(__name__)

class EpisodicMemory:
    """
    Stores and retrieves significant learning moments and experiences
    """
    
    def __init__(self, redis_service: RedisService):
        self.redis_service = redis_service
        self.episode_ttl = 86400 * 30  # 30 days TTL for episodes
        
    async def store_episode(
        self,
        user_id: str,
        episode_type: str,
        content: str,
        emotional_context: str = "neutral",
        learning_outcome: str = None,
        metadata: Dict[str, Any] = None
    ) -> str:
        """Store a significant learning episode"""
        try:
            episode_id = f"episode:{user_id}:{datetime.now().timestamp()}"
            
            episode = {
                "episode_id": episode_id,
                "user_id": user_id,
                "episode_type": episode_type,
                "content": content,
                "emotional_context": emotional_context,
                "learning_outcome": learning_outcome,
                "metadata": metadata or {},
                "timestamp": datetime.now().isoformat(),
                "importance_score": self._calculate_importance_score(
                    episode_type, emotional_context, learning_outcome
                )
            }
            
            # Store in Redis with TTL
            await self.redis_service.set(
                episode_id,
                json.dumps(episode, default=str),
                ttl=self.episode_ttl
            )
            
            # Add to user's episode list
            user_episodes_key = f"user_episodes:{user_id}"
            await self.redis_service.lpush(user_episodes_key, episode_id)
            await self.redis_service.expire(user_episodes_key, self.episode_ttl)
            
            logger.info(f"Stored episode {episode_id} for user {user_id}")
            return episode_id
            
        except Exception as e:
            logger.error(f"Error storing episode: {e}")
            return None
    
    async def get_relevant_episodes(
        self,
        user_id: str,
        query: str,
        max_episodes: int = 5,
        episode_types: List[str] = None
    ) -> List[Dict[str, Any]]:
        """Get episodes relevant to a query"""
        try:
            # Get user's episodes
            user_episodes_key = f"user_episodes:{user_id}"
            episode_ids = await self.redis_service.lrange(user_episodes_key, 0, -1)
            
            if not episode_ids:
                return []
            
            episodes = []
            for episode_id in episode_ids:
                episode_data = await self.redis_service.get(episode_id)
                if episode_data:
                    episode = json.loads(episode_data)
                    
                    # Filter by episode type if specified
                    if episode_types and episode.get('episode_type') not in episode_types:
                        continue
                    
                    # Calculate relevance score
                    relevance_score = self._calculate_relevance_score(episode, query)
                    episode['relevance_score'] = relevance_score
                    episodes.append(episode)
            
            # Sort by relevance and importance
            episodes.sort(
                key=lambda x: (x.get('relevance_score', 0) + x.get('importance_score', 0)) / 2,
                reverse=True
            )
            
            return episodes[:max_episodes]
            
        except Exception as e:
            logger.error(f"Error getting relevant episodes: {e}")
            return []
    
    async def get_learning_moments(
        self,
        user_id: str,
        topic: str = None,
        max_moments: int = 10
    ) -> List[Dict[str, Any]]:
        """Get significant learning moments for a user"""
        try:
            user_episodes_key = f"user_episodes:{user_id}"
            episode_ids = await self.redis_service.lrange(user_episodes_key, 0, -1)
            
            learning_moments = []
            for episode_id in episode_ids:
                episode_data = await self.redis_service.get(episode_id)
                if episode_data:
                    episode = json.loads(episode_data)
                    
                    # Filter for learning moments
                    if episode.get('episode_type') in ['breakthrough', 'aha_moment', 'correction', 'success']:
                        if not topic or topic.lower() in episode.get('content', '').lower():
                            learning_moments.append(episode)
            
            # Sort by importance and recency
            learning_moments.sort(
                key=lambda x: (x.get('importance_score', 0), x.get('timestamp', '')),
                reverse=True
            )
            
            return learning_moments[:max_moments]
            
        except Exception as e:
            logger.error(f"Error getting learning moments: {e}")
            return []
    
    async def get_emotional_context(
        self,
        user_id: str,
        timeframe_days: int = 7
    ) -> Dict[str, Any]:
        """Get user's emotional context over time"""
        try:
            since = datetime.now() - timedelta(days=timeframe_days)
            user_episodes_key = f"user_episodes:{user_id}"
            episode_ids = await self.redis_service.lrange(user_episodes_key, 0, -1)
            
            emotional_data = {
                "positive": 0,
                "negative": 0,
                "neutral": 0,
                "frustrated": 0,
                "excited": 0,
                "confused": 0,
                "confident": 0
            }
            
            for episode_id in episode_ids:
                episode_data = await self.redis_service.get(episode_id)
                if episode_data:
                    episode = json.loads(episode_data)
                    episode_time = datetime.fromisoformat(episode.get('timestamp', ''))
                    
                    if episode_time >= since:
                        emotional_context = episode.get('emotional_context', 'neutral')
                        if emotional_context in emotional_data:
                            emotional_data[emotional_context] += 1
            
            # Calculate emotional state
            total_episodes = sum(emotional_data.values())
            if total_episodes > 0:
                emotional_data = {
                    emotion: count / total_episodes 
                    for emotion, count in emotional_data.items()
                }
            
            return emotional_data
            
        except Exception as e:
            logger.error(f"Error getting emotional context: {e}")
            return {}
    
    async def get_learning_progression(
        self,
        user_id: str,
        topic: str
    ) -> List[Dict[str, Any]]:
        """Get learning progression for a specific topic"""
        try:
            user_episodes_key = f"user_episodes:{user_id}"
            episode_ids = await self.redis_service.lrange(user_episodes_key, 0, -1)
            
            topic_episodes = []
            for episode_id in episode_ids:
                episode_data = await self.redis_service.get(episode_id)
                if episode_data:
                    episode = json.loads(episode_data)
                    
                    # Check if episode is related to topic
                    if (topic.lower() in episode.get('content', '').lower() or
                        topic.lower() in episode.get('metadata', {}).get('topics', [])):
                        topic_episodes.append(episode)
            
            # Sort by timestamp
            topic_episodes.sort(key=lambda x: x.get('timestamp', ''))
            
            return topic_episodes
            
        except Exception as e:
            logger.error(f"Error getting learning progression: {e}")
            return []
    
    def _calculate_importance_score(
        self,
        episode_type: str,
        emotional_context: str,
        learning_outcome: str
    ) -> float:
        """Calculate importance score for an episode"""
        try:
            base_scores = {
                'breakthrough': 0.9,
                'aha_moment': 0.8,
                'correction': 0.7,
                'success': 0.6,
                'mistake': 0.5,
                'confusion': 0.4,
                'question': 0.3,
                'general': 0.2
            }
            
            emotional_multipliers = {
                'excited': 1.2,
                'frustrated': 1.1,
                'confused': 1.0,
                'confident': 1.1,
                'neutral': 0.9,
                'negative': 0.8,
                'positive': 1.1
            }
            
            outcome_multipliers = {
                'mastered': 1.3,
                'improved': 1.1,
                'struggling': 0.9,
                'stuck': 0.7,
                'breakthrough': 1.4,
                None: 1.0
            }
            
            base_score = base_scores.get(episode_type, 0.5)
            emotional_mult = emotional_multipliers.get(emotional_context, 1.0)
            outcome_mult = outcome_multipliers.get(learning_outcome, 1.0)
            
            return min(1.0, base_score * emotional_mult * outcome_mult)
            
        except Exception as e:
            logger.error(f"Error calculating importance score: {e}")
            return 0.5
    
    def _calculate_relevance_score(
        self,
        episode: Dict[str, Any],
        query: str
    ) -> float:
        """Calculate relevance score for an episode given a query"""
        try:
            # Simple keyword matching for now
            # In production, this would use embeddings/semantic similarity
            query_words = set(query.lower().split())
            content_words = set(episode.get('content', '').lower().split())
            
            # Calculate Jaccard similarity
            intersection = len(query_words.intersection(content_words))
            union = len(query_words.union(content_words))
            
            if union == 0:
                return 0.0
            
            jaccard_similarity = intersection / union
            
            # Boost score for exact matches
            if any(word in episode.get('content', '').lower() for word in query_words):
                jaccard_similarity += 0.2
            
            return min(1.0, jaccard_similarity)
            
        except Exception as e:
            logger.error(f"Error calculating relevance score: {e}")
            return 0.0
    
    async def cleanup_old_episodes(self, user_id: str, days_old: int = 90) -> int:
        """Clean up old episodes for a user"""
        try:
            cutoff_date = datetime.now() - timedelta(days=days_old)
            user_episodes_key = f"user_episodes:{user_id}"
            episode_ids = await self.redis_service.lrange(user_episodes_key, 0, -1)
            
            cleaned_count = 0
            for episode_id in episode_ids:
                episode_data = await self.redis_service.get(episode_id)
                if episode_data:
                    episode = json.loads(episode_data)
                    episode_time = datetime.fromisoformat(episode.get('timestamp', ''))
                    
                    if episode_time < cutoff_date:
                        await self.redis_service.delete(episode_id)
                        await self.redis_service.lrem(user_episodes_key, 1, episode_id)
                        cleaned_count += 1
            
            logger.info(f"Cleaned up {cleaned_count} old episodes for user {user_id}")
            return cleaned_count
            
        except Exception as e:
            logger.error(f"Error cleaning up episodes: {e}")
            return 0
