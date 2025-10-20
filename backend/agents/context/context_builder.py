"""
Context Builder - Aggregates context from all memory types
Part of the EAILI5 multi-agent context system
"""

import asyncio
from typing import Dict, List, Any, Optional, Tuple
import logging
from datetime import datetime, timedelta
import json
from ..memory.memory_manager import MemoryManager

logger = logging.getLogger(__name__)

class ContextBuilder:
    """
    Builds comprehensive context for LLM interactions by aggregating
    information from all memory types
    """
    
    def __init__(self, memory_manager: MemoryManager):
        self.memory_manager = memory_manager
        self.max_context_tokens = 4000  # Token budget for context
        self.context_priority = {
            "user_profile": 1.0,
            "recent_conversation": 0.9,
            "relevant_episodes": 0.8,
            "semantic_knowledge": 0.7,
            "procedures": 0.6,
            "emotional_context": 0.5,
            "learning_progress": 0.4
        }
    
    async def build_context(
        self,
        user_id: str,
        query: str,
        current_state: Dict[str, Any] = None,
        max_tokens: int = None
    ) -> Dict[str, Any]:
        """Build comprehensive context for an interaction"""
        try:
            if max_tokens is None:
                max_tokens = self.max_context_tokens
            
            # Get all relevant context
            memory_context = await self.memory_manager.retrieve_relevant_context(
                user_id=user_id,
                query=query,
                max_items=10
            )
            
            # Build structured context
            context = {
                "user_profile": await self._build_user_profile_context(memory_context),
                "conversation_context": await self._build_conversation_context(memory_context),
                "learning_context": await self._build_learning_context(memory_context),
                "semantic_context": await self._build_semantic_context(memory_context),
                "procedural_context": await self._build_procedural_context(memory_context),
                "emotional_context": await self._build_emotional_context(memory_context),
                "current_session": current_state or {}
            }
            
            # Optimize context for token budget
            optimized_context = await self._optimize_context_for_tokens(context, max_tokens)
            
            # Generate context summary
            context_summary = await self._generate_context_summary(optimized_context)
            
            return {
                "context": optimized_context,
                "summary": context_summary,
                "token_estimate": self._estimate_tokens(optimized_context),
                "context_sources": self._get_context_sources(optimized_context)
            }
            
        except Exception as e:
            logger.error(f"Error building context: {e}")
            return {"error": str(e)}
    
    async def _build_user_profile_context(self, memory_context: Dict[str, Any]) -> Dict[str, Any]:
        """Build user profile context"""
        try:
            user_profile = memory_context.get("user_profile", {})
            
            return {
                "learning_level": user_profile.get("learning_level", 0),
                "topics_learned": user_profile.get("topics_learned", []),
                "preferences": user_profile.get("preferences", {}),
                "interaction_count": user_profile.get("interaction_count", 0),
                "last_active": user_profile.get("last_active"),
                "emotional_state": user_profile.get("emotional_context", {}),
                "learning_moments": user_profile.get("learning_moments", [])[:3]  # Recent moments
            }
            
        except Exception as e:
            logger.error(f"Error building user profile context: {e}")
            return {}
    
    async def _build_conversation_context(self, memory_context: Dict[str, Any]) -> Dict[str, Any]:
        """Build conversation context"""
        try:
            short_term = memory_context.get("short_term", [])
            conversation_summary = memory_context.get("conversation_summary", "")
            
            # Get recent conversation flow
            recent_messages = []
            for msg in short_term[-5:]:  # Last 5 messages
                recent_messages.append({
                    "user_message": msg.get("message", "")[:200],  # Truncate
                    "ai_response": msg.get("response", "")[:200],
                    "timestamp": msg.get("timestamp"),
                    "importance": msg.get("importance", 0.5)
                })
            
            return {
                "recent_messages": recent_messages,
                "conversation_summary": conversation_summary,
                "conversation_flow": self._analyze_conversation_flow(recent_messages)
            }
            
        except Exception as e:
            logger.error(f"Error building conversation context: {e}")
            return {}
    
    async def _build_learning_context(self, memory_context: Dict[str, Any]) -> Dict[str, Any]:
        """Build learning progress context"""
        try:
            user_profile = memory_context.get("user_profile", {})
            episodes = memory_context.get("episodes", [])
            
            # Get learning progression
            learning_progression = []
            for episode in episodes[:3]:  # Recent episodes
                learning_progression.append({
                    "type": episode.get("episode_type"),
                    "outcome": episode.get("learning_outcome"),
                    "content": episode.get("content", "")[:150],
                    "timestamp": episode.get("timestamp")
                })
            
            return {
                "current_level": user_profile.get("learning_level", 0),
                "topics_mastered": [t for t in user_profile.get("topics_learned", []) 
                                  if isinstance(t, dict) and t.get("mastery_level", 0) > 0.8],
                "topics_struggling": [t for t in user_profile.get("topics_learned", []) 
                                   if isinstance(t, dict) and t.get("mastery_level", 0) < 0.3],
                "learning_progression": learning_progression,
                "knowledge_gaps": self._identify_knowledge_gaps(user_profile, episodes)
            }
            
        except Exception as e:
            logger.error(f"Error building learning context: {e}")
            return {}
    
    async def _build_semantic_context(self, memory_context: Dict[str, Any]) -> Dict[str, Any]:
        """Build semantic knowledge context"""
        try:
            # This would integrate with the RAG pipeline
            # For now, return basic semantic context
            return {
                "related_concepts": [],
                "knowledge_graph": {},
                "semantic_similarity": 0.0
            }
            
        except Exception as e:
            logger.error(f"Error building semantic context: {e}")
            return {}
    
    async def _build_procedural_context(self, memory_context: Dict[str, Any]) -> Dict[str, Any]:
        """Build procedural knowledge context"""
        try:
            procedures = memory_context.get("procedures", [])
            
            relevant_procedures = []
            for procedure in procedures[:3]:  # Top 3 relevant procedures
                relevant_procedures.append({
                    "name": procedure.get("name"),
                    "description": procedure.get("description"),
                    "difficulty": procedure.get("difficulty_level"),
                    "estimated_time": procedure.get("estimated_time"),
                    "category": procedure.get("category")
                })
            
            return {
                "relevant_procedures": relevant_procedures,
                "user_progress": {},  # Would track user's progress on procedures
                "recommended_next_steps": []
            }
            
        except Exception as e:
            logger.error(f"Error building procedural context: {e}")
            return {}
    
    async def _build_emotional_context(self, memory_context: Dict[str, Any]) -> Dict[str, Any]:
        """Build emotional context"""
        try:
            user_profile = memory_context.get("user_profile", {})
            emotional_context = user_profile.get("emotional_context", {})
            
            return {
                "current_emotional_state": self._determine_current_emotional_state(emotional_context),
                "emotional_history": emotional_context,
                "confidence_level": self._assess_confidence_level(user_profile),
                "engagement_level": self._assess_engagement_level(user_profile)
            }
            
        except Exception as e:
            logger.error(f"Error building emotional context: {e}")
            return {}
    
    async def _optimize_context_for_tokens(
        self, 
        context: Dict[str, Any], 
        max_tokens: int
    ) -> Dict[str, Any]:
        """Optimize context to fit within token budget"""
        try:
            # Calculate current token usage
            current_tokens = self._estimate_tokens(context)
            
            if current_tokens <= max_tokens:
                return context
            
            # Prioritize context components
            optimized_context = {}
            remaining_tokens = max_tokens
            
            # Sort by priority
            sorted_components = sorted(
                context.items(),
                key=lambda x: self.context_priority.get(x[0], 0.5),
                reverse=True
            )
            
            for component_name, component_data in sorted_components:
                component_tokens = self._estimate_tokens({component_name: component_data})
                
                if component_tokens <= remaining_tokens:
                    optimized_context[component_name] = component_data
                    remaining_tokens -= component_tokens
                else:
                    # Truncate this component
                    truncated_data = await self._truncate_component(component_data, remaining_tokens)
                    if truncated_data:
                        optimized_context[component_name] = truncated_data
                    break
            
            return optimized_context
            
        except Exception as e:
            logger.error(f"Error optimizing context: {e}")
            return context
    
    async def _truncate_component(self, component_data: Any, max_tokens: int) -> Any:
        """Truncate a context component to fit token budget"""
        try:
            if isinstance(component_data, dict):
                # Truncate string values
                truncated = {}
                for key, value in component_data.items():
                    if isinstance(value, str) and len(value) > 100:
                        truncated[key] = value[:100] + "..."
                    else:
                        truncated[key] = value
                return truncated
            elif isinstance(component_data, list):
                # Take first few items
                return component_data[:max_tokens // 10]  # Rough estimate
            else:
                return component_data
                
        except Exception as e:
            logger.error(f"Error truncating component: {e}")
            return component_data
    
    async def _generate_context_summary(self, context: Dict[str, Any]) -> str:
        """Generate a human-readable context summary"""
        try:
            summary_parts = []
            
            # User profile summary
            user_profile = context.get("user_profile", {})
            if user_profile:
                level = user_profile.get("learning_level", 0)
                topics = len(user_profile.get("topics_learned", []))
                summary_parts.append(f"User is at learning level {level} with {topics} topics learned")
            
            # Conversation summary
            conversation = context.get("conversation_context", {})
            if conversation.get("recent_messages"):
                msg_count = len(conversation["recent_messages"])
                summary_parts.append(f"Recent conversation has {msg_count} messages")
            
            # Learning context
            learning = context.get("learning_context", {})
            if learning.get("knowledge_gaps"):
                gaps = len(learning["knowledge_gaps"])
                summary_parts.append(f"Identified {gaps} knowledge gaps")
            
            # Emotional context
            emotional = context.get("emotional_context", {})
            if emotional.get("current_emotional_state"):
                state = emotional["current_emotional_state"]
                summary_parts.append(f"User appears {state}")
            
            return "Context Summary: " + "; ".join(summary_parts)
            
        except Exception as e:
            logger.error(f"Error generating context summary: {e}")
            return "Context summary unavailable"
    
    def _analyze_conversation_flow(self, messages: List[Dict[str, Any]]) -> str:
        """Analyze the flow of conversation"""
        try:
            if not messages:
                return "No recent conversation"
            
            # Check for patterns
            question_count = sum(1 for msg in messages if msg.get("user_message", "").endswith("?"))
            explanation_count = sum(1 for msg in messages if "explain" in msg.get("user_message", "").lower())
            
            if question_count > len(messages) * 0.7:
                return "User is asking many questions - needs guidance"
            elif explanation_count > 0:
                return "User is seeking explanations - educational mode"
            else:
                return "General conversation flow"
                
        except Exception as e:
            logger.error(f"Error analyzing conversation flow: {e}")
            return "Unknown conversation flow"
    
    def _identify_knowledge_gaps(
        self, 
        user_profile: Dict[str, Any], 
        episodes: List[Dict[str, Any]]
    ) -> List[str]:
        """Identify knowledge gaps from user profile and episodes"""
        try:
            gaps = []
            
            # Check for confusion episodes
            for episode in episodes:
                if episode.get("episode_type") == "confusion":
                    content = episode.get("content", "")
                    # Extract topic from content (simplified)
                    if "blockchain" in content.lower():
                        gaps.append("blockchain fundamentals")
                    elif "trading" in content.lower():
                        gaps.append("trading concepts")
                    elif "wallet" in content.lower():
                        gaps.append("wallet management")
            
            return list(set(gaps))  # Remove duplicates
            
        except Exception as e:
            logger.error(f"Error identifying knowledge gaps: {e}")
            return []
    
    def _determine_current_emotional_state(self, emotional_context: Dict[str, Any]) -> str:
        """Determine current emotional state from context"""
        try:
            if not emotional_context:
                return "neutral"
            
            # Find dominant emotion
            max_emotion = max(emotional_context.items(), key=lambda x: x[1])
            emotion, score = max_emotion
            
            if score > 0.3:
                return emotion
            else:
                return "neutral"
                
        except Exception as e:
            logger.error(f"Error determining emotional state: {e}")
            return "neutral"
    
    def _assess_confidence_level(self, user_profile: Dict[str, Any]) -> str:
        """Assess user's confidence level"""
        try:
            learning_level = user_profile.get("learning_level", 0)
            interaction_count = user_profile.get("interaction_count", 0)
            
            if learning_level > 70 and interaction_count > 20:
                return "high"
            elif learning_level > 40 and interaction_count > 10:
                return "medium"
            else:
                return "low"
                
        except Exception as e:
            logger.error(f"Error assessing confidence level: {e}")
            return "unknown"
    
    def _assess_engagement_level(self, user_profile: Dict[str, Any]) -> str:
        """Assess user's engagement level"""
        try:
            recent_interactions = user_profile.get("recent_interactions", 0)
            last_active = user_profile.get("last_active")
            
            if recent_interactions > 5:
                return "high"
            elif recent_interactions > 2:
                return "medium"
            else:
                return "low"
                
        except Exception as e:
            logger.error(f"Error assessing engagement level: {e}")
            return "unknown"
    
    def _estimate_tokens(self, content: Any) -> int:
        """Estimate token count for content"""
        try:
            if isinstance(content, str):
                return len(content.split()) * 1.3  # Rough estimate
            elif isinstance(content, dict):
                return sum(self._estimate_tokens(v) for v in content.values())
            elif isinstance(content, list):
                return sum(self._estimate_tokens(item) for item in content)
            else:
                return 1
                
        except Exception as e:
            logger.error(f"Error estimating tokens: {e}")
            return 100  # Default estimate
    
    def _get_context_sources(self, context: Dict[str, Any]) -> List[str]:
        """Get list of context sources used"""
        try:
            sources = []
            for component_name in context.keys():
                if component_name in self.context_priority:
                    sources.append(component_name)
            return sources
            
        except Exception as e:
            logger.error(f"Error getting context sources: {e}")
            return []
