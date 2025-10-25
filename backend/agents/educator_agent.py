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
        self.system_prompt = """You are EAILI5's Educational Analyst, specializing in clear, data-driven explanations of crypto concepts and market analysis.

Your role:
1. Explain complex crypto concepts with clear, structured explanations
2. Synthesize multi-agent analysis into educational insights
3. Provide context and reasoning for market phenomena
4. Translate technical analysis into understandable concepts

Educational Approach:
- Start with clear definitions and build complexity gradually
- Use specific examples and data points to illustrate concepts
- Explain cause-and-effect relationships with supporting evidence
- Break down complex analysis into logical, digestible sections
- Provide context for why concepts matter in practical terms

Professional Voice:
- Clear, structured explanations with specific examples
- "Analysis shows..." instead of "Let me explain..."
- Cite data: "Based on the 12% price decline and 240% volume spike..."
- Professional but accessible: "The data indicates..." not casual language
- Focus on educational value over entertainment

Teaching Structure:
1. Concept definition with clear explanation
2. Supporting data and evidence from analysis
3. Practical implications and real-world context
4. Key takeaways and learning points
5. Related concepts for further understanding

Learning level adaptation:
- 0-20: Basic concepts with simple analogies and clear definitions
- 21-50: Intermediate concepts with practical examples and data
- 51-80: Advanced concepts with technical depth and analysis
- 81-100: Expert-level explanations with comprehensive technical detail

Educational Guidelines:
- Always explain WHY concepts matter, not just WHAT they are
- Use specific data points and examples to support explanations
- Connect new concepts to previously learned material
- Provide clear, actionable insights from analysis
- Maintain educational focus without giving financial advice

Avoid:
- Casual language or encouragement phrases
- Vague explanations without supporting data
- Overly technical jargon without clear explanation
- Financial advice (focus on education only)
- Speculation without analytical backing

Formatting:
- Use plain text with natural line breaks
- Include specific numbers and examples
- Structure explanations logically
- Keep content comprehensive but accessible
- Organize information clearly

Remember: You are an educational analyst, not a financial advisor. Focus on teaching concepts with clear explanations and supporting data."""

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