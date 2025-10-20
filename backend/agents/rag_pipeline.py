"""
RAG Pipeline - Retrieval-Augmented Generation for educational content
Part of the DeCrypt backend services
"""

import asyncio
from typing import Dict, List, Any, Optional
import logging
from datetime import datetime
import json
import hashlib

logger = logging.getLogger(__name__)

class RAGPipeline:
    """
    Retrieval-Augmented Generation pipeline for educational content
    """
    
    def __init__(self):
        self.vector_store = None
        self.embeddings_service = None
        self.redis_service = None
        
        # Educational content categories
        self.content_categories = {
            "basics": "Cryptocurrency fundamentals",
            "blockchain": "Blockchain technology",
            "trading": "Trading strategies and concepts",
            "defi": "Decentralized finance",
            "security": "Security and safety",
            "base": "Base ecosystem",
            "wallets": "Wallet management",
            "dex": "Decentralized exchanges"
        }
    
    async def initialize(self, vector_store, embeddings_service, redis_service):
        """Initialize RAG pipeline"""
        try:
            self.vector_store = vector_store
            self.embeddings_service = embeddings_service
            self.redis_service = redis_service
            
            logger.info("RAG pipeline initialized successfully")
            
        except Exception as e:
            logger.error(f"Error initializing RAG pipeline: {e}")
            raise
    
    async def add_educational_content(self, content: Dict[str, Any]) -> bool:
        """
        Add educational content to the vector store
        """
        try:
            # Generate embeddings for the content
            text = f"{content.get('title', '')} {content.get('content', '')}"
            embedding = await self.embeddings_service.generate_embeddings(text)
            
            if not embedding:
                return False
            
            # Create document for vector store
            document = {
                "id": content.get("id", self._generate_id(text)),
                "title": content.get("title", ""),
                "content": content.get("content", ""),
                "category": content.get("category", "general"),
                "difficulty_level": content.get("difficulty_level", 1),
                "tags": content.get("tags", []),
                "embedding": embedding,
                "metadata": {
                    "created_at": datetime.now().isoformat(),
                    "source": content.get("source", "manual"),
                    "author": content.get("author", "DeCrypt"),
                    "version": content.get("version", "1.0")
                }
            }
            
            # Store in vector database
            await self.vector_store.add_documents([document])
            
            # Cache in Redis
            cache_key = f"educational_content:{document['id']}"
            await self.redis_service.set(cache_key, document, 3600)  # 1 hour cache
            
            return True
            
        except Exception as e:
            logger.error(f"Error adding educational content: {e}")
            return False
    
    async def retrieve_relevant_content(
        self,
        query: str,
        category: Optional[str] = None,
        difficulty_level: Optional[int] = None,
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Retrieve relevant educational content based on query
        """
        try:
            # Generate query embedding
            query_embedding = await self.embeddings_service.generate_embeddings(query)
            
            if not query_embedding:
                return []
            
            # Search vector store
            search_params = {
                "query_embedding": query_embedding,
                "limit": limit,
                "similarity_threshold": 0.7
            }
            
            if category:
                search_params["filter"] = {"category": category}
            
            if difficulty_level:
                search_params["filter"] = {
                    **search_params.get("filter", {}),
                    "difficulty_level": difficulty_level
                }
            
            results = await self.vector_store.similarity_search(**search_params)
            
            # Format results
            formatted_results = []
            for result in results:
                formatted_result = {
                    "id": result.get("id"),
                    "title": result.get("title"),
                    "content": result.get("content"),
                    "category": result.get("category"),
                    "difficulty_level": result.get("difficulty_level"),
                    "tags": result.get("tags", []),
                    "similarity_score": result.get("similarity_score", 0),
                    "metadata": result.get("metadata", {})
                }
                formatted_results.append(formatted_result)
            
            return formatted_results
            
        except Exception as e:
            logger.error(f"Error retrieving relevant content: {e}")
            return []
    
    async def generate_contextual_response(
        self,
        user_question: str,
        learning_level: int,
        context: Dict[str, Any] = None
    ) -> str:
        """
        Generate contextual response using RAG
        """
        try:
            # Determine content category based on question
            category = self._classify_question_category(user_question)
            
            # Retrieve relevant content
            relevant_content = await self.retrieve_relevant_content(
                query=user_question,
                category=category,
                difficulty_level=self._get_difficulty_level(learning_level),
                limit=3
            )
            
            if not relevant_content:
                return "I don't have specific information about that topic. Could you try asking it differently?"
            
            # Format context for AI
            context_text = self._format_content_for_ai(relevant_content, user_question)
            
            # Generate response using retrieved content
            response = await self._generate_rag_response(
                user_question=user_question,
                context_text=context_text,
                learning_level=learning_level,
                relevant_content=relevant_content
            )
            
            return response
            
        except Exception as e:
            logger.error(f"Error generating contextual response: {e}")
            return "I'm sorry, I encountered an issue processing your question. Please try again."
    
    def _classify_question_category(self, question: str) -> str:
        """Classify question into content category"""
        question_lower = question.lower()
        
        if any(word in question_lower for word in ["blockchain", "chain", "network"]):
            return "blockchain"
        elif any(word in question_lower for word in ["trade", "trading", "buy", "sell"]):
            return "trading"
        elif any(word in question_lower for word in ["defi", "decentralized", "protocol"]):
            return "defi"
        elif any(word in question_lower for word in ["wallet", "store", "keep"]):
            return "wallets"
        elif any(word in question_lower for word in ["dex", "exchange", "swap"]):
            return "dex"
        elif any(word in question_lower for word in ["base", "layer 2", "l2"]):
            return "base"
        elif any(word in question_lower for word in ["safe", "security", "scam", "protect"]):
            return "security"
        else:
            return "basics"
    
    def _get_difficulty_level(self, learning_level: int) -> int:
        """Map learning level to difficulty level"""
        if learning_level < 20:
            return 1  # Beginner
        elif learning_level < 50:
            return 2  # Intermediate
        else:
            return 3  # Advanced
    
    def _format_content_for_ai(self, content: List[Dict[str, Any]], question: str) -> str:
        """Format retrieved content for AI consumption"""
        context_parts = []
        
        for i, item in enumerate(content, 1):
            context_part = f"""
{i}. {item['title']}
   Content: {item['content'][:500]}...
   Category: {item['category']}
   Difficulty: {item['difficulty_level']}
   Tags: {', '.join(item.get('tags', []))}
"""
            context_parts.append(context_part)
        
        return "\n".join(context_parts)
    
    async def _generate_rag_response(
        self,
        user_question: str,
        context_text: str,
        learning_level: int,
        relevant_content: List[Dict[str, Any]]
    ) -> str:
        """Generate response using retrieved content"""
        try:
            # Create prompt for AI
            prompt = f"""
You are DeCrypt, an AI teacher specializing in cryptocurrency education.

User Question: {user_question}
User Learning Level: {learning_level}/100

Relevant Educational Content:
{context_text}

Instructions:
1. Use the provided content to answer the user's question
2. Tailor your explanation to their learning level ({learning_level}/100)
3. If the content doesn't fully answer the question, say so and suggest what they should ask instead
4. Always be encouraging and educational
5. Don't provide financial advice, only educational information
6. Focus on teaching concepts, not giving specific recommendations

Please provide a comprehensive, educational response based on the retrieved content.
"""
            
            # Use OpenAI to generate response
            # This would be called through the OpenAI service
            # For now, return a placeholder
            return f"Based on the educational content I found, here's what I can tell you about your question: {user_question[:100]}..."
            
        except Exception as e:
            logger.error(f"Error generating RAG response: {e}")
            return "I'm sorry, I couldn't generate a proper response. Please try asking your question differently."
    
    def _generate_id(self, text: str) -> str:
        """Generate unique ID for content"""
        return hashlib.md5(text.encode()).hexdigest()[:16]
    
    async def get_content_by_category(self, category: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Get content by category"""
        try:
            # This would query the vector store by category
            # For now, return empty list
            return []
            
        except Exception as e:
            logger.error(f"Error getting content by category: {e}")
            return []
    
    async def update_content(self, content_id: str, updates: Dict[str, Any]) -> bool:
        """Update existing content"""
        try:
            # Update in vector store
            # Update in Redis cache
            # Return success status
            return True
            
        except Exception as e:
            logger.error(f"Error updating content: {e}")
            return False
    
    async def delete_content(self, content_id: str) -> bool:
        """Delete content"""
        try:
            # Delete from vector store
            # Delete from Redis cache
            # Return success status
            return True
            
        except Exception as e:
            logger.error(f"Error deleting content: {e}")
            return False
