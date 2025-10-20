"""
Educator Agent - Dynamic AI-powered educational content
Part of the multi-agent AI system for EAILI5
"""

import asyncio
from typing import Dict, List, Any, Optional
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class EducatorAgent:
    """
    Specialized agent for educational content and explanations.
    Uses OpenAI to generate dynamic, personalized educational responses.
    """
    
    def __init__(self, openai_service=None):
        self.openai_service = openai_service
        self.system_prompt = """You are EAILI5 (pronounced Ee-ai-lis), an enthusiastic crypto educator who tells the truth.

Core traits:
- Enthusiastic and energetic about teaching
- Friendly, patient, and encouraging
- Brutally honest - never praise bad decisions
- Encouraging but realistic - "You're learning, but that wasn't smart"
- Educational focus - always explain WHY something is good/bad
- No sugar-coating - call out mistakes directly but kindly
- Never condescending or overly technical
- Has a sense of humor but stays professional

Voice:
- Natural, conversational tone
- Use "I" naturally but don't over-sign responses
- Direct and honest in a friendly way
- Celebrate learning and small wins: "You're getting it!"
- Use analogies and real-world examples
- Be transparent: "I don't give financial advice, but I can explain how this works"

Avoid:
- Saying "Great trade!" when it wasn't
- False encouragement
- Technical jargon without explanation
- Financial advice (you're a teacher, not advisor)
- Being condescending or overly technical

Formatting rules:
- Write in natural, flowing paragraphs like ChatGPT
- DO NOT use markdown formatting like **bold** or __underline__
- Use plain text with natural line breaks for readability
- You can use bullet points with simple dashes (-) when listing items
- Keep responses conversational and flowing, not structured/formal
- Write like you're texting a friend, not writing documentation

Your teaching approach:
- Start with the basics, build complexity gradually
- Use analogies that relate to everyday life
- Break down complex concepts into digestible pieces
- Always explain WHY something is good or bad
- Be honest about risks and mistakes
- Celebrate small wins and learning progress
- Use humor appropriately to make learning fun

Learning level adaptation:
You have access to the user's learning level (0-100):
- 0-20: Complete beginner - use simple analogies, avoid jargon, explain basic concepts
- 21-50: Learning basics - introduce concepts gradually, use simple terms
- 51-80: Understanding fundamentals - more technical depth, explain intermediate concepts
- 81-100: Advanced learner - full technical analysis, use advanced terminology

Always explain WHY, not just WHAT. Your goal is education, not validation.

Remember: You are an educator, not a financial advisor. Focus on teaching concepts, not giving investment advice."""

    async def process_stream(self, message: str, user_id: str, learning_level: int = 0, context: Dict[str, Any] = None):
        """
        Process message with streaming response
        
        Yields:
            Dict with 'type' and 'content':
            - {'type': 'chunk', 'content': 'char'} - Character chunk
            - {'type': 'done', 'content': ''} - Stream complete
        """
        try:
            if not self.openai_service or not self.openai_service.client:
                yield {"type": "error", "content": "AI service not ready"}
                return
            
            # Build comprehensive system prompt with learning level context
            system_prompt = self._build_system_prompt(learning_level, context)
            
            # Build full message history for context awareness
            messages = [{"role": "system", "content": system_prompt}]
            
            # Add conversation history from context
            if context and context.get('recent_messages'):
                for msg in context['recent_messages'][-5:]:  # Last 5 exchanges
                    if isinstance(msg, dict):
                        user_msg = msg.get('message', '')
                        ai_response = msg.get('response', '')
                        if user_msg:
                            messages.append({"role": "user", "content": user_msg})
                        if ai_response:
                            messages.append({"role": "assistant", "content": ai_response})
            
            # Add current message
            messages.append({"role": "user", "content": message})
            
            # Stream response from OpenAI
            async for chunk in self.openai_service.generate_response_stream(
                messages=messages,
                temperature=0.7,
                max_tokens=1500
            ):
                yield chunk
                
        except Exception as e:
            logger.error(f"Error in educator streaming: {e}")
            yield {"type": "error", "content": str(e)}

    async def process(self, message: str, user_id: str, learning_level: int, context: Dict[str, Any] = None) -> str:
        """
        Process educational questions using OpenAI to generate dynamic responses
        
        Args:
            message: User's question or request
            user_id: Unique identifier for the user
            learning_level: User's current learning level (0-100)
            context: Additional context about the user's situation
            
        Returns:
            Dynamic AI-generated educational response
        """
        try:
            logger.debug(f"EducatorAgent processing message: {message[:100]}...")
            logger.debug(f"User ID: {user_id}, Learning Level: {learning_level}")
            logger.debug(f"Context: {context}")
            logger.debug(f"OpenAI service available: {self.openai_service is not None}")
            
            if not self.openai_service:
                logger.error("OpenAI service not available")
                return "I'm having trouble connecting to my AI brain right now. Please try again!"
            
            # Build comprehensive system prompt with learning level context
            system_prompt = self._build_system_prompt(learning_level, context)
            
            # Build full message history for context awareness
            messages = [{"role": "system", "content": system_prompt}]
            
            # Add conversation history from context
            if context and context.get('recent_messages'):
                for msg in context['recent_messages'][-5:]:  # Last 5 exchanges
                    if isinstance(msg, dict):
                        user_msg = msg.get('message', '')
                        ai_response = msg.get('response', '')
                        if user_msg:
                            messages.append({"role": "user", "content": user_msg})
                        if ai_response:
                            messages.append({"role": "assistant", "content": ai_response})
            
            # Add current message
            messages.append({"role": "user", "content": message})
            
            # Call OpenAI with full conversation history
            response_dict = await self.openai_service.generate_response(
                messages=messages,
                temperature=0.7,
                max_tokens=1500
            )
            
            # Extract content from response dictionary
            response_text = response_dict.get('content', '')
            logger.info(f"EducatorAgent - OpenAI response_dict: {response_dict}")
            logger.info(f"EducatorAgent - Extracted content: '{response_text}'")
            logger.info(f"EducatorAgent - Content length: {len(response_text) if response_text else 0}")
            
            # Ensure we never return empty response
            if not response_text or response_text.strip() == '':
                logger.warning("EducatorAgent - OpenAI returned empty content, using fallback")
                response_text = "I'm sorry, I'm having trouble generating a response right now. Could you try asking your question in a different way?"
            
            return response_text
            
        except Exception as e:
            logger.error(f"Error in EducatorAgent.process: {type(e).__name__}: {e}")
            logger.error(f"Traceback: {e.__traceback__}")
            return "I'm having trouble explaining that right now. Could you try rephrasing your question?"
    
    def _build_system_prompt(self, learning_level: int, context: Dict[str, Any] = None) -> str:
        """
        Build comprehensive system prompt with learning level context
        """
        base_prompt = self.system_prompt
        
        # Add learning level context
        if learning_level <= 20:
            level_context = "\n\nIMPORTANT: This user is a BEGINNER (0-20 level). Use simple analogies, everyday examples, and basic concepts. Avoid technical jargon."
        elif learning_level <= 60:
            level_context = "\n\nIMPORTANT: This user is INTERMEDIATE (21-60 level). You can use some technical terms but always explain them. Focus on practical applications."
        else:
            level_context = "\n\nIMPORTANT: This user is ADVANCED (61-100 level). You can dive into technical details and advanced concepts. They understand crypto fundamentals."
        
        # Add context about user's situation if available
        context_info = ""
        if context:
            if context.get('portfolio_data'):
                context_info += f"\n\nUser's Portfolio Context: {context['portfolio_data']}"
            if context.get('recent_trades'):
                context_info += f"\n\nRecent Trading Activity: {context['recent_trades']}"
            if context.get('token_of_interest'):
                context_info += f"\n\nToken of Interest: {context['token_of_interest']}"
            
            # Add conversation history for context awareness
            if context.get('recent_messages'):
                recent_messages = context['recent_messages']
                if recent_messages:
                    context_info += f"\n\nRecent Conversation Context:"
                    for msg in recent_messages[-3:]:  # Last 3 messages
                        if isinstance(msg, dict):
                            user_msg = msg.get('message', '')
                            ai_response = msg.get('response', '')
                            if user_msg:
                                context_info += f"\n- User: {user_msg}"
                            if ai_response:
                                context_info += f"\n- EAILI5: {ai_response[:100]}..."
            
            # Add previous messages for immediate context
            if context.get('previous_messages'):
                prev_messages = context['previous_messages']
                if prev_messages:
                    context_info += f"\n\nPrevious Messages in this conversation:"
                    for msg in prev_messages[-2:]:  # Last 2 messages
                        context_info += f"\n- {msg}"
        
        return base_prompt + level_context + context_info