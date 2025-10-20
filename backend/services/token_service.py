"""
Token Service - Aggregates real-time token data from Base DEXs
Part of the EAILI5 backend services
"""

import asyncio
from typing import Dict, List, Any, Optional
import logging
from datetime import datetime, timedelta
import httpx
import json
from math import isfinite

logger = logging.getLogger(__name__)

class TokenService:
    """
    Service for aggregating and caching real-time token data from Base DEXs
    """
    
    def __init__(self):
        self.redis_service = None
        self.bitquery_service = None
        self.base_client = None
        self.dex_price_service = None
        
        # Cache settings
        self.cache_ttl = 300  # 5 minutes
        self.trending_cache_ttl = 600  # 10 minutes
        
    
    async def initialize(self, redis_service=None, etherscan_service=None, base_client=None, coingecko_service=None):
        """Initialize the token service with dependencies"""
        try:
            self.redis_service = redis_service
            self.etherscan_service = etherscan_service
            self.base_client = base_client
            self.coingecko_service = coingecko_service
            
            # Fix: Assign redis_client attribute for compatibility
            self.redis_client = redis_service
            
            logger.info("Token service initialized successfully")
            
        except Exception as e:
            logger.error(f"Error initializing token service: {e}")
            raise
    
    async def get_tokens_by_category(self, category: str = "top15", limit: int = 15) -> List[Dict[str, Any]]:
        """
        Get Base tokens by category from CoinGecko
        
        Args:
            category: One of "top15", "trending", "volume", "new"
            limit: Number of tokens to return (default 15)
            
        Returns:
            List of token data dictionaries
        """
        try:
            if not self.coingecko_service:
                logger.error("CoinGecko service not initialized")
                return []
            
            logger.info(f"Fetching {category} Base tokens (limit: {limit})...")
            
            # Route to appropriate CoinGecko service method
            if category == "trending":
                tokens = await self.coingecko_service.get_trending_tokens()
            elif category == "volume":
                tokens = await self.coingecko_service.get_high_volume_tokens()
            elif category == "new":
                tokens = await self.coingecko_service.get_new_listings()
            else:  # default to "top15"
                tokens = await self.coingecko_service.get_top_15_by_market_cap()
            
            return tokens[:limit]
            
        except Exception as e:
            logger.error(f"Error getting tokens by category {category}: {e}")
            return []
    
    async def get_trending_tokens(self, limit: int = 20) -> List[Dict[str, Any]]:
        """
        Legacy method - redirects to get_tokens_by_category
        Get top Base tokens by market cap from CoinGecko
        """
        try:
            return await self.get_tokens_by_category("top15", limit)
        except Exception as e:
            logger.error(f"Error getting trending tokens: {e}")
            return []
    
    async def get_token_details(self, token_address: str) -> Dict[str, Any]:
        """
        Get detailed information about a specific token
        """
        try:
            # Check cache first
            cache_key = f"token_details:{token_address}"
            cached_data = await self._get_from_cache(cache_key)
            
            if cached_data:
                return cached_data
            
            # Fetch token details from multiple sources
            token_data = await self._aggregate_token_details(token_address)
            
            # Cache the results
            await self._set_cache(cache_key, token_data, self.cache_ttl)
            
            return token_data
            
        except Exception as e:
            logger.error(f"Error getting token details: {e}")
            return {}
    
    async def _get_coingecko_id_for_address(self, token_address: str) -> Optional[str]:
        """Map Base token address to CoinGecko ID"""
        try:
            if not self.coingecko_service:
                logger.warning("CoinGecko service not available for ID mapping")
                return None
                
            base_tokens = await self.coingecko_service.get_base_token_list()
            for token in base_tokens:
                if token.get("base_address", "").lower() == token_address.lower():
                    logger.info(f"Found CoinGecko ID {token.get('id')} for address {token_address}")
                    return token.get("id")
            
            logger.warning(f"No CoinGecko ID found for address {token_address}")
            return None
        except Exception as e:
            logger.error(f"Error mapping CoinGecko ID for {token_address}: {e}")
            return None

    async def _aggregate_token_details(self, token_address: str) -> Dict[str, Any]:
        """
        Aggregate token details from multiple sources
        """
        token_data = {
            "address": token_address,
            "name": "Unknown Token",
            "symbol": "UNKNOWN",
            "price": 0.0,
            "priceChange24h": 0.0,
            "volume24h": 0.0,
            "marketCap": 0.0,
            "liquidity": 0.0,
            "holders": 0,
            "safetyScore": 50,
            "lastUpdated": datetime.now().isoformat()
        }
        
        # Add CoinGecko ID mapping
        coingecko_id = await self._get_coingecko_id_for_address(token_address)
        token_data["coingecko_id"] = coingecko_id
        
        return token_data
    
    async def get_token_price(self, token_address: str) -> Optional[float]:
        """
        Get current price for a token
        """
        try:
            # Check cache first
            cache_key = f"token_price:{token_address}"
            cached_price = await self._get_from_cache(cache_key)
            
            if cached_price:
                return float(cached_price)
            
            # Fetch from multiple sources
            price = await self._aggregate_token_price(token_address)
            
            if price:
                # Cache the price
                await self._set_cache(cache_key, str(price), 60)  # 1 minute cache
                return price
            
            return None
            
        except Exception as e:
            logger.error(f"Error getting token price: {e}")
            return None
    
    async def get_token_volume(self, token_address: str, timeframe: str = "24h") -> Optional[float]:
        """
        Get trading volume for a token
        """
        try:
            # Check cache first
            cache_key = f"token_volume:{token_address}:{timeframe}"
            cached_volume = await self._get_from_cache(cache_key)
            
            if cached_volume:
                return float(cached_volume)
            
            # Fetch from multiple sources
            volume = await self._aggregate_token_volume(token_address, timeframe)
            
            if volume:
                # Cache the volume
                await self._set_cache(cache_key, str(volume), 300)  # 5 minute cache
                return volume
            
            return None
            
        except Exception as e:
            logger.error(f"Error getting token volume: {e}")
            return None
    
    async def get_token_liquidity(self, token_address: str) -> Optional[float]:
        """
        Get liquidity information for a token
        """
        try:
            # Check cache first
            cache_key = f"token_liquidity:{token_address}"
            cached_liquidity = await self._get_from_cache(cache_key)
            
            if cached_liquidity:
                return float(cached_liquidity)
            
            # Fetch from multiple sources
            liquidity = await self._aggregate_token_liquidity(token_address)
            
            if liquidity:
                # Cache the liquidity
                await self._set_cache(cache_key, str(liquidity), 300)  # 5 minute cache
                return liquidity
            
            return None
            
        except Exception as e:
            logger.error(f"Error getting token liquidity: {e}")
            return None
    
    
    async def _get_from_cache(self, key: str) -> Any:
        """Get data from Redis cache"""
        try:
            if self.redis_client:
                data = await self.redis_client.get(key)
                if data:
                    return json.loads(data)
            return None
        except Exception as e:
            logger.error(f"Error getting from cache: {e}")
            return None
    
    async def _set_cache(self, key: str, data: Any, ttl: int):
        """Set data in Redis cache"""
        try:
            if self.redis_client:
                await self.redis_client.setex(key, ttl, json.dumps(data))
        except Exception as e:
            logger.error(f"Error setting cache: {e}")
    
    async def check_redis_connection(self) -> bool:
        """Check if Redis connection is working"""
        try:
            if self.redis_client:
                await self.redis_client.ping()
                return True
            return False
        except Exception as e:
            logger.error(f"Redis connection check failed: {e}")
            return False
    
    async def _enrich_token_data(self, tokens: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Enrich token data with additional metrics from Bitquery
        """
        enriched_tokens = []
        
        for token in tokens:
            try:
                address = token.get("address", "")
                if not address:
                    continue
                
                logger.info(f"Processing token: {token.get('symbol', '?')} at {address}")
                
                # Fetch additional data from Etherscan V2 if available
                if self.etherscan_service:
                    # Get holder count
                    holders = await self.etherscan_service.get_token_holders(address)
                    if holders:
                        token["holders"] = holders
                    
                    # Get token supply
                    supply_data = await self.etherscan_service.get_token_supply(address)
                    if supply_data:
                        token["total_supply"] = supply_data.get("total_supply", 0)
                        token["circulating_supply"] = supply_data.get("circulating_supply", 0)
                
                # Get real price from CoinGecko
                calculated_price = 0
                if self.coingecko_service:
                    try:
                        logger.info(f"Fetching CoinGecko price for {token.get('symbol')} ({address})...")
                        price = await self.coingecko_service.get_token_price_usd(address)
                        if price and price > 0:
                            calculated_price = price
                            logger.info(f"Got CoinGecko price for {token.get('symbol', address)}: ${calculated_price:.8f}")
                        else:
                            logger.warning(f"No CoinGecko price available for {token.get('symbol')} ({address})")
                    except Exception as e:
                        logger.warning(f"Could not fetch CoinGecko price for {address}: {e}")
                
                # Calculate safety score based on available data
                safety_score = await self._calculate_safety_score(token)
                token["safetyScore"] = safety_score
                
                # Format for frontend with proper number formatting
                decimals = token.get("decimals", 18)
                
                # Format large numbers properly (world-class standards)
                def format_currency(value):
                    if value == 0 or value < 0:
                        return "0.00"
                    elif value < 0.000001:  # Very small numbers - show more precision
                        return f"{value:.10f}".rstrip('0').rstrip('.')
                    elif value < 0.01:  # Small numbers - show 6 decimal places
                        return f"{value:.6f}".rstrip('0').rstrip('.')
                    elif value < 1:  # Decimal prices - show 4 decimal places
                        return f"{value:.4f}".rstrip('0').rstrip('.')
                    elif value < 1000:  # Standard prices - show 2 decimal places
                        return f"{value:.2f}"
                    elif value < 1000000:  # Thousands
                        return f"{value/1000:.2f}K"
                    elif value < 1000000000:  # Millions
                        return f"{value/1000000:.2f}M"
                    else:  # Billions
                        return f"{value/1000000000:.2f}B"
                
                # Calculate market cap: price * circulating supply
                market_cap = 0
                if calculated_price > 0:
                    total_supply = token.get("total_supply", 0)
                    circulating_supply = token.get("circulating_supply", total_supply)
                    if circulating_supply > 0:
                        # Normalize supply by decimals
                        supply_normalized = circulating_supply / (10 ** decimals)
                        market_cap = calculated_price * supply_normalized
                        logger.debug(f"Calculated market cap for {token.get('symbol')}: ${market_cap:.2f}")
                
                # Get numeric values and ensure they're valid
                volume = token.get("volume24h", 0)
                if isinstance(volume, float) and (volume > 1e15 or not isfinite(volume)):
                    volume = 0  # Reset invalid volumes
                
                liquidity = token.get("liquidity", 0)
                if isinstance(liquidity, float) and (liquidity > 1e15 or not isfinite(liquidity)):
                    liquidity = 0
                
                enriched_token = {
                    "address": token.get("address", ""),
                    "name": token.get("name", "Unknown"),
                    "symbol": token.get("symbol", "???"),
                    "decimals": token.get("decimals", 18),
                    "price": calculated_price,
                    "priceFormatted": format_currency(calculated_price),
                    "priceChange24h": token.get("priceChange24h", 0),
                    "volume24h": volume,
                    "volumeFormatted": format_currency(volume),
                    "marketCap": market_cap,
                    "marketCapFormatted": format_currency(market_cap),
                    "liquidity": liquidity,
                    "liquidityFormatted": format_currency(liquidity),
                    "holders": token.get("holders", 0),
                    "holdersFormatted": f"{token.get('holders', 0):,}",
                    "safetyScore": safety_score,
                    "dex": "Base",
                    "chain": "base"
                }
                
                enriched_tokens.append(enriched_token)
                
            except Exception as e:
                logger.error(f"Error enriching token {token.get('address', 'unknown')}: {e}")
                continue
        
        return enriched_tokens
    
    async def _calculate_safety_score(self, token: Dict[str, Any]) -> int:
        """
        Calculate safety score for a token based on various metrics
        """
        score = 50  # Base score
        
        # Liquidity score (0-20 points)
        liquidity = token.get("liquidity", 0)
        if liquidity > 1000000:  # > $1M
            score += 20
        elif liquidity > 100000:  # > $100K
            score += 15
        elif liquidity > 10000:  # > $10K
            score += 10
        elif liquidity > 1000:  # > $1K
            score += 5
        
        # Holder count score (0-15 points)
        holders = token.get("holders", 0)
        if holders > 10000:
            score += 15
        elif holders > 1000:
            score += 10
        elif holders > 100:
            score += 5
        
        # Volume score (0-15 points)
        volume = token.get("volume24h", token.get("trade_amount", 0))
        if volume > 1000000:  # > $1M daily volume
            score += 15
        elif volume > 100000:  # > $100K
            score += 10
        elif volume > 10000:  # > $10K
            score += 5
        
        return min(score, 100)  # Cap at 100
    
