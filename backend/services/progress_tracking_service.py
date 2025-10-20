"""
Progress Tracking Service - Manages user learning progress and gamification
Part of the DeCrypt backend services
"""

import asyncio
from typing import Dict, List, Any, Optional
import logging
from datetime import datetime, timedelta
import json

logger = logging.getLogger(__name__)

class ProgressTrackingService:
    """
    Service for tracking user learning progress and gamification
    """
    
    def __init__(self):
        self.user_progress = {}
        self.achievements = {}
        self.leaderboards = {}
        self.redis_client = None
        
        # Initialize achievement definitions
        self.achievement_definitions = {
            "first_lesson": {
                "id": "first_lesson",
                "name": "Getting Started",
                "description": "Complete your first lesson",
                "icon": "🎯",
                "points": 10,
                "requirement": {"type": "lessons_completed", "count": 1}
            },
            "crypto_curious": {
                "id": "crypto_curious", 
                "name": "Crypto Curious",
                "description": "Learn about cryptocurrency basics",
                "icon": "🔍",
                "points": 25,
                "requirement": {"type": "category_completed", "category": "basics"}
            },
            "trading_novice": {
                "id": "trading_novice",
                "name": "Trading Novice", 
                "description": "Complete your first trading lesson",
                "icon": "📈",
                "points": 30,
                "requirement": {"type": "category_completed", "category": "trading"}
            },
            "defi_explorer": {
                "id": "defi_explorer",
                "name": "DeFi Explorer",
                "description": "Explore decentralized finance",
                "icon": "🏦",
                "points": 40,
                "requirement": {"type": "category_completed", "category": "defi"}
            },
            "base_native": {
                "id": "base_native",
                "name": "Base Native",
                "description": "Learn about the Base ecosystem",
                "icon": "🔵",
                "points": 35,
                "requirement": {"type": "category_completed", "category": "base"}
            },
            "security_guardian": {
                "id": "security_guardian",
                "name": "Security Guardian",
                "description": "Master crypto security practices",
                "icon": "🛡️",
                "points": 50,
                "requirement": {"type": "category_completed", "category": "security"}
            },
            "week_warrior": {
                "id": "week_warrior",
                "name": "Week Warrior",
                "description": "Learn for 7 consecutive days",
                "icon": "⚔️",
                "points": 100,
                "requirement": {"type": "consecutive_days", "count": 7}
            },
            "knowledge_seeker": {
                "id": "knowledge_seeker",
                "name": "Knowledge Seeker",
                "description": "Complete 10 lessons",
                "icon": "🧠",
                "points": 75,
                "requirement": {"type": "lessons_completed", "count": 10}
            },
            "speed_learner": {
                "id": "speed_learner",
                "name": "Speed Learner",
                "description": "Complete 5 lessons in one day",
                "icon": "⚡",
                "points": 60,
                "requirement": {"type": "lessons_in_day", "count": 5}
            },
            "portfolio_master": {
                "id": "portfolio_master",
                "name": "Portfolio Master",
                "description": "Make 10 successful simulated trades",
                "icon": "💼",
                "points": 80,
                "requirement": {"type": "successful_trades", "count": 10}
            }
        }
    
    async def initialize(self, redis_client=None):
        """Initialize progress tracking service"""
        try:
            self.redis_client = redis_client
            logger.info("Progress tracking service initialized successfully")
            
        except Exception as e:
            logger.error(f"Error initializing progress tracking service: {e}")
            raise
    
    async def get_user_progress(self, user_id: str) -> Dict[str, Any]:
        """Get user's learning progress"""
        try:
            # Try Redis first if available
            if self.redis_client:
                try:
                    redis_key = f"progress:{user_id}"
                    cached_progress = await self.redis_client.get(redis_key)
                    if cached_progress:
                        return json.loads(cached_progress)
                except Exception as e:
                    logger.warning(f"Redis get failed, using memory: {e}")
            
            # Fallback to memory storage
            if user_id not in self.user_progress:
                self.user_progress[user_id] = {
                    "user_id": user_id,
                    "learning_level": 0,
                    "total_points": 0,
                    "completed_lessons": [],
                    "completed_categories": [],
                    "achievements": [],
                    "streak_days": 0,
                    "last_activity": None,
                    "total_time_spent": 0,
                    "created_at": datetime.now().isoformat(),
                    "last_updated": datetime.now().isoformat()
                }
            
            return self.user_progress[user_id]
            
        except Exception as e:
            logger.error(f"Error getting user progress: {e}")
            return {}
    
    async def update_lesson_completion(
        self,
        user_id: str,
        lesson_id: str,
        category: str,
        time_spent: int = 0
    ) -> bool:
        """Update user progress when lesson is completed"""
        try:
            progress = await self.get_user_progress(user_id)
            
            # Add lesson to completed list
            if lesson_id not in progress["completed_lessons"]:
                progress["completed_lessons"].append(lesson_id)
                
                # Update learning level
                progress["learning_level"] = min(len(progress["completed_lessons"]) * 5, 100)
                
                # Add category if not already completed
                if category not in progress["completed_categories"]:
                    progress["completed_categories"].append(category)
                
                # Update time spent
                progress["total_time_spent"] += time_spent
                
                # Update last activity
                progress["last_activity"] = datetime.now().isoformat()
                progress["last_updated"] = datetime.now().isoformat()
                
                # Check for achievements
                await self._check_achievements(user_id, progress)
                
                # Save to Redis if available
                if self.redis_client:
                    try:
                        redis_key = f"progress:{user_id}"
                        await self.redis_client.set(redis_key, json.dumps(progress), ex=86400)  # 24 hours TTL
                    except Exception as e:
                        logger.warning(f"Redis save failed: {e}")
                
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"Error updating lesson completion: {e}")
            return False
    
    async def _check_achievements(self, user_id: str, progress: Dict[str, Any]):
        """Check if user has earned new achievements"""
        try:
            current_achievements = progress["achievements"]
            completed_lessons = progress["completed_lessons"]
            completed_categories = progress["completed_categories"]
            
            # Check each achievement
            for achievement_id, achievement in self.achievement_definitions.items():
                if achievement_id in current_achievements:
                    continue  # Already earned
                
                requirement = achievement["requirement"]
                earned = False
                
                if requirement["type"] == "lessons_completed":
                    earned = len(completed_lessons) >= requirement["count"]
                    
                elif requirement["type"] == "category_completed":
                    earned = requirement["category"] in completed_categories
                    
                elif requirement["type"] == "consecutive_days":
                    earned = progress["streak_days"] >= requirement["count"]
                    
                elif requirement["type"] == "lessons_in_day":
                    # Check if user completed required lessons today
                    today = datetime.now().date()
                    today_lessons = 0
                    for lesson_id in completed_lessons:
                        # This would need to be tracked with timestamps in a real implementation
                        today_lessons += 1  # Simplified for now
                    earned = today_lessons >= requirement["count"]
                    
                elif requirement["type"] == "successful_trades":
                    # This would need integration with portfolio simulator
                    earned = False  # Placeholder
                
                if earned:
                    current_achievements.append(achievement_id)
                    progress["total_points"] += achievement["points"]
                    progress["achievements"] = current_achievements
                    
                    # Log achievement earned
                    logger.info(f"User {user_id} earned achievement: {achievement['name']}")
            
        except Exception as e:
            logger.error(f"Error checking achievements: {e}")
    
    async def get_achievements(self, user_id: str) -> List[Dict[str, Any]]:
        """Get user's achievements"""
        try:
            progress = await self.get_user_progress(user_id)
            user_achievements = []
            
            for achievement_id in progress["achievements"]:
                if achievement_id in self.achievement_definitions:
                    user_achievements.append(self.achievement_definitions[achievement_id])
            
            return user_achievements
            
        except Exception as e:
            logger.error(f"Error getting achievements: {e}")
            return []
    
    async def get_available_achievements(self, user_id: str) -> List[Dict[str, Any]]:
        """Get achievements user hasn't earned yet"""
        try:
            progress = await self.get_user_progress(user_id)
            earned_achievements = progress["achievements"]
            available = []
            
            for achievement_id, achievement in self.achievement_definitions.items():
                if achievement_id not in earned_achievements:
                    available.append(achievement)
            
            return available
            
        except Exception as e:
            logger.error(f"Error getting available achievements: {e}")
            return []
    
    async def get_leaderboard(self, period: str = "all_time", limit: int = 10) -> List[Dict[str, Any]]:
        """Get leaderboard for specified period"""
        try:
            leaderboard = []
            
            for user_id, progress in self.user_progress.items():
                # Filter by period (simplified for now)
                if period == "all_time":
                    leaderboard.append({
                        "user_id": user_id,
                        "points": progress["total_points"],
                        "level": progress["learning_level"],
                        "achievements": len(progress["achievements"]),
                        "lessons_completed": len(progress["completed_lessons"])
                    })
            
            # Sort by points and return top results
            leaderboard.sort(key=lambda x: x["points"], reverse=True)
            return leaderboard[:limit]
            
        except Exception as e:
            logger.error(f"Error getting leaderboard: {e}")
            return []
    
    async def get_user_stats(self, user_id: str) -> Dict[str, Any]:
        """Get comprehensive user statistics"""
        try:
            progress = await self.get_user_progress(user_id)
            
            stats = {
                "user_id": user_id,
                "learning_level": progress["learning_level"],
                "total_points": progress["total_points"],
                "lessons_completed": len(progress["completed_lessons"]),
                "categories_completed": len(progress["completed_categories"]),
                "achievements_earned": len(progress["achievements"]),
                "streak_days": progress["streak_days"],
                "total_time_spent": progress["total_time_spent"],
                "last_activity": progress["last_activity"],
                "created_at": progress["created_at"]
            }
            
            return stats
            
        except Exception as e:
            logger.error(f"Error getting user stats: {e}")
            return {}
    
    async def update_streak(self, user_id: str) -> bool:
        """Update user's learning streak"""
        try:
            progress = await self.get_user_progress(user_id)
            last_activity = progress["last_activity"]
            
            if last_activity:
                last_date = datetime.fromisoformat(last_activity).date()
                today = datetime.now().date()
                
                if last_date == today:
                    # Already updated today
                    return True
                elif last_date == today - timedelta(days=1):
                    # Consecutive day
                    progress["streak_days"] += 1
                else:
                    # Streak broken
                    progress["streak_days"] = 1
            else:
                # First activity
                progress["streak_days"] = 1
            
            progress["last_activity"] = datetime.now().isoformat()
            progress["last_updated"] = datetime.now().isoformat()
            
            return True
            
        except Exception as e:
            logger.error(f"Error updating streak: {e}")
            return False
    
    async def get_learning_path_progress(self, user_id: str, path_id: str) -> Dict[str, Any]:
        """Get user's progress on a specific learning path"""
        try:
            progress = await self.get_user_progress(user_id)
            completed_lessons = progress["completed_lessons"]
            
            # This would need integration with educational content service
            # to get the actual lessons in the path
            path_lessons = []  # Placeholder - would be fetched from content service
            
            completed_in_path = [lesson for lesson in completed_lessons if lesson in path_lessons]
            completion_percentage = (len(completed_in_path) / len(path_lessons)) * 100 if path_lessons else 0
            
            return {
                "path_id": path_id,
                "total_lessons": len(path_lessons),
                "completed_lessons": len(completed_in_path),
                "completion_percentage": completion_percentage,
                "is_completed": len(completed_in_path) == len(path_lessons)
            }
            
        except Exception as e:
            logger.error(f"Error getting learning path progress: {e}")
            return {}
    
    async def get_recommendations(self, user_id: str) -> List[Dict[str, Any]]:
        """Get personalized learning recommendations"""
        try:
            progress = await self.get_user_progress(user_id)
            completed_lessons = progress["completed_lessons"]
            completed_categories = progress["completed_categories"]
            
            recommendations = []
            
            # Recommend next lessons based on progress
            if "basics" not in completed_categories:
                recommendations.append({
                    "type": "category",
                    "title": "Learn Crypto Basics",
                    "description": "Start with the fundamentals of cryptocurrency",
                    "priority": "high"
                })
            
            if "basics" in completed_categories and "trading" not in completed_categories:
                recommendations.append({
                    "type": "category", 
                    "title": "Explore Trading",
                    "description": "Learn about trading strategies and concepts",
                    "priority": "medium"
                })
            
            if "trading" in completed_categories and "defi" not in completed_categories:
                recommendations.append({
                    "type": "category",
                    "title": "Discover DeFi",
                    "description": "Learn about decentralized finance",
                    "priority": "medium"
                })
            
            # Recommend achievements to work towards
            available_achievements = await self.get_available_achievements(user_id)
            for achievement in available_achievements[:3]:  # Top 3
                recommendations.append({
                    "type": "achievement",
                    "title": f"Work towards: {achievement['name']}",
                    "description": achievement["description"],
                    "priority": "low"
                })
            
            return recommendations
            
        except Exception as e:
            logger.error(f"Error getting recommendations: {e}")
            return []
