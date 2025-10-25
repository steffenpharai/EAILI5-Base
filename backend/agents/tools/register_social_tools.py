"""
Register Social Sentiment Tools with Tool Registry
Part of the EAILI5 multi-agent tool system
"""

import logging
from typing import Dict, Any
from .tool_registry import ToolRegistry, ToolDefinition
from .social_sentiment_tools import SocialSentimentTools

logger = logging.getLogger(__name__)

def register_social_sentiment_tools(tool_registry: ToolRegistry, sentiment_service) -> bool:
    """
    Register all social sentiment tools with the tool registry
    
    Args:
        tool_registry: ToolRegistry instance
        sentiment_service: SentimentService instance
        
    Returns:
        bool: True if all tools registered successfully
    """
    try:
        # Initialize social sentiment tools
        social_tools = SocialSentimentTools(sentiment_service)
        
        # Define tool definitions
        tools_to_register = [
            {
                "name": "fetch_reddit_sentiment",
                "description": "Fetch Reddit sentiment analysis for a token from specific subreddit",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "token_symbol": {
                            "type": "string",
                            "description": "Token symbol to search for"
                        },
                        "subreddit": {
                            "type": "string",
                            "description": "Reddit subreddit to search (default: CryptoCurrency)",
                            "default": "CryptoCurrency"
                        },
                        "hours": {
                            "type": "integer",
                            "description": "Hours to look back (default: 24)",
                            "default": 24
                        }
                    },
                    "required": ["token_symbol"]
                },
                "function": social_tools.fetch_reddit_sentiment,
                "category": "social_sentiment",
                "rate_limit": 10
            },
            {
                "name": "fetch_farcaster_sentiment",
                "description": "Fetch Farcaster sentiment analysis for a token from specific channel",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "token_symbol": {
                            "type": "string",
                            "description": "Token symbol to search for"
                        },
                        "channel": {
                            "type": "string",
                            "description": "Farcaster channel to search (default: crypto)",
                            "default": "crypto"
                        },
                        "hours": {
                            "type": "integer",
                            "description": "Hours to look back (default: 24)",
                            "default": 24
                        }
                    },
                    "required": ["token_symbol"]
                },
                "function": social_tools.fetch_farcaster_sentiment,
                "category": "social_sentiment",
                "rate_limit": 10
            },
            {
                "name": "analyze_sentiment_shift",
                "description": "Analyze sentiment shift over specified timeframe",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "token_address": {
                            "type": "string",
                            "description": "Token contract address"
                        },
                        "timeframe": {
                            "type": "string",
                            "description": "Timeframe to analyze (24h, 7d, 30d)",
                            "default": "24h"
                        }
                    },
                    "required": ["token_address"]
                },
                "function": social_tools.analyze_sentiment_shift,
                "category": "social_sentiment",
                "rate_limit": 15
            },
            {
                "name": "correlate_social_onchain",
                "description": "Correlate social sentiment with onchain activity",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "token_address": {
                            "type": "string",
                            "description": "Token contract address"
                        },
                        "hours": {
                            "type": "integer",
                            "description": "Hours to analyze (default: 24)",
                            "default": 24
                        }
                    },
                    "required": ["token_address"]
                },
                "function": social_tools.correlate_social_onchain,
                "category": "social_sentiment",
                "rate_limit": 15
            },
            {
                "name": "get_social_narrative",
                "description": "Generate social narrative explaining current sentiment patterns",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "token_address": {
                            "type": "string",
                            "description": "Token contract address"
                        }
                    },
                    "required": ["token_address"]
                },
                "function": social_tools.get_social_narrative,
                "category": "social_sentiment",
                "rate_limit": 20
            },
            {
                "name": "get_trending_social_topics",
                "description": "Get trending social topics across platforms",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "platform": {
                            "type": "string",
                            "description": "Platform to analyze (reddit, farcaster, news, all)",
                            "default": "all"
                        }
                    },
                    "required": []
                },
                "function": social_tools.get_trending_social_topics,
                "category": "social_sentiment",
                "rate_limit": 5
            }
        ]
        
        # Register each tool
        success_count = 0
        for tool_config in tools_to_register:
            try:
                tool_definition = ToolDefinition(
                    name=tool_config["name"],
                    description=tool_config["description"],
                    parameters=tool_config["parameters"],
                    function=tool_config["function"],
                    category=tool_config["category"],
                    rate_limit=tool_config["rate_limit"]
                )
                
                if tool_registry.register_tool(tool_definition):
                    success_count += 1
                    logger.info(f"Registered social sentiment tool: {tool_config['name']}")
                else:
                    logger.error(f"Failed to register tool: {tool_config['name']}")
                    
            except Exception as e:
                logger.error(f"Error registering tool {tool_config['name']}: {e}")
        
        logger.info(f"Successfully registered {success_count}/{len(tools_to_register)} social sentiment tools")
        return success_count == len(tools_to_register)
        
    except Exception as e:
        logger.error(f"Error registering social sentiment tools: {e}")
        return False
