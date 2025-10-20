"""
CoinGecko Service - Fetch Base network token data from CoinGecko API
Free tier: 50 calls/minute, no API key required
Reference: https://docs.coingecko.com/
"""

import asyncio
from typing import Dict, List, Optional, Any
import logging
import httpx
from datetime import datetime

logger = logging.getLogger(__name__)


class CoinGeckoService:
    """Service for fetching Base network tokens from CoinGecko API"""
    
    def __init__(self):
        self.base_url = "https://api.coingecko.com/api/v3"
        self.base_token_cache = None
        self.base_token_cache_timestamp = 0
        self.category_cache = {}
        
        # Rate limiting: 2.5s between calls = 24 calls/min (safely under 50/min)
        self.rate_limit_delay = 2.5
        
        # Cache TTLs
        self.base_token_list_ttl = 86400  # 24 hours for coin list
        self.market_data_ttl = 300  # 5 minutes for market data
        self.trending_ttl = 300  # 5 minutes for trending
        self.new_listings_ttl = 600  # 10 minutes for new listings
        
    async def get_base_token_list(self) -> List[Dict[str, Any]]:
        """
        Fetch all tokens with Base network addresses from CoinGecko
        Cache for 24 hours since coin list doesn't change frequently
        
        Returns:
            List of Base tokens with {id, symbol, name, base_address}
        """
        try:
            # Check 24-hour cache
            current_time = datetime.now().timestamp()
            if self.base_token_cache and (current_time - self.base_token_cache_timestamp) < self.base_token_list_ttl:
                logger.info(f"Using cached Base token list ({len(self.base_token_cache)} tokens)")
                return self.base_token_cache
            
            logger.info("Fetching complete coin list with platform addresses from CoinGecko...")
            
            # Call /coins/list?include_platform=true
            async with httpx.AsyncClient() as client:
                url = f"{self.base_url}/coins/list"
                params = {"include_platform": "true"}
                
                # Retry logic with exponential backoff
                response = await self._make_request_with_retry(client, url, params)
                
                if not response:
                    logger.error("Failed to fetch coin list after retries")
                    return []
                
                coin_list = response.json()
                logger.info(f"Retrieved {len(coin_list)} total coins from CoinGecko")
                
                # Filter for tokens with Base platform address
                base_tokens = []
                for coin in coin_list:
                    platforms = coin.get("platforms", {})
                    base_address = platforms.get("base", "")
                    
                    if base_address:
                        base_tokens.append({
                            "id": coin.get("id"),
                            "symbol": coin.get("symbol", "").upper(),
                            "name": coin.get("name", ""),
                            "base_address": base_address
                        })
                
                logger.info(f"Found {len(base_tokens)} tokens on Base network")
                
                # Cache the results
                self.base_token_cache = base_tokens
                self.base_token_cache_timestamp = current_time
                
                return base_tokens
                
        except Exception as e:
            logger.error(f"Error fetching Base token list: {e}")
            import traceback
            logger.error(traceback.format_exc())
            return []
    
    async def get_top_15_by_market_cap(self) -> List[Dict[str, Any]]:
        """
        Get top 15 Base tokens by market cap
        Uses /coins/markets with Base token IDs, order=market_cap_desc
        Cache for 5 minutes
        """
        try:
            # Check cache
            cache_key = "top_15_market_cap"
            cached_data = self._get_from_cache(cache_key, self.market_data_ttl)
            if cached_data:
                return cached_data
            
            # Get Base token list
            base_tokens = await self.get_base_token_list()
            if not base_tokens:
                logger.warning("No Base tokens available")
                return []
            
            # Get top tokens by market cap
            logger.info("Fetching top 15 Base tokens by market cap...")
            token_ids = [token["id"] for token in base_tokens[:100]]  # Limit to first 100 Base tokens
            
            async with httpx.AsyncClient() as client:
                await asyncio.sleep(self.rate_limit_delay)  # Rate limiting
                
                url = f"{self.base_url}/coins/markets"
                params = {
                    "vs_currency": "usd",
                    "ids": ",".join(token_ids),
                    "order": "market_cap_desc",
                    "per_page": 15,
                    "page": 1,
                    "sparkline": "false",
                    "price_change_percentage": "24h"
                }
                
                response = await self._make_request_with_retry(client, url, params)
                if not response:
                    return []
                
                market_data = response.json()
                enriched_tokens = self._enrich_token_data(market_data, base_tokens)
                
                # Cache the results
                self._set_cache(cache_key, enriched_tokens)
                
                logger.info(f"Successfully fetched {len(enriched_tokens)} top Base tokens by market cap")
                return enriched_tokens
                
        except Exception as e:
            logger.error(f"Error fetching top 15 by market cap: {e}")
            import traceback
            logger.error(traceback.format_exc())
            return []
    
    async def get_trending_tokens(self) -> List[Dict[str, Any]]:
        """
        Get trending Base tokens
        Uses /search/trending, then filters for Base network tokens
        Cache for 5 minutes
        """
        try:
            # Check cache
            cache_key = "trending_tokens"
            cached_data = self._get_from_cache(cache_key, self.trending_ttl)
            if cached_data:
                return cached_data
            
            # Get Base token list for filtering
            base_tokens = await self.get_base_token_list()
            if not base_tokens:
                logger.warning("No Base tokens available")
                return []
            
            base_token_ids = {token["id"] for token in base_tokens}
            
            logger.info("Fetching trending tokens from CoinGecko...")
            
            async with httpx.AsyncClient() as client:
                await asyncio.sleep(self.rate_limit_delay)  # Rate limiting
                
                url = f"{self.base_url}/search/trending"
                
                response = await self._make_request_with_retry(client, url, {})
                if not response:
                    return []
                
                trending_data = response.json()
                trending_coins = trending_data.get("coins", [])
                
                # Filter for Base network tokens
                base_trending_ids = []
                for coin_item in trending_coins:
                    coin = coin_item.get("item", {})
                    coin_id = coin.get("id")
                    if coin_id in base_token_ids:
                        base_trending_ids.append(coin_id)
                
                logger.info(f"Found {len(base_trending_ids)} trending tokens on Base network")
                
                if not base_trending_ids:
                    logger.warning("No trending Base tokens found, returning top tokens instead")
                    return await self.get_top_15_by_market_cap()
                
                # Fetch market data for trending Base tokens
                await asyncio.sleep(self.rate_limit_delay)  # Rate limiting
                
                market_url = f"{self.base_url}/coins/markets"
                market_params = {
                    "vs_currency": "usd",
                    "ids": ",".join(base_trending_ids[:15]),
                    "order": "market_cap_desc",
                    "per_page": 15,
                    "page": 1,
                    "sparkline": "false",
                    "price_change_percentage": "24h"
                }
                
                market_response = await self._make_request_with_retry(client, market_url, market_params)
                if not market_response:
                    return []
                
                market_data = market_response.json()
                enriched_tokens = self._enrich_token_data(market_data, base_tokens)
                
                # Cache the results
                self._set_cache(cache_key, enriched_tokens)
                
                logger.info(f"Successfully fetched {len(enriched_tokens)} trending Base tokens")
                return enriched_tokens
                
        except Exception as e:
            logger.error(f"Error fetching trending tokens: {e}")
            import traceback
            logger.error(traceback.format_exc())
            return []
    
    async def get_high_volume_tokens(self) -> List[Dict[str, Any]]:
        """
        Get high volume Base tokens
        Uses /coins/markets with Base token IDs, order=volume_desc
        Cache for 5 minutes
        """
        try:
            # Check cache
            cache_key = "high_volume_tokens"
            cached_data = self._get_from_cache(cache_key, self.market_data_ttl)
            if cached_data:
                return cached_data
            
            # Get Base token list
            base_tokens = await self.get_base_token_list()
            if not base_tokens:
                logger.warning("No Base tokens available")
                return []
            
            logger.info("Fetching high volume Base tokens...")
            token_ids = [token["id"] for token in base_tokens[:100]]
            
            async with httpx.AsyncClient() as client:
                await asyncio.sleep(self.rate_limit_delay)  # Rate limiting
                
                url = f"{self.base_url}/coins/markets"
                params = {
                    "vs_currency": "usd",
                    "ids": ",".join(token_ids),
                    "order": "volume_desc",
                    "per_page": 15,
                    "page": 1,
                    "sparkline": "false",
                    "price_change_percentage": "24h"
                }
                
                response = await self._make_request_with_retry(client, url, params)
                if not response:
                    return []
                
                market_data = response.json()
                enriched_tokens = self._enrich_token_data(market_data, base_tokens)
                
                # Cache the results
                self._set_cache(cache_key, enriched_tokens)
                
                logger.info(f"Successfully fetched {len(enriched_tokens)} high volume Base tokens")
                return enriched_tokens
                
        except Exception as e:
            logger.error(f"Error fetching high volume tokens: {e}")
            import traceback
            logger.error(traceback.format_exc())
            return []
    
    async def get_new_listings(self) -> List[Dict[str, Any]]:
        """
        Get new Base token listings
        Uses /coins/markets with Base token IDs, order=market_cap_desc
        Filters by ath_date (recent all-time-high indicates new listing)
        Cache for 10 minutes
        """
        try:
            # Check cache
            cache_key = "new_listings"
            cached_data = self._get_from_cache(cache_key, self.new_listings_ttl)
            if cached_data:
                return cached_data
            
            # Get Base token list
            base_tokens = await self.get_base_token_list()
            if not base_tokens:
                logger.warning("No Base tokens available")
                return []
            
            logger.info("Fetching new Base token listings...")
            token_ids = [token["id"] for token in base_tokens[:100]]
            
            async with httpx.AsyncClient() as client:
                await asyncio.sleep(self.rate_limit_delay)  # Rate limiting
                
                url = f"{self.base_url}/coins/markets"
                params = {
                    "vs_currency": "usd",
                    "ids": ",".join(token_ids),
                    "order": "market_cap_desc",
                    "per_page": 50,  # Fetch more to filter for new ones
                    "page": 1,
                    "sparkline": "false",
                    "price_change_percentage": "24h"
                }
                
                response = await self._make_request_with_retry(client, url, params)
                if not response:
                    return []
                
                market_data = response.json()
                
                # Filter for tokens with recent ATH date (within last 90 days = new)
                current_time = datetime.now()
                new_tokens = []
                
                for token in market_data:
                    ath_date_str = token.get("ath_date", "")
                    if ath_date_str:
                        try:
                            ath_date = datetime.fromisoformat(ath_date_str.replace("Z", "+00:00"))
                            days_since_ath = (current_time - ath_date).days
                            
                            # Consider tokens with ATH in last 90 days as "new"
                            if days_since_ath <= 90:
                                new_tokens.append(token)
                        except Exception:
                            pass
                
                # If we don't have enough new tokens, just use the most recent ones
                if len(new_tokens) < 15:
                    new_tokens = market_data[:15]
                else:
                    new_tokens = new_tokens[:15]
                
                enriched_tokens = self._enrich_token_data(new_tokens, base_tokens)
                
                # Cache the results
                self._set_cache(cache_key, enriched_tokens)
                
                logger.info(f"Successfully fetched {len(enriched_tokens)} new Base token listings")
                return enriched_tokens
                
        except Exception as e:
            logger.error(f"Error fetching new listings: {e}")
            import traceback
            logger.error(traceback.format_exc())
            return []
    
    def _enrich_token_data(self, market_data: List[Dict], base_tokens: List[Dict]) -> List[Dict[str, Any]]:
        """
        Enrich market data with Base addresses
        """
        # Create lookup map for Base addresses
        base_address_map = {token["id"]: token["base_address"] for token in base_tokens}
        
        enriched_tokens = []
        for token in market_data:
            coin_id = token.get("id")
            base_address = base_address_map.get(coin_id, "")
            
            if not base_address:
                continue
            
            enriched_token = {
                "address": base_address,
                "name": token.get("name", "Unknown"),
                "symbol": token.get("symbol", "").upper(),
                "decimals": 18,  # Default, can be fetched separately if needed
                "price": token.get("current_price", 0) or 0,
                "priceFormatted": self._format_currency(token.get("current_price", 0) or 0),
                "priceChange24h": token.get("price_change_percentage_24h", 0) or 0,
                "volume24h": token.get("total_volume", 0) or 0,
                "volumeFormatted": self._format_currency(token.get("total_volume", 0) or 0),
                "marketCap": token.get("market_cap", 0) or 0,
                "marketCapFormatted": self._format_currency(token.get("market_cap", 0) or 0),
                "liquidity": 0,  # Not provided by CoinGecko markets API
                "liquidityFormatted": "0.00",
                "holders": 1000,  # Estimate
                "holdersFormatted": "1,000",
                "safetyScore": self._calculate_safety_score(token),
                "dex": "Base",
                "chain": "base",
                "coingecko_id": coin_id,
                "image": token.get("image", "")
            }
            
            enriched_tokens.append(enriched_token)
        
        return enriched_tokens
    
    def _format_currency(self, value: float) -> str:
        """Format currency value with K/M/B suffixes"""
        if value == 0 or value < 0:
            return "0.00"
        elif value < 0.000001:
            return f"{value:.10f}".rstrip('0').rstrip('.')
        elif value < 0.01:
            return f"{value:.6f}".rstrip('0').rstrip('.')
        elif value < 1:
            return f"{value:.4f}".rstrip('0').rstrip('.')
        elif value < 1000:
            return f"{value:.2f}"
        elif value < 1000000:
            return f"{value/1000:.2f}K"
        elif value < 1000000000:
            return f"{value/1000000:.2f}M"
        else:
            return f"{value/1000000000:.2f}B"
    
    def _calculate_safety_score(self, token: Dict) -> int:
        """Calculate basic safety score based on market metrics"""
        score = 50
        
        market_cap = token.get("market_cap", 0) or 0
        volume = token.get("total_volume", 0) or 0
        
        if market_cap > 10000000:
            score += 20
        elif market_cap > 1000000:
            score += 10
        
        if volume > 1000000:
            score += 15
        elif volume > 100000:
            score += 10
        
        score += 15  # Base for being on CoinGecko
        
        return min(score, 100)
    
    async def _make_request_with_retry(self, client: httpx.AsyncClient, url: str, params: Dict) -> Optional[httpx.Response]:
        """
        Make HTTP request with exponential backoff retry logic
        """
        max_retries = 3
        retry_delay = 60  # Start with 60 seconds
        
        for attempt in range(max_retries):
            try:
                response = await client.get(url, params=params, timeout=30.0)
                
                if response.status_code == 200:
                    return response
                elif response.status_code == 429:
                    if attempt < max_retries - 1:
                        logger.warning(f"Rate limited (429), waiting {retry_delay}s before retry {attempt + 1}/{max_retries}")
                        await asyncio.sleep(retry_delay)
                        retry_delay *= 2  # Exponential backoff
                    else:
                        logger.error("Rate limited after all retries")
                        return None
                else:
                    logger.error(f"CoinGecko API error: {response.status_code} - {response.text[:200]}")
                    return None
                    
            except Exception as e:
                logger.error(f"Request error on attempt {attempt + 1}: {e}")
                if attempt < max_retries - 1:
                    await asyncio.sleep(retry_delay)
                    retry_delay *= 2
                else:
                    return None
        
        return None
    
    def _get_from_cache(self, key: str, ttl: int) -> Optional[List[Dict[str, Any]]]:
        """Get data from cache if not expired"""
        if key in self.category_cache:
            cached_data, timestamp = self.category_cache[key]
            if (datetime.now().timestamp() - timestamp) < ttl:
                logger.info(f"Using cached data for {key}")
                return cached_data
        return None
    
    def _set_cache(self, key: str, data: List[Dict[str, Any]]):
        """Set data in cache with current timestamp"""
        self.category_cache[key] = (data, datetime.now().timestamp())
    
    async def get_token_ohlc(self, token_id: str, days: int = 1) -> List[Dict[str, Any]]:
        """
        Get OHLC (Open, High, Low, Close) data for a token
        
        Args:
            token_id: CoinGecko token ID
            days: Number of days (1, 7, 14, 30, 90, 180, 365, max)
            
        Returns:
            List of OHLC data points
        """
        try:
            # Check cache
            cache_key = f"ohlc_{token_id}_{days}"
            cached_data = self._get_from_cache(cache_key, 300)  # 5 minutes cache
            if cached_data:
                return cached_data
            
            logger.info(f"Fetching OHLC data for {token_id} ({days} days)")
            
            async with httpx.AsyncClient() as client:
                await asyncio.sleep(self.rate_limit_delay)  # Rate limiting
                
                url = f"{self.base_url}/coins/{token_id}/ohlc"
                params = {
                    "vs_currency": "usd",
                    "days": days
                }
                
                response = await self._make_request_with_retry(client, url, params)
                if not response:
                    return []
                
                ohlc_data = response.json()
                
                # Convert to our format
                formatted_data = []
                for point in ohlc_data:
                    formatted_data.append({
                        "time": point[0] / 1000,  # Convert from milliseconds to seconds
                        "open": point[1],
                        "high": point[2],
                        "low": point[3],
                        "close": point[4]
                    })
                
                # Cache the results
                self._set_cache(cache_key, formatted_data)
                
                logger.info(f"Successfully fetched {len(formatted_data)} OHLC data points for {token_id}")
                return formatted_data
                
        except Exception as e:
            logger.error(f"Error fetching OHLC data for {token_id}: {e}")
            import traceback
            logger.error(traceback.format_exc())
            return []
    
    async def get_token_details_enhanced(self, token_id: str) -> Dict[str, Any]:
        """
        Get enhanced token details including full information
        
        Args:
            token_id: CoinGecko token ID
            
        Returns:
            Enhanced token details
        """
        try:
            # Check cache
            cache_key = f"token_details_{token_id}"
            cached_data = self._get_from_cache(cache_key, 300)  # 5 minutes cache
            if cached_data:
                return cached_data[0]  # Return first item from cached list
            
            logger.info(f"Fetching enhanced details for {token_id}")
            
            async with httpx.AsyncClient() as client:
                await asyncio.sleep(self.rate_limit_delay)  # Rate limiting
                
                # Get basic coin data
                url = f"{self.base_url}/coins/{token_id}"
                params = {
                    "localization": "false",
                    "tickers": "false",
                    "market_data": "true",
                    "community_data": "true",
                    "developer_data": "true",
                    "sparkline": "false"
                }
                
                response = await self._make_request_with_retry(client, url, params)
                if not response:
                    return {}
                
                coin_data = response.json()
                
                # Extract enhanced details
                enhanced_details = {
                    "id": coin_data.get("id"),
                    "symbol": coin_data.get("symbol", "").upper(),
                    "name": coin_data.get("name", ""),
                    "description": coin_data.get("description", {}).get("en", ""),
                    "image": coin_data.get("image", {}).get("large", ""),
                    "market_cap_rank": coin_data.get("market_cap_rank"),
                    "coingecko_score": coin_data.get("coingecko_score", 0),
                    "liquidity_score": coin_data.get("liquidity_score", 0),
                    "public_interest_score": coin_data.get("public_interest_score", 0),
                    "market_data": coin_data.get("market_data", {}),
                    "links": coin_data.get("links", {}),
                    "categories": coin_data.get("categories", []),
                    "sentiment_votes_up_percentage": coin_data.get("sentiment_votes_up_percentage"),
                    "sentiment_votes_down_percentage": coin_data.get("sentiment_votes_down_percentage"),
                    "watchlist_portfolio_users": coin_data.get("watchlist_portfolio_users"),
                    "market_cap": coin_data.get("market_data", {}).get("market_cap", {}).get("usd", 0),
                    "total_volume": coin_data.get("market_data", {}).get("total_volume", {}).get("usd", 0),
                    "current_price": coin_data.get("market_data", {}).get("current_price", {}).get("usd", 0),
                    "price_change_24h": coin_data.get("market_data", {}).get("price_change_percentage_24h", 0),
                    "ath": coin_data.get("market_data", {}).get("ath", {}).get("usd", 0),
                    "ath_change_percentage": coin_data.get("market_data", {}).get("ath_change_percentage", {}).get("usd", 0),
                    "atl": coin_data.get("market_data", {}).get("atl", {}).get("usd", 0),
                    "atl_change_percentage": coin_data.get("market_data", {}).get("atl_change_percentage", {}).get("usd", 0),
                    "circulating_supply": coin_data.get("market_data", {}).get("circulating_supply", 0),
                    "total_supply": coin_data.get("market_data", {}).get("total_supply", 0),
                    "max_supply": coin_data.get("market_data", {}).get("max_supply", 0),
                }
                
                # Cache the results
                self._set_cache(cache_key, [enhanced_details])
                
                logger.info(f"Successfully fetched enhanced details for {token_id}")
                return enhanced_details
                
        except Exception as e:
            logger.error(f"Error fetching enhanced details for {token_id}: {e}")
            import traceback
            logger.error(traceback.format_exc())
            return {}