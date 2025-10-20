"""
Educational Content Service - Manages crypto education library
Part of the EAILI5 backend services
"""

import asyncio
from typing import Dict, List, Any, Optional
import logging
from datetime import datetime
import json

logger = logging.getLogger(__name__)

class EducationalContentService:
    """
    Service for managing educational content and learning paths
    """
    
    def __init__(self):
        self.content_library = {}
        self.learning_paths = {}
        self.progress_tracker = {}
        
        # Initialize content categories
        self.categories = {
            "basics": "Cryptocurrency Fundamentals",
            "blockchain": "Blockchain Technology", 
            "trading": "Trading Strategies",
            "defi": "Decentralized Finance",
            "security": "Security & Safety",
            "base": "Base Ecosystem",
            "wallets": "Wallet Management",
            "dex": "Decentralized Exchanges"
        }
    
    async def initialize(self):
        """Initialize educational content service"""
        try:
            await self._load_default_content()
            logger.info("Educational content service initialized successfully")
            
        except Exception as e:
            logger.error(f"Error initializing educational content service: {e}")
            raise
    
    async def _load_default_content(self):
        """Load default educational content from JSON file"""
        try:
            import os
            import json
            
            # Load content from JSON file
            content_file_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'educational_content.json')
            
            with open(content_file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            # Load content
            all_content = data.get('content', [])
            
            # Store content by category
            for content in all_content:
                category = content["category"]
                if category not in self.content_library:
                    self.content_library[category] = []
                self.content_library[category].append(content)
            
            # Load learning paths
            learning_paths_data = data.get('learning_paths', {})
            self.learning_paths = learning_paths_data
            
        except Exception as e:
            logger.error(f"Error loading default content: {e}")
            raise
    
    
    async def get_content_by_category(self, category: str) -> List[Dict[str, Any]]:
        """Get educational content by category"""
        try:
            return self.content_library.get(category, [])
            
        except Exception as e:
            logger.error(f"Error getting content by category: {e}")
            return []
    
    async def get_content_by_id(self, content_id: str) -> Optional[Dict[str, Any]]:
        """Get specific educational content by ID"""
        try:
            for category, content_list in self.content_library.items():
                for content in content_list:
                    if content["id"] == content_id:
                        return content
            return None
            
        except Exception as e:
            logger.error(f"Error getting content by ID: {e}")
            return None
    
    async def get_learning_paths(self) -> Dict[str, Any]:
        """Get all learning paths"""
        try:
            return self.learning_paths
            
        except Exception as e:
            logger.error(f"Error getting learning paths: {e}")
            return {}
    
    async def get_learning_path(self, path_id: str) -> Optional[Dict[str, Any]]:
        """Get specific learning path"""
        try:
            return self.learning_paths.get(path_id)
            
        except Exception as e:
            logger.error(f"Error getting learning path: {e}")
            return None
    
    async def get_user_progress(self, user_id: str) -> Dict[str, Any]:
        """Get user's learning progress"""
        try:
            return self.progress_tracker.get(user_id, {
                "user_id": user_id,
                "learning_level": 0,
                "completed_lessons": [],
                "current_path": None,
                "badges_earned": [],
                "total_time_spent": 0,
                "last_updated": datetime.now().isoformat()
            })
            
        except Exception as e:
            logger.error(f"Error getting user progress: {e}")
            return {}
    
    async def update_user_progress(
        self,
        user_id: str,
        lesson_id: str,
        completed: bool = True
    ) -> bool:
        """Update user's learning progress"""
        try:
            if user_id not in self.progress_tracker:
                self.progress_tracker[user_id] = {
                    "user_id": user_id,
                    "learning_level": 0,
                    "completed_lessons": [],
                    "current_path": None,
                    "badges_earned": [],
                    "total_time_spent": 0,
                    "last_updated": datetime.now().isoformat()
                }
            
            progress = self.progress_tracker[user_id]
            
            if completed and lesson_id not in progress["completed_lessons"]:
                progress["completed_lessons"].append(lesson_id)
                
                # Update learning level based on completed lessons
                progress["learning_level"] = min(len(progress["completed_lessons"]) * 5, 100)
                
                # Check for new badges
                await self._check_badges(user_id, progress)
            
            progress["last_updated"] = datetime.now().isoformat()
            
            return True
            
        except Exception as e:
            logger.error(f"Error updating user progress: {e}")
            return False
    
    async def _check_badges(self, user_id: str, progress: Dict[str, Any]):
        """Check if user has earned new badges"""
        try:
            completed_lessons = progress["completed_lessons"]
            badges_earned = progress["badges_earned"]
            
            # Define badge requirements
            badge_requirements = {
                "crypto-curious": ["crypto-001"],
                "blockchain-basics": ["crypto-002"],
                "wallet-setup": ["crypto-003"],
                "security-aware": ["security-001"],
                "trading-basics": ["trading-001"],
                "defi-explorer": ["defi-001"],
                "base-native": ["base-001"]
            }
            
            # Check each badge
            for badge, required_lessons in badge_requirements.items():
                if badge not in badges_earned:
                    if all(lesson in completed_lessons for lesson in required_lessons):
                        badges_earned.append(badge)
                        progress["badges_earned"] = badges_earned
            
        except Exception as e:
            logger.error(f"Error checking badges: {e}")
    
    async def get_recommended_content(
        self,
        user_id: str,
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        """Get recommended content based on user progress"""
        try:
            progress = await self.get_user_progress(user_id)
            completed_lessons = progress["completed_lessons"]
            learning_level = progress["learning_level"]
            
            # Get content appropriate for user's level
            recommended = []
            
            for category, content_list in self.content_library.items():
                for content in content_list:
                    if (content["id"] not in completed_lessons and 
                        content["difficulty_level"] <= (learning_level // 20 + 1)):
                        recommended.append(content)
            
            # Sort by difficulty level and return top results
            recommended.sort(key=lambda x: x["difficulty_level"])
            return recommended[:limit]
            
        except Exception as e:
            logger.error(f"Error getting recommended content: {e}")
            return []
    
    async def search_content(self, query: str, category: Optional[str] = None) -> List[Dict[str, Any]]:
        """Search educational content"""
        try:
            results = []
            query_lower = query.lower()
            
            for cat, content_list in self.content_library.items():
                if category and cat != category:
                    continue
                    
                for content in content_list:
                    if (query_lower in content["title"].lower() or 
                        query_lower in content["content"].lower() or
                        any(query_lower in tag.lower() for tag in content.get("tags", []))):
                        results.append(content)
            
            return results
            
        except Exception as e:
            logger.error(f"Error searching content: {e}")
            return []
