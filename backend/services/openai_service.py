"""
OpenAI Service - AI agent orchestration and function calling
Part of the DeCrypt backend services
"""

import asyncio
from typing import Dict, List, Any, Optional, Callable
import logging
from datetime import datetime
import openai
from openai import AsyncOpenAI

logger = logging.getLogger(__name__)

class OpenAIService:
    """
    Service for OpenAI API interactions and function calling
    """
    
    def __init__(self):
        self.client = None
        self.api_key = None
        
        # Function definitions for AI agents
        self.functions = {
            "get_token_data": {
                "name": "get_token_data",
                "description": "Get real-time data for a specific token",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "token_address": {
                            "type": "string",
                            "description": "The contract address of the token"
                        }
                    },
                    "required": ["token_address"]
                }
            },
            "get_trending_tokens": {
                "name": "get_trending_tokens",
                "description": "Get trending tokens from Base DEXs",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "limit": {
                            "type": "integer",
                            "description": "Number of tokens to return (default: 20)"
                        }
                    }
                }
            },
            "search_web": {
                "name": "search_web",
                "description": "Search the web for latest crypto information",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "query": {
                            "type": "string",
                            "description": "Search query for crypto information"
                        }
                    },
                    "required": ["query"]
                }
            },
            "simulate_trade": {
                "name": "simulate_trade",
                "description": "Simulate a trade in the virtual portfolio",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "token_address": {
                            "type": "string",
                            "description": "Token contract address"
                        },
                        "trade_type": {
                            "type": "string",
                            "enum": ["buy", "sell"],
                            "description": "Type of trade"
                        },
                        "amount": {
                            "type": "number",
                            "description": "Trade amount in USD"
                        }
                    },
                    "required": ["token_address", "trade_type", "amount"]
                }
            }
        }
    
    async def initialize(self, api_key: str):
        """Initialize OpenAI service"""
        try:
            self.api_key = api_key
            self.client = AsyncOpenAI(api_key=api_key)
            logger.info("OpenAI service initialized successfully")
            
        except Exception as e:
            logger.error(f"Error initializing OpenAI service: {e}")
            raise
    
    async def generate_response(
        self,
        messages: List[Dict[str, str]],
        functions: Optional[List[Dict[str, Any]]] = None,
        function_call: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 1000
    ) -> Dict[str, Any]:
        """
        Generate AI response with optional function calling (non-streaming)
        """
        try:
            logger.info(f"OpenAI service generating response with {len(messages)} messages")
            logger.info(f"Messages: {messages}")
            
            if not self.client:
                logger.error("OpenAI client not initialized")
                raise Exception("OpenAI client not initialized")
            
            # Prepare request
            request_data = {
                "model": "gpt-4o-mini",
                "messages": messages,
                "temperature": temperature,
                "max_tokens": max_tokens
            }
            
            if functions:
                request_data["functions"] = functions
                if function_call:
                    request_data["function_call"] = function_call
            
            logger.info(f"Making OpenAI API call with request: {request_data}")
            
            # Make API call
            response = await self.client.chat.completions.create(**request_data)
            logger.info(f"OpenAI API response received: {response}")
            
            # Parse response
            message = response.choices[0].message
            result = {
                "content": message.content,
                "role": message.role,
                "function_call": message.function_call,
                "finish_reason": response.choices[0].finish_reason
            }
            
            logger.info(f"Parsed OpenAI response: {result}")
            return result
            
        except Exception as e:
            logger.error(f"Error generating OpenAI response: {e}")
            logger.error(f"Error type: {type(e)}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            return {
                "content": "I'm sorry, I encountered an issue processing your request. Please try again.",
                "role": "assistant",
                "function_call": None,
                "finish_reason": "error"
            }
    
    async def generate_response_stream(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.7,
        max_tokens: int = 1000
    ):
        """
        Generate AI response with character-by-character streaming
        
        Yields:
            Dict with 'type' and 'content':
            - {'type': 'chunk', 'content': 'char'} - Character chunk
            - {'type': 'done', 'content': ''} - Stream complete
            - {'type': 'error', 'content': 'error message'} - Error occurred
        """
        try:
            logger.info(f"OpenAI service starting streaming response with {len(messages)} messages")
            
            if not self.client:
                logger.error("OpenAI client not initialized")
                yield {"type": "error", "content": "OpenAI client not initialized"}
                return
            
            # Prepare streaming request
            request_data = {
                "model": "gpt-4o-mini",
                "messages": messages,
                "temperature": temperature,
                "max_tokens": max_tokens,
                "stream": True
            }
            
            logger.info("Making streaming OpenAI API call")
            
            # Make streaming API call
            stream = await self.client.chat.completions.create(**request_data)
            
            # Stream response following OpenAI best practices - yield complete tokens
            async for chunk in stream:
                if chunk.choices[0].delta.content:
                    content = chunk.choices[0].delta.content
                    # Yield each token as it comes (OpenAI already handles tokenization)
                    yield {"type": "chunk", "content": content}
                
                # Check if stream is complete
                if chunk.choices[0].finish_reason:
                    logger.info(f"Stream complete with reason: {chunk.choices[0].finish_reason}")
                    yield {"type": "done", "content": ""}
                    return
            
            # If we exit the loop without finish_reason, still mark as done
            yield {"type": "done", "content": ""}
            
        except Exception as e:
            logger.error(f"Error in streaming response: {e}")
            logger.error(f"Error type: {type(e)}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            yield {"type": "error", "content": str(e)}
    
    async def generate_embeddings(self, text: str, model: str = "text-embedding-3-large") -> List[float]:
        """
        Generate embeddings for text
        """
        try:
            if not self.client:
                raise Exception("OpenAI client not initialized")
            
            response = await self.client.embeddings.create(
                model=model,
                input=text
            )
            
            return response.data[0].embedding
            
        except Exception as e:
            logger.error(f"Error generating embeddings: {e}")
            return []
    
    async def generate_educational_response(
        self,
        user_question: str,
        learning_level: int,
        context: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Generate educational response tailored to user's learning level
        """
        try:
            # System prompt based on learning level
            if learning_level < 20:
                system_prompt = """You are DeCrypt, a friendly and patient AI teacher specializing in cryptocurrency education for complete beginners.

Your personality:
- Always encouraging and supportive
- Never condescending or technical
- Use analogies and real-world examples
- Celebrate small wins and learning progress
- Be transparent about what you don't know

Your teaching approach:
- Start with the basics, build complexity gradually
- Use analogies that relate to everyday life
- Break down complex concepts into digestible pieces
- Ask follow-up questions to check understanding
- Provide visual descriptions when helpful

Remember: You are an educator, not a financial advisor. Focus on teaching concepts, not giving investment advice."""
            
            elif learning_level < 50:
                system_prompt = """You are DeCrypt, an AI teacher specializing in cryptocurrency education for intermediate learners.

Your personality:
- Knowledgeable but approachable
- Use some technical terms but explain them
- Provide practical examples and use cases
- Encourage deeper learning and exploration
- Be honest about complexity when it exists

Your teaching approach:
- Build on existing knowledge
- Introduce intermediate concepts gradually
- Use real-world examples and case studies
- Encourage hands-on learning
- Connect concepts to practical applications

Remember: You are an educator, not a financial advisor. Focus on teaching concepts, not giving investment advice."""
            
            else:
                system_prompt = """You are DeCrypt, an AI teacher specializing in cryptocurrency education for advanced learners.

Your personality:
- Highly knowledgeable and detailed
- Use technical terms appropriately
- Provide in-depth analysis and insights
- Encourage critical thinking and analysis
- Be precise and accurate in explanations

Your teaching approach:
- Dive deep into technical concepts
- Provide comprehensive analysis
- Use advanced examples and case studies
- Encourage independent research
- Connect to broader market dynamics

Remember: You are an educator, not a financial advisor. Focus on teaching concepts, not giving investment advice."""
            
            # Add context if provided
            if context:
                system_prompt += f"\n\nAdditional context: {context}"
            
            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_question}
            ]
            
            response = await self.generate_response(
                messages=messages,
                temperature=0.7,
                max_tokens=1500
            )
            
            return response.get("content", "I'm sorry, I couldn't generate a response.")
            
        except Exception as e:
            logger.error(f"Error generating educational response: {e}")
            return "I'm sorry, I encountered an issue processing your question. Could you try rephrasing it?"
    
    async def generate_research_analysis(
        self,
        token_data: Dict[str, Any],
        user_question: str
    ) -> str:
        """
        Generate research analysis for token data
        """
        try:
            system_prompt = """You are DeCrypt's Research Agent, specializing in cryptocurrency market analysis and token research.

Your expertise:
- Real-time token data analysis
- DEX liquidity and volume analysis
- Market sentiment and trends
- Risk assessment and safety analysis
- Technical indicators and patterns

Your approach:
- Provide data-driven insights
- Explain complex metrics in simple terms
- Highlight both opportunities and risks
- Use current market data
- Focus on educational value, not financial advice

Remember: You are a research tool, not a financial advisor. Always emphasize that this is educational content."""
            
            # Format token data for analysis
            data_summary = f"""
Token Analysis Data:
- Address: {token_data.get('address', 'N/A')}
- Name: {token_data.get('name', 'N/A')}
- Symbol: {token_data.get('symbol', 'N/A')}
- Price: ${token_data.get('price', 0):.6f}
- Market Cap: ${token_data.get('market_cap', 0):,.0f}
- Volume 24h: ${token_data.get('volume_24h', 0):,.0f}
- Liquidity: ${token_data.get('liquidity', 0):,.0f}
- Holders: {token_data.get('holders', 0):,}
- Safety Score: {token_data.get('safety_score', 0)}/100
"""
            
            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"{user_question}\n\n{data_summary}"}
            ]
            
            response = await self.generate_response(
                messages=messages,
                temperature=0.6,
                max_tokens=1200
            )
            
            return response.get("content", "I'm sorry, I couldn't analyze this token data.")
            
        except Exception as e:
            logger.error(f"Error generating research analysis: {e}")
            return "I'm sorry, I encountered an issue analyzing this token. Please try again."
    
    async def generate_portfolio_advice(
        self,
        portfolio_data: Dict[str, Any],
        user_question: str
    ) -> str:
        """
        Generate portfolio advice and analysis
        """
        try:
            system_prompt = """You are DeCrypt's Portfolio Advisor, specializing in virtual portfolio management and trading education.

Your expertise:
- Virtual portfolio simulation and management
- Trading strategy education and explanation
- Risk management and position sizing
- Performance analysis and insights
- Educational guidance on trading decisions

Your approach:
- Focus on education, not financial advice
- Explain the reasoning behind trading decisions
- Help users understand risk and reward
- Provide practical trading insights
- Use real market data for realistic simulation

Remember: You are an educational tool, not a financial advisor. Always emphasize learning and risk awareness."""
            
            # Format portfolio data
            portfolio_summary = f"""
Portfolio Analysis Data:
- Total Value: ${portfolio_data.get('total_value', 0):.2f}
- Cash Balance: ${portfolio_data.get('cash_balance', 0):.2f}
- Initial Balance: ${portfolio_data.get('initial_balance', 0):.2f}
- Total Return: ${portfolio_data.get('total_return', 0):.2f}
- Return Percentage: {portfolio_data.get('return_percentage', 0):.2f}%
- Number of Holdings: {len(portfolio_data.get('holdings', []))}
- Total Trades: {portfolio_data.get('total_trades', 0)}
"""
            
            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"{user_question}\n\n{portfolio_summary}"}
            ]
            
            response = await self.generate_response(
                messages=messages,
                temperature=0.6,
                max_tokens=1200
            )
            
            return response.get("content", "I'm sorry, I couldn't analyze your portfolio.")
            
        except Exception as e:
            logger.error(f"Error generating portfolio advice: {e}")
            return "I'm sorry, I encountered an issue analyzing your portfolio. Please try again."
    
    async def generate_web_search_summary(
        self,
        search_results: List[Dict[str, Any]],
        user_question: str
    ) -> str:
        """
        Generate summary of web search results
        """
        try:
            system_prompt = """You are DeCrypt's Web Search Agent, specializing in real-time web searches and latest cryptocurrency information.

Your expertise:
- Real-time web search and information gathering
- Latest crypto news and market updates
- Current events and market sentiment
- Fact-checking and information verification
- Web-based research and analysis

Your approach:
- Provide current, accurate information
- Explain complex topics in simple terms
- Focus on educational value and learning
- Verify information from multiple sources
- Use web search to enhance understanding

Remember: You are an educational tool, not a financial advisor. Always emphasize learning and current information."""
            
            # Format search results
            results_summary = "\n".join([
                f"- {result.get('title', 'No title')}: {result.get('content', 'No content')[:200]}..."
                for result in search_results[:5]
            ])
            
            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"{user_question}\n\nSearch Results:\n{results_summary}"}
            ]
            
            response = await self.generate_response(
                messages=messages,
                temperature=0.6,
                max_tokens=1200
            )
            
            return response.get("content", "I'm sorry, I couldn't summarize the search results.")
            
        except Exception as e:
            logger.error(f"Error generating web search summary: {e}")
            return "I'm sorry, I encountered an issue summarizing the search results. Please try again."
    
    async def health_check(self) -> bool:
        """Check OpenAI API health"""
        try:
            if not self.client:
                return False
            
            # Simple test request
            response = await self.generate_response([
                {"role": "user", "content": "Hello"}
            ])
            
            return response.get("content") is not None
            
        except Exception as e:
            logger.error(f"OpenAI health check failed: {e}")
            return False
