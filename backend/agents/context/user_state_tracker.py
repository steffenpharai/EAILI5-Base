"""
User State Tracker - Tracks user's current state and learning objectives
Part of the EAILI5 multi-agent context system
"""

import asyncio
from typing import Dict, List, Any, Optional, Tuple
import logging
from datetime import datetime, timedelta
import json
from services.redis_service import RedisService

logger = logging.getLogger(__name__)

class UserStateTracker:
    """
    Tracks and manages user's current state, learning objectives, and emotional state
    """
    
    def __init__(self, redis_service: RedisService):
        self.redis_service = redis_service
        self.state_ttl = 86400  # 24 hours TTL for state data
        
    async def get_user_state(self, user_id: str) -> Dict[str, Any]:
        """Get current user state"""
        try:
            state_key = f"user_state:{user_id}"
            state_data = await self.redis_service.get(state_key)
            
            if state_data:
                return json.loads(state_data)
            
            # Return default state
            return await self._create_default_state(user_id)
            
        except Exception as e:
            logger.error(f"Error getting user state: {e}")
            return await self._create_default_state(user_id)
    
    async def update_user_state(
        self,
        user_id: str,
        updates: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Update user state"""
        try:
            current_state = await self.get_user_state(user_id)
            
            # Merge updates
            updated_state = {**current_state, **updates}
            updated_state['last_updated'] = datetime.now().isoformat()
            
            # Store updated state
            state_key = f"user_state:{user_id}"
            await self.redis_service.set(
                state_key,
                json.dumps(updated_state, default=str),
                ttl=self.state_ttl
            )
            
            logger.debug(f"Updated user state for {user_id}")
            return updated_state
            
        except Exception as e:
            logger.error(f"Error updating user state: {e}")
            return await self.get_user_state(user_id)
    
    async def track_learning_objective(
        self,
        user_id: str,
        objective: str,
        topic: str,
        difficulty: int = 1,
        estimated_time: int = 0
    ) -> bool:
        """Track a new learning objective"""
        try:
            current_state = await self.get_user_state(user_id)
            
            # Add to learning objectives
            objectives = current_state.get('learning_objectives', [])
            objectives.append({
                "objective": objective,
                "topic": topic,
                "difficulty": difficulty,
                "estimated_time": estimated_time,
                "status": "active",
                "created_at": datetime.now().isoformat(),
                "progress": 0.0
            })
            
            # Update state
            await self.update_user_state(user_id, {
                'learning_objectives': objectives,
                'current_learning_topic': topic
            })
            
            logger.info(f"Added learning objective for user {user_id}: {objective}")
            return True
            
        except Exception as e:
            logger.error(f"Error tracking learning objective: {e}")
            return False
    
    async def update_learning_progress(
        self,
        user_id: str,
        objective: str,
        progress: float,
        notes: str = None
    ) -> bool:
        """Update progress on a learning objective"""
        try:
            current_state = await self.get_user_state(user_id)
            objectives = current_state.get('learning_objectives', [])
            
            # Find and update objective
            for obj in objectives:
                if obj.get('objective') == objective:
                    obj['progress'] = min(1.0, progress)
                    obj['last_updated'] = datetime.now().isoformat()
                    
                    if notes:
                        obj['notes'] = obj.get('notes', [])
                        obj['notes'].append({
                            "note": notes,
                            "timestamp": datetime.now().isoformat()
                        })
                    
                    # Mark as completed if progress is 100%
                    if progress >= 1.0:
                        obj['status'] = 'completed'
                        obj['completed_at'] = datetime.now().isoformat()
                    
                    break
            
            # Update state
            await self.update_user_state(user_id, {
                'learning_objectives': objectives
            })
            
            logger.info(f"Updated learning progress for user {user_id}: {objective} = {progress}%")
            return True
            
        except Exception as e:
            logger.error(f"Error updating learning progress: {e}")
            return False
    
    async def track_emotional_state(
        self,
        user_id: str,
        emotion: str,
        intensity: float = 0.5,
        context: str = None
    ) -> bool:
        """Track user's emotional state"""
        try:
            current_state = await self.get_user_state(user_id)
            
            # Add emotional state entry
            emotional_history = current_state.get('emotional_history', [])
            emotional_history.append({
                "emotion": emotion,
                "intensity": intensity,
                "context": context,
                "timestamp": datetime.now().isoformat()
            })
            
            # Keep only last 20 emotional states
            if len(emotional_history) > 20:
                emotional_history = emotional_history[-20:]
            
            # Update current emotional state
            await self.update_user_state(user_id, {
                'current_emotional_state': emotion,
                'emotional_intensity': intensity,
                'emotional_history': emotional_history
            })
            
            logger.debug(f"Tracked emotional state for user {user_id}: {emotion} ({intensity})")
            return True
            
        except Exception as e:
            logger.error(f"Error tracking emotional state: {e}")
            return False
    
    async def detect_confusion_indicators(
        self,
        user_id: str,
        message: str,
        response: str
    ) -> List[str]:
        """Detect confusion indicators in user messages"""
        try:
            confusion_indicators = []
            message_lower = message.lower()
            
            # Direct confusion indicators
            confusion_phrases = [
                "don't understand", "confused", "lost", "stuck", "help",
                "what does this mean", "i don't get it", "explain more",
                "still don't understand", "can you clarify"
            ]
            
            for phrase in confusion_phrases:
                if phrase in message_lower:
                    confusion_indicators.append(f"Direct confusion: '{phrase}'")
            
            # Question patterns
            if message_lower.count('?') > 2:
                confusion_indicators.append("Multiple questions in one message")
            
            # Repetition patterns
            words = message_lower.split()
            if len(set(words)) < len(words) * 0.7:  # High repetition
                confusion_indicators.append("High word repetition")
            
            # Response length vs question complexity
            if len(response) > len(message) * 3:
                confusion_indicators.append("Requires extensive explanation")
            
            return confusion_indicators
            
        except Exception as e:
            logger.error(f"Error detecting confusion indicators: {e}")
            return []
    
    async def assess_engagement_level(
        self,
        user_id: str,
        message: str,
        response: str
    ) -> str:
        """Assess user's engagement level"""
        try:
            message_lower = message.lower()
            
            # High engagement indicators
            high_engagement = [
                "tell me more", "what else", "interesting", "cool",
                "awesome", "thanks", "that helps", "i see"
            ]
            
            # Low engagement indicators
            low_engagement = [
                "ok", "sure", "fine", "whatever", "i guess",
                "don't care", "not interested"
            ]
            
            # Check for high engagement
            for phrase in high_engagement:
                if phrase in message_lower:
                    return "high"
            
            # Check for low engagement
            for phrase in low_engagement:
                if phrase in message_lower:
                    return "low"
            
            # Check message length and complexity
            if len(message.split()) > 20:
                return "high"  # Detailed questions show engagement
            elif len(message.split()) < 5:
                return "low"   # Short responses may indicate low engagement
            else:
                return "medium"
                
        except Exception as e:
            logger.error(f"Error assessing engagement level: {e}")
            return "unknown"
    
    async def identify_learning_velocity(
        self,
        user_id: str,
        current_topic: str
    ) -> str:
        """Identify how quickly the user is learning"""
        try:
            current_state = await self.get_user_state(user_id)
            objectives = current_state.get('learning_objectives', [])
            
            # Find objectives for current topic
            topic_objectives = [
                obj for obj in objectives 
                if obj.get('topic') == current_topic
            ]
            
            if not topic_objectives:
                return "unknown"
            
            # Calculate average progress rate
            total_progress = sum(obj.get('progress', 0) for obj in topic_objectives)
            avg_progress = total_progress / len(topic_objectives)
            
            # Check recent progress
            recent_objectives = [
                obj for obj in topic_objectives
                if datetime.fromisoformat(obj.get('created_at', '')) > 
                   datetime.now() - timedelta(hours=24)
            ]
            
            if recent_objectives:
                recent_progress = sum(obj.get('progress', 0) for obj in recent_objectives)
                if recent_progress > 0.5:
                    return "fast"
                elif recent_progress > 0.2:
                    return "medium"
                else:
                    return "slow"
            else:
                return "unknown"
                
        except Exception as e:
            logger.error(f"Error identifying learning velocity: {e}")
            return "unknown"
    
    async def get_learning_recommendations(
        self,
        user_id: str
    ) -> List[Dict[str, Any]]:
        """Get personalized learning recommendations based on state"""
        try:
            current_state = await self.get_user_state(user_id)
            recommendations = []
            
            # Check for confusion
            if current_state.get('current_emotional_state') == 'confused':
                recommendations.append({
                    "type": "review",
                    "title": "Review Previous Concepts",
                    "description": "You seem confused. Let's review the basics first.",
                    "priority": "high"
                })
            
            # Check for low engagement
            if current_state.get('engagement_level') == 'low':
                recommendations.append({
                    "type": "engagement",
                    "title": "Try Interactive Learning",
                    "description": "Let's try a more hands-on approach to keep you engaged.",
                    "priority": "medium"
                })
            
            # Check for slow learning velocity
            if current_state.get('learning_velocity') == 'slow':
                recommendations.append({
                    "type": "pacing",
                    "title": "Adjust Learning Pace",
                    "description": "Let's slow down and focus on one concept at a time.",
                    "priority": "medium"
                })
            
            # Check for incomplete objectives
            objectives = current_state.get('learning_objectives', [])
            incomplete = [obj for obj in objectives if obj.get('status') == 'active']
            if incomplete:
                recommendations.append({
                    "type": "completion",
                    "title": "Complete Current Objectives",
                    "description": f"You have {len(incomplete)} learning objectives in progress.",
                    "priority": "low"
                })
            
            return recommendations
            
        except Exception as e:
            logger.error(f"Error getting learning recommendations: {e}")
            return []
    
    async def _create_default_state(self, user_id: str) -> Dict[str, Any]:
        """Create default user state"""
        try:
            default_state = {
                "user_id": user_id,
                "current_learning_topic": None,
                "learning_objectives": [],
                "current_emotional_state": "neutral",
                "emotional_intensity": 0.5,
                "emotional_history": [],
                "engagement_level": "medium",
                "learning_velocity": "medium",
                "confusion_indicators": [],
                "last_updated": datetime.now().isoformat(),
                "created_at": datetime.now().isoformat()
            }
            
            # Store default state
            state_key = f"user_state:{user_id}"
            await self.redis_service.set(
                state_key,
                json.dumps(default_state, default=str),
                ttl=self.state_ttl
            )
            
            return default_state
            
        except Exception as e:
            logger.error(f"Error creating default state: {e}")
            return {
                "user_id": user_id,
                "current_learning_topic": None,
                "learning_objectives": [],
                "current_emotional_state": "neutral",
                "emotional_intensity": 0.5,
                "emotional_history": [],
                "engagement_level": "medium",
                "learning_velocity": "medium",
                "confusion_indicators": [],
                "last_updated": datetime.now().isoformat(),
                "created_at": datetime.now().isoformat()
            }
