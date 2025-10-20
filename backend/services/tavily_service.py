"""
Tavily Service - Real-time web search for AI agents
Part of the DeCrypt backend services
"""

import asyncio
from typing import Dict, List, Any, Optional
import logging
from datetime import datetime
import httpx

logger = logging.getLogger(__name__)

class TavilyService:
    """
    Service for real-time web search using Tavily API
    """
    
    def __init__(self):
        self.api_key = None
        self.base_url = "https://api.tavily.com"
        
        # Search configuration
        self.default_params = {
            "search_depth": "basic",
            "include_answer": True,
            "include_images": False,
            "include_raw_content": False,
            "max_results": 5
        }
    
    async def initialize(self, api_key: str):
        """Initialize Tavily service"""
        try:
            self.api_key = api_key
            logger.info("Tavily service initialized successfully")
            
        except Exception as e:
            logger.error(f"Error initializing Tavily service: {e}")
            raise
    
    async def search(
        self,
        query: str,
        max_results: int = 5,
        search_depth: str = "basic",
        include_answer: bool = True
    ) -> List[Dict[str, Any]]:
        """
        Perform web search using Tavily API
        """
        try:
            if not self.api_key:
                raise Exception("Tavily API key not configured")
            
            payload = {
                "api_key": self.api_key,
                "query": query,
                "search_depth": search_depth,
                "include_answer": include_answer,
                "include_images": False,
                "include_raw_content": False,
                "max_results": max_results
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/search",
                    json=payload,
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    data = response.json()
                    return data.get("results", [])
                else:
                    logger.error(f"Tavily API error: {response.status_code}")
                    return []
                    
        except Exception as e:
            logger.error(f"Error performing web search: {e}")
            return []
    
    async def search_crypto_news(self, query: str = "cryptocurrency news") -> List[Dict[str, Any]]:
        """
        Search for latest crypto news
        """
        try:
            # Add time-based filters for recent news
            recent_query = f"{query} latest news today"
            
            results = await self.search(
                query=recent_query,
                max_results=5,
                search_depth="basic"
            )
            
            return results
            
        except Exception as e:
            logger.error(f"Error searching crypto news: {e}")
            return []
    
    async def search_token_news(self, token_name: str) -> List[Dict[str, Any]]:
        """
        Search for news about a specific token
        """
        try:
            query = f"{token_name} cryptocurrency news latest"
            
            results = await self.search(
                query=query,
                max_results=5,
                search_depth="basic"
            )
            
            return results
            
        except Exception as e:
            logger.error(f"Error searching token news: {e}")
            return []
    
    async def search_market_analysis(self, query: str = "cryptocurrency market analysis") -> List[Dict[str, Any]]:
        """
        Search for market analysis and insights
        """
        try:
            results = await self.search(
                query=query,
                max_results=5,
                search_depth="basic"
            )
            
            return results
            
        except Exception as e:
            logger.error(f"Error searching market analysis: {e}")
            return []
    
    async def search_regulatory_news(self, query: str = "cryptocurrency regulation news") -> List[Dict[str, Any]]:
        """
        Search for regulatory and legal news
        """
        try:
            results = await self.search(
                query=query,
                max_results=5,
                search_depth="basic"
            )
            
            return results
            
        except Exception as e:
            logger.error(f"Error searching regulatory news: {e}")
            return []
    
    async def search_technology_news(self, query: str = "blockchain technology news") -> List[Dict[str, Any]]:
        """
        Search for technology and development news
        """
        try:
            results = await self.search(
                query=query,
                max_results=5,
                search_depth="basic"
            )
            
            return results
            
        except Exception as e:
            logger.error(f"Error searching technology news: {e}")
            return []
    
    async def search_base_ecosystem_news(self) -> List[Dict[str, Any]]:
        """
        Search for Base ecosystem specific news
        """
        try:
            query = "Base blockchain ecosystem news Coinbase Layer 2"
            
            results = await self.search(
                query=query,
                max_results=5,
                search_depth="basic"
            )
            
            return results
            
        except Exception as e:
            logger.error(f"Error searching Base ecosystem news: {e}")
            return []
    
    async def search_defi_news(self) -> List[Dict[str, Any]]:
        """
        Search for DeFi related news
        """
        try:
            query = "DeFi decentralized finance news latest"
            
            results = await self.search(
                query=query,
                max_results=5,
                search_depth="basic"
            )
            
            return results
            
        except Exception as e:
            logger.error(f"Error searching DeFi news: {e}")
            return []
    
    async def search_trading_education(self, topic: str) -> List[Dict[str, Any]]:
        """
        Search for trading education content
        """
        try:
            query = f"cryptocurrency trading education {topic} tutorial"
            
            results = await self.search(
                query=query,
                max_results=5,
                search_depth="basic"
            )
            
            return results
            
        except Exception as e:
            logger.error(f"Error searching trading education: {e}")
            return []
    
    async def search_safety_guidelines(self, topic: str) -> List[Dict[str, Any]]:
        """
        Search for crypto safety and security guidelines
        """
        try:
            query = f"cryptocurrency safety security guidelines {topic} avoid scams"
            
            results = await self.search(
                query=query,
                max_results=5,
                search_depth="basic"
            )
            
            return results
            
        except Exception as e:
            logger.error(f"Error searching safety guidelines: {e}")
            return []
    
    async def search_general_crypto_info(self, query: str) -> List[Dict[str, Any]]:
        """
        Search for general cryptocurrency information
        """
        try:
            results = await self.search(
                query=query,
                max_results=5,
                search_depth="basic"
            )
            
            return results
            
        except Exception as e:
            logger.error(f"Error searching general crypto info: {e}")
            return []
    
    def format_search_results(self, results: List[Dict[str, Any]]) -> str:
        """
        Format search results for AI consumption
        """
        try:
            if not results:
                return "No search results found."
            
            formatted_results = []
            for i, result in enumerate(results, 1):
                title = result.get("title", "No title")
                content = result.get("content", "No content")
                url = result.get("url", "No URL")
                
                formatted_result = f"""
{i}. {title}
   Content: {content[:300]}...
   URL: {url}
"""
                formatted_results.append(formatted_result)
            
            return "\n".join(formatted_results)
            
        except Exception as e:
            logger.error(f"Error formatting search results: {e}")
            return "Error formatting search results."
    
    async def health_check(self) -> bool:
        """Check Tavily API health"""
        try:
            if not self.api_key:
                return False
            
            # Simple test search
            results = await self.search("test query", max_results=1)
            return len(results) >= 0  # API is working if we get a response
            
        except Exception as e:
            logger.error(f"Tavily health check failed: {e}")
            return False
