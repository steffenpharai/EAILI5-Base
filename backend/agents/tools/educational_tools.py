"""
Educational Tools - Tools for educational content and learning
Part of the EAILI5 multi-agent tool system
"""

import asyncio
from typing import Dict, List, Any, Optional
import logging
from datetime import datetime
import json
from services.educational_content_service import EducationalContentService
from services.progress_tracking_service import ProgressTrackingService

logger = logging.getLogger(__name__)

class EducationalTools:
    """
    Tools for educational content retrieval and learning management
    """
    
    def __init__(
        self, 
        educational_service: EducationalContentService,
        progress_service: ProgressTrackingService
    ):
        self.educational_service = educational_service
        self.progress_service = progress_service
    
    async def search_educational_content(
        self, 
        query: str, 
        level: int = 1,
        category: str = None
    ) -> Dict[str, Any]:
        """Search for educational content"""
        try:
            # Search educational content
            content_data = await self.educational_service.search_content(
                query=query,
                difficulty_level=level,
                category=category
            )
            
            return {
                "query": query,
                "level": level,
                "category": category,
                "results": content_data.get("results", []),
                "total_count": content_data.get("total_count", 0),
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error searching educational content: {e}")
            return {"error": str(e)}
    
    async def get_learning_path(self, topic: str) -> Dict[str, Any]:
        """Get a structured learning path for a topic"""
        try:
            # Get learning path from educational service
            path_data = await self.educational_service.get_learning_path(topic)
            
            return {
                "topic": topic,
                "path": path_data.get("path", []),
                "estimated_time": path_data.get("estimated_time", 0),
                "difficulty": path_data.get("difficulty", 1),
                "prerequisites": path_data.get("prerequisites", []),
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error getting learning path: {e}")
            return {"error": str(e)}
    
    async def assess_user_knowledge(
        self, 
        user_id: str, 
        topic: str
    ) -> Dict[str, Any]:
        """Assess user's knowledge level for a topic"""
        try:
            # Get user's progress for the topic
            progress_data = await self.progress_service.get_user_progress(user_id)
            
            # Calculate knowledge level
            topic_progress = progress_data.get("topics", {}).get(topic, {})
            knowledge_level = topic_progress.get("mastery_level", 0)
            
            # Get recommendations based on level
            recommendations = await self._get_knowledge_recommendations(
                topic, knowledge_level
            )
            
            return {
                "user_id": user_id,
                "topic": topic,
                "knowledge_level": knowledge_level,
                "mastery_percentage": knowledge_level * 100,
                "recommendations": recommendations,
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error assessing user knowledge: {e}")
            return {"error": str(e)}
    
    async def recommend_next_lesson(self, user_id: str) -> Dict[str, Any]:
        """Recommend the next lesson for a user"""
        try:
            # Get user's current progress
            progress_data = await self.progress_service.get_user_progress(user_id)
            
            # Get learning recommendations
            recommendations = await self.educational_service.get_recommendations(
                user_id=user_id,
                current_level=progress_data.get("learning_level", 0),
                completed_topics=progress_data.get("completed_topics", [])
            )
            
            return {
                "user_id": user_id,
                "recommendations": recommendations,
                "current_level": progress_data.get("learning_level", 0),
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error getting next lesson recommendation: {e}")
            return {"error": str(e)}
    
    async def generate_quiz(
        self, 
        topic: str, 
        difficulty: int = 1,
        question_count: int = 5
    ) -> Dict[str, Any]:
        """Generate a quiz for a topic"""
        try:
            # Generate quiz from educational service
            quiz_data = await self.educational_service.generate_quiz(
                topic=topic,
                difficulty=difficulty,
                question_count=question_count
            )
            
            return {
                "topic": topic,
                "difficulty": difficulty,
                "questions": quiz_data.get("questions", []),
                "question_count": len(quiz_data.get("questions", [])),
                "estimated_time": quiz_data.get("estimated_time", 0),
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error generating quiz: {e}")
            return {"error": str(e)}
    
    async def get_topic_explanation(
        self, 
        topic: str, 
        level: int = 1
    ) -> Dict[str, Any]:
        """Get a detailed explanation of a topic"""
        try:
            # Get topic explanation
            explanation_data = await self.educational_service.get_topic_explanation(
                topic=topic,
                difficulty_level=level
            )
            
            return {
                "topic": topic,
                "level": level,
                "explanation": explanation_data.get("explanation", ""),
                "key_concepts": explanation_data.get("key_concepts", []),
                "examples": explanation_data.get("examples", []),
                "related_topics": explanation_data.get("related_topics", []),
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error getting topic explanation: {e}")
            return {"error": str(e)}
    
    async def track_learning_progress(
        self, 
        user_id: str, 
        topic: str, 
        progress: float
    ) -> Dict[str, Any]:
        """Track user's learning progress"""
        try:
            # Update progress
            await self.progress_service.update_progress(
                user_id=user_id,
                topic=topic,
                progress=progress
            )
            
            # Get updated progress data
            progress_data = await self.progress_service.get_user_progress(user_id)
            
            return {
                "user_id": user_id,
                "topic": topic,
                "progress": progress,
                "updated_progress": progress_data,
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error tracking learning progress: {e}")
            return {"error": str(e)}
    
    async def get_learning_analytics(self, user_id: str) -> Dict[str, Any]:
        """Get learning analytics for a user"""
        try:
            # Get comprehensive learning analytics
            analytics_data = await self.progress_service.get_learning_analytics(user_id)
            
            return {
                "user_id": user_id,
                "total_lessons_completed": analytics_data.get("total_lessons", 0),
                "learning_streak": analytics_data.get("streak", 0),
                "topics_mastered": analytics_data.get("topics_mastered", []),
                "learning_velocity": analytics_data.get("velocity", 0),
                "achievements": analytics_data.get("achievements", []),
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error getting learning analytics: {e}")
            return {"error": str(e)}
    
    async def _get_knowledge_recommendations(
        self, 
        topic: str, 
        current_level: float
    ) -> List[Dict[str, Any]]:
        """Get recommendations based on knowledge level"""
        try:
            recommendations = []
            
            if current_level < 0.3:
                recommendations.append({
                    "type": "beginner",
                    "title": f"Start with {topic} basics",
                    "description": "Begin with fundamental concepts",
                    "priority": "high"
                })
            elif current_level < 0.7:
                recommendations.append({
                    "type": "intermediate",
                    "title": f"Deepen your {topic} knowledge",
                    "description": "Explore advanced concepts and applications",
                    "priority": "medium"
                })
            else:
                recommendations.append({
                    "type": "advanced",
                    "title": f"Master {topic} expertise",
                    "description": "Become an expert in this topic",
                    "priority": "low"
                })
            
            return recommendations
            
        except Exception as e:
            logger.error(f"Error getting knowledge recommendations: {e}")
            return []
    
    def get_tool_definitions(self) -> List[Dict[str, Any]]:
        """Get tool definitions for registration"""
        return [
            {
                "name": "search_educational_content",
                "description": "Search for educational content on a specific topic",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "query": {
                            "type": "string",
                            "description": "Search query for educational content"
                        },
                        "level": {
                            "type": "integer",
                            "description": "Difficulty level (1-5)",
                            "default": 1
                        },
                        "category": {
                            "type": "string",
                            "description": "Content category (optional)",
                            "enum": ["basics", "trading", "defi", "security", "base"]
                        }
                    },
                    "required": ["query"]
                },
                "category": "educational",
                "requires_auth": False
            },
            {
                "name": "get_learning_path",
                "description": "Get a structured learning path for a topic",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "topic": {
                            "type": "string",
                            "description": "The topic to create a learning path for"
                        }
                    },
                    "required": ["topic"]
                },
                "category": "educational",
                "requires_auth": False
            },
            {
                "name": "assess_user_knowledge",
                "description": "Assess user's knowledge level for a topic",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "user_id": {
                            "type": "string",
                            "description": "User ID to assess"
                        },
                        "topic": {
                            "type": "string",
                            "description": "Topic to assess knowledge for"
                        }
                    },
                    "required": ["user_id", "topic"]
                },
                "category": "educational",
                "requires_auth": True
            },
            {
                "name": "recommend_next_lesson",
                "description": "Recommend the next lesson for a user",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "user_id": {
                            "type": "string",
                            "description": "User ID to get recommendations for"
                        }
                    },
                    "required": ["user_id"]
                },
                "category": "educational",
                "requires_auth": True
            },
            {
                "name": "generate_quiz",
                "description": "Generate a quiz for a topic",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "topic": {
                            "type": "string",
                            "description": "Topic for the quiz"
                        },
                        "difficulty": {
                            "type": "integer",
                            "description": "Quiz difficulty level (1-5)",
                            "default": 1
                        },
                        "question_count": {
                            "type": "integer",
                            "description": "Number of questions",
                            "default": 5
                        }
                    },
                    "required": ["topic"]
                },
                "category": "educational",
                "requires_auth": False
            },
            {
                "name": "get_topic_explanation",
                "description": "Get a detailed explanation of a topic",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "topic": {
                            "type": "string",
                            "description": "Topic to explain"
                        },
                        "level": {
                            "type": "integer",
                            "description": "Explanation level (1-5)",
                            "default": 1
                        }
                    },
                    "required": ["topic"]
                },
                "category": "educational",
                "requires_auth": False
            }
        ]
