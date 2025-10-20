"""
Short-Term Memory - Conversation context management
Part of the EAILI5 multi-agent memory system
"""

import asyncio
from typing import Dict, List, Any, Optional, Tuple
import logging
from datetime import datetime, timedelta
import json
import hashlib

logger = logging.getLogger(__name__)

class ShortTermMemory:
    """
    Manages short-term conversation context with sliding window and compression
    """
    
    def __init__(self, max_messages: int = 20, compression_threshold: int = 15):
        self.max_messages = max_messages
        self.compression_threshold = compression_threshold
        self.memories: Dict[str, List[Dict]] = {}  # user_id -> messages
        self.importance_scores: Dict[str, List[float]] = {}  # user_id -> scores
        
    async def add_message(
        self, 
        user_id: str, 
        message: str, 
        response: str, 
        context: Dict[str, Any] = None,
        importance: float = 0.5
    ) -> None:
        """Add a new message to short-term memory"""
        try:
            if user_id not in self.memories:
                self.memories[user_id] = []
                self.importance_scores[user_id] = []
            
            # Create memory entry
            memory_entry = {
                "timestamp": datetime.now().isoformat(),
                "message": message,
                "response": response,
                "context": context or {},
                "importance": importance,
                "message_id": self._generate_message_id(user_id, message)
            }
            
            # Add to memory
            self.memories[user_id].append(memory_entry)
            self.importance_scores[user_id].append(importance)
            
            # Compress if needed
            if len(self.memories[user_id]) > self.max_messages:
                await self._compress_memory(user_id)
                
            logger.debug(f"Added message to short-term memory for user {user_id}")
            
        except Exception as e:
            logger.error(f"Error adding message to short-term memory: {e}")
    
    async def get_recent_context(
        self, 
        user_id: str, 
        max_messages: int = 10
    ) -> List[Dict[str, Any]]:
        """Get recent conversation context"""
        try:
            if user_id not in self.memories:
                return []
            
            # Get most recent messages
            recent_messages = self.memories[user_id][-max_messages:]
            
            # Sort by importance if we have scores
            if user_id in self.importance_scores:
                scored_messages = list(zip(recent_messages, self.importance_scores[user_id][-max_messages:]))
                scored_messages.sort(key=lambda x: x[1], reverse=True)
                recent_messages = [msg for msg, _ in scored_messages]
            
            return recent_messages
            
        except Exception as e:
            logger.error(f"Error retrieving recent context: {e}")
            return []
    
    async def get_conversation_summary(self, user_id: str) -> str:
        """Generate a summary of the conversation for context"""
        try:
            if user_id not in self.memories or not self.memories[user_id]:
                return "No previous conversation context."
            
            # Get important messages
            important_messages = []
            if user_id in self.importance_scores:
                for msg, score in zip(self.memories[user_id], self.importance_scores[user_id]):
                    if score > 0.7:  # High importance threshold
                        important_messages.append(msg)
            
            if not important_messages:
                # Fall back to recent messages
                important_messages = self.memories[user_id][-5:]
            
            # Build summary
            summary_parts = []
            for msg in important_messages:
                summary_parts.append(f"User: {msg['message'][:100]}...")
                summary_parts.append(f"EAILI5: {msg['response'][:100]}...")
            
            return "Recent conversation context:\n" + "\n".join(summary_parts)
            
        except Exception as e:
            logger.error(f"Error generating conversation summary: {e}")
            return "Error generating conversation summary."
    
    async def _compress_memory(self, user_id: str) -> None:
        """Compress older memories while preserving important ones"""
        try:
            if len(self.memories[user_id]) <= self.compression_threshold:
                return
            
            # Keep most important messages and recent ones
            messages_with_scores = list(zip(
                self.memories[user_id], 
                self.importance_scores[user_id]
            ))
            
            # Sort by importance
            messages_with_scores.sort(key=lambda x: x[1], reverse=True)
            
            # Keep top 70% of messages
            keep_count = int(len(messages_with_scores) * 0.7)
            important_messages = messages_with_scores[:keep_count]
            
            # Also keep recent messages (last 5)
            recent_messages = messages_with_scores[-5:]
            
            # Combine and deduplicate
            all_keep = set()
            for msg, _ in important_messages + recent_messages:
                all_keep.add(msg['message_id'])
            
            # Filter memories
            filtered_memories = []
            filtered_scores = []
            for msg, score in messages_with_scores:
                if msg['message_id'] in all_keep:
                    filtered_memories.append(msg)
                    filtered_scores.append(score)
            
            self.memories[user_id] = filtered_memories
            self.importance_scores[user_id] = filtered_scores
            
            logger.info(f"Compressed memory for user {user_id}: {len(messages_with_scores)} -> {len(filtered_memories)} messages")
            
        except Exception as e:
            logger.error(f"Error compressing memory: {e}")
    
    def _generate_message_id(self, user_id: str, message: str) -> str:
        """Generate unique message ID"""
        content = f"{user_id}:{message}:{datetime.now().isoformat()}"
        return hashlib.md5(content.encode()).hexdigest()[:16]
    
    async def clear_user_memory(self, user_id: str) -> None:
        """Clear all short-term memory for a user"""
        try:
            if user_id in self.memories:
                del self.memories[user_id]
            if user_id in self.importance_scores:
                del self.importance_scores[user_id]
            logger.info(f"Cleared short-term memory for user {user_id}")
        except Exception as e:
            logger.error(f"Error clearing memory for user {user_id}: {e}")
    
    async def get_memory_stats(self, user_id: str) -> Dict[str, Any]:
        """Get memory statistics for a user"""
        try:
            if user_id not in self.memories:
                return {"message_count": 0, "avg_importance": 0.0}
            
            message_count = len(self.memories[user_id])
            avg_importance = 0.0
            
            if user_id in self.importance_scores and self.importance_scores[user_id]:
                avg_importance = sum(self.importance_scores[user_id]) / len(self.importance_scores[user_id])
            
            return {
                "message_count": message_count,
                "avg_importance": avg_importance,
                "max_messages": self.max_messages,
                "compression_threshold": self.compression_threshold
            }
            
        except Exception as e:
            logger.error(f"Error getting memory stats: {e}")
            return {"error": str(e)}
