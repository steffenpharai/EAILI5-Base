"""
Memory Manager - Unified interface for all memory types
Part of the EAILI5 multi-agent memory system
"""

import asyncio
from typing import Dict, List, Any, Optional, Tuple
import logging
from datetime import datetime, timedelta
import json
from .short_term_memory import ShortTermMemory
from .long_term_memory import LongTermMemory
from .episodic_memory import EpisodicMemory
from .procedural_memory import ProceduralMemory
from services.redis_service import RedisService

logger = logging.getLogger(__name__)

class MemoryManager:
    """
    Unified interface for all memory types in the EAILI5 system
    """
    
    def __init__(self, db_pool, redis_service: RedisService):
        self.db_pool = db_pool
        self.redis_service = redis_service
        
        # Initialize memory components
        self.short_term = ShortTermMemory()
        self.long_term = LongTermMemory(db_pool, redis_service)
        self.episodic = EpisodicMemory(redis_service)
        self.procedural = ProceduralMemory(redis_service)
        
    async def initialize(self) -> None:
        """Initialize all memory components"""
        try:
            await self.long_term.initialize()
            await self.procedural.initialize()
            logger.info("Memory manager initialized successfully")
            
        except Exception as e:
            logger.error(f"Error initializing memory manager: {e}")
            raise
    
    async def store_interaction(
        self,
        user_id: str,
        message: str,
        response: str,
        context: Dict[str, Any] = None,
        session_id: str = None,
        intent: str = None,
        agent_used: str = None,
        importance_score: float = 0.5
    ) -> None:
        """Store an interaction across all memory types"""
        try:
            # Store in short-term memory
            await self.short_term.add_message(
                user_id=user_id,
                message=message,
                response=response,
                context=context,
                importance=importance_score
            )
            
            # Store in long-term memory
            await self.long_term.store_conversation(
                user_id=user_id,
                session_id=session_id or user_id,
                message=message,
                response=response,
                intent=intent,
                agent_used=agent_used,
                metadata=context,
                importance_score=importance_score
            )
            
            # Determine if this is a significant episode
            if importance_score > 0.7 or self._is_significant_interaction(message, response):
                await self.episodic.store_episode(
                    user_id=user_id,
                    episode_type=self._classify_episode_type(message, response, intent),
                    content=f"User: {message}\nEAILI5: {response}",
                    emotional_context=self._infer_emotional_context(message, response),
                    learning_outcome=self._infer_learning_outcome(response),
                    metadata={
                        "intent": intent,
                        "agent_used": agent_used,
                        "session_id": session_id,
                        "importance_score": importance_score
                    }
                )
            
            logger.debug(f"Stored interaction for user {user_id}")
            
        except Exception as e:
            logger.error(f"Error storing interaction: {e}")
    
    async def retrieve_relevant_context(
        self,
        user_id: str,
        query: str,
        max_items: int = 5
    ) -> Dict[str, Any]:
        """Retrieve relevant context from all memory types"""
        try:
            context = {
                "short_term": [],
                "episodes": [],
                "semantic": [],
                "procedures": [],
                "user_profile": {}
            }
            
            # Get user profile
            context["user_profile"] = await self.long_term.get_user_profile(user_id)
            
            # Get recent conversation context
            context["short_term"] = await self.short_term.get_recent_context(
                user_id=user_id,
                max_messages=max_items
            )
            
            # Get relevant episodes
            context["episodes"] = await self.episodic.get_relevant_episodes(
                user_id=user_id,
                query=query,
                max_episodes=max_items
            )
            
            # Get relevant procedures
            context["procedures"] = await self.procedural.search_procedures(
                query=query,
                max_results=max_items
            )
            
            # Get conversation summary
            context["conversation_summary"] = await self.short_term.get_conversation_summary(user_id)
            
            return context
            
        except Exception as e:
            logger.error(f"Error retrieving relevant context: {e}")
            return {"error": str(e)}
    
    async def get_user_profile(self, user_id: str) -> Dict[str, Any]:
        """Get comprehensive user profile"""
        try:
            # Get basic profile
            profile = await self.long_term.get_user_profile(user_id)
            
            # Get learning progress
            learning_progress = await self.long_term.get_learning_progress(user_id)
            profile.update(learning_progress)
            
            # Get emotional context
            emotional_context = await self.episodic.get_emotional_context(user_id)
            profile["emotional_context"] = emotional_context
            
            # Get learning moments
            learning_moments = await self.episodic.get_learning_moments(user_id)
            profile["learning_moments"] = learning_moments
            
            # Get memory stats
            memory_stats = await self.short_term.get_memory_stats(user_id)
            profile["memory_stats"] = memory_stats
            
            return profile
            
        except Exception as e:
            logger.error(f"Error getting user profile: {e}")
            return {}
    
    async def update_learning_state(
        self,
        user_id: str,
        topic: str,
        mastery_level: float
    ) -> bool:
        """Update user's learning state for a topic"""
        try:
            # Get current profile
            profile = await self.long_term.get_user_profile(user_id)
            
            # Update topics learned
            topics_learned = profile.get('topics_learned', [])
            
            # Find existing topic or add new one
            topic_found = False
            for i, topic_data in enumerate(topics_learned):
                if topic_data.get('topic') == topic:
                    topics_learned[i] = {
                        'topic': topic,
                        'mastery_level': mastery_level,
                        'last_updated': datetime.now().isoformat()
                    }
                    topic_found = True
                    break
            
            if not topic_found:
                topics_learned.append({
                    'topic': topic,
                    'mastery_level': mastery_level,
                    'last_updated': datetime.now().isoformat()
                })
            
            # Update learning level (average of all topics)
            if topics_learned:
                avg_mastery = sum(t.get('mastery_level', 0) for t in topics_learned) / len(topics_learned)
                new_learning_level = min(100, int(avg_mastery * 100))
            else:
                new_learning_level = 0
            
            # Update profile
            await self.long_term.update_user_profile(user_id, {
                'topics_learned': topics_learned,
                'learning_level': new_learning_level
            })
            
            logger.info(f"Updated learning state for user {user_id}: {topic} = {mastery_level}")
            return True
            
        except Exception as e:
            logger.error(f"Error updating learning state: {e}")
            return False
    
    async def get_learning_recommendations(
        self,
        user_id: str,
        max_recommendations: int = 5
    ) -> List[Dict[str, Any]]:
        """Get personalized learning recommendations"""
        try:
            profile = await self.get_user_profile(user_id)
            recommendations = []
            
            # Get user's current level and topics
            learning_level = profile.get('learning_level', 0)
            topics_learned = [t.get('topic') for t in profile.get('topics_learned', [])]
            
            # Get procedures appropriate for user level
            procedures = await self.procedural.get_procedures_by_difficulty(
                difficulty_level=self._get_difficulty_level(learning_level)
            )
            
            # Filter out already learned topics
            relevant_procedures = []
            for procedure in procedures:
                procedure_topics = procedure.get('metadata', {}).get('topics', [])
                if not any(topic in topics_learned for topic in procedure_topics):
                    relevant_procedures.append(procedure)
            
            # Get learning moments to identify gaps
            learning_moments = profile.get('learning_moments', [])
            confusion_topics = []
            for moment in learning_moments:
                if moment.get('emotional_context') == 'confused':
                    confusion_topics.extend(moment.get('metadata', {}).get('topics', []))
            
            # Create recommendations
            for procedure in relevant_procedures[:max_recommendations]:
                recommendations.append({
                    "type": "procedure",
                    "title": procedure.get('name'),
                    "description": procedure.get('description'),
                    "difficulty": procedure.get('difficulty_level'),
                    "estimated_time": procedure.get('estimated_time'),
                    "reason": "Matches your current learning level"
                })
            
            # Add confusion-based recommendations
            for topic in set(confusion_topics):
                if len(recommendations) < max_recommendations:
                    recommendations.append({
                        "type": "review",
                        "title": f"Review {topic}",
                        "description": f"You seemed confused about {topic} before. Let's review it!",
                        "difficulty": 1,
                        "estimated_time": 10,
                        "reason": "Address previous confusion"
                    })
            
            return recommendations
            
        except Exception as e:
            logger.error(f"Error getting learning recommendations: {e}")
            return []
    
    async def forget_user_data(self, user_id: str) -> bool:
        """GDPR compliance - delete all user data"""
        try:
            # Clear short-term memory
            await self.short_term.clear_user_memory(user_id)
            
            # Clear long-term memory
            await self.long_term.forget_user_data(user_id)
            
            # Clear episodic memory
            await self.episodic.cleanup_old_episodes(user_id, days_old=0)
            
            logger.info(f"Deleted all data for user {user_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error forgetting user data: {e}")
            return False
    
    def _is_significant_interaction(self, message: str, response: str) -> bool:
        """Determine if an interaction is significant enough for episodic memory"""
        try:
            # Check for keywords that indicate significance
            significant_keywords = [
                'breakthrough', 'aha', 'understand', 'got it', 'now I see',
                'confused', 'don\'t understand', 'help', 'stuck',
                'mistake', 'wrong', 'correct', 'fix'
            ]
            
            message_lower = message.lower()
            response_lower = response.lower()
            
            for keyword in significant_keywords:
                if keyword in message_lower or keyword in response_lower:
                    return True
            
            # Check for emotional indicators
            emotional_indicators = [
                'excited', 'frustrated', 'confused', 'happy', 'worried',
                'scared', 'nervous', 'confident', 'proud'
            ]
            
            for indicator in emotional_indicators:
                if indicator in message_lower:
                    return True
            
            return False
            
        except Exception as e:
            logger.error(f"Error determining significance: {e}")
            return False
    
    def _classify_episode_type(self, message: str, response: str, intent: str) -> str:
        """Classify the type of episode"""
        try:
            message_lower = message.lower()
            response_lower = response.lower()
            
            # Check for breakthrough moments
            if any(word in message_lower for word in ['breakthrough', 'aha', 'now I understand', 'got it']):
                return 'breakthrough'
            
            # Check for corrections
            if any(word in response_lower for word in ['actually', 'correction', 'mistake', 'wrong']):
                return 'correction'
            
            # Check for confusion
            if any(word in message_lower for word in ['confused', 'don\'t understand', 'help', 'stuck']):
                return 'confusion'
            
            # Check for success
            if any(word in response_lower for word in ['great', 'excellent', 'well done', 'correct']):
                return 'success'
            
            # Check for questions
            if message_lower.endswith('?'):
                return 'question'
            
            return 'general'
            
        except Exception as e:
            logger.error(f"Error classifying episode type: {e}")
            return 'general'
    
    def _infer_emotional_context(self, message: str, response: str) -> str:
        """Infer emotional context from message and response"""
        try:
            message_lower = message.lower()
            
            # Positive emotions
            if any(word in message_lower for word in ['excited', 'happy', 'great', 'awesome', 'love']):
                return 'excited'
            
            # Negative emotions
            if any(word in message_lower for word in ['frustrated', 'angry', 'annoyed', 'upset']):
                return 'frustrated'
            
            # Confusion
            if any(word in message_lower for word in ['confused', 'don\'t understand', 'lost', 'stuck']):
                return 'confused'
            
            # Confidence
            if any(word in message_lower for word in ['confident', 'sure', 'know', 'understand']):
                return 'confident'
            
            return 'neutral'
            
        except Exception as e:
            logger.error(f"Error inferring emotional context: {e}")
            return 'neutral'
    
    def _infer_learning_outcome(self, response: str) -> str:
        """Infer learning outcome from response"""
        try:
            response_lower = response.lower()
            
            # Mastery indicators
            if any(word in response_lower for word in ['mastered', 'expert', 'advanced', 'proficient']):
                return 'mastered'
            
            # Improvement indicators
            if any(word in response_lower for word in ['improved', 'better', 'progress', 'learning']):
                return 'improved'
            
            # Struggle indicators
            if any(word in response_lower for word in ['struggling', 'difficult', 'challenging', 'hard']):
                return 'struggling'
            
            # Stuck indicators
            if any(word in response_lower for word in ['stuck', 'blocked', 'can\'t', 'unable']):
                return 'stuck'
            
            return None
            
        except Exception as e:
            logger.error(f"Error inferring learning outcome: {e}")
            return None
    
    def _get_difficulty_level(self, learning_level: int) -> int:
        """Convert learning level to procedure difficulty level"""
        try:
            if learning_level < 20:
                return 1  # Beginner
            elif learning_level < 50:
                return 2  # Intermediate
            elif learning_level < 80:
                return 3  # Advanced
            else:
                return 4  # Expert
                
        except Exception as e:
            logger.error(f"Error getting difficulty level: {e}")
            return 1
