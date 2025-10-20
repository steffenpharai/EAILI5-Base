"""
Bitquery Service - Real-time Base DEX data aggregation
Part of the DeCrypt backend services
"""

import asyncio
from typing import Dict, List, Any, Optional
import logging
from datetime import datetime, timedelta
import httpx
import json

logger = logging.getLogger(__name__)

class BitqueryService:
    """
    Service for fetching real-time data from Base DEXs using Bitquery API
    """
    
    def __init__(self):
        self.api_key = None
        self.base_url = "https://graphql.bitquery.io"
        self.base_chain_id = "base"
        
        # Base DEX addresses
        self.dex_addresses = {
            "uniswap_v3": "0x03a520b32C04BF3bEEf7BF5e44D0B8e4C3e6B5e4",
            "aerodrome": "0x4200000000000000000000000000000000000006",
            "baseswap": "0x327Df1E6de05895d2ab08513aaDD9313Fe505d86"
        }
    
    async def initialize(self, api_key: str):
        """Initialize the Bitquery service"""
        self.api_key = api_key
        if api_key:
            logger.info(f"Bitquery service initialized with API key (length: {len(api_key)})")
        else:
            logger.error("Bitquery service initialized WITHOUT API key!")
        logger.info(f"Bitquery URL: {self.base_url}")
    
    async def get_trending_tokens(self, limit: int = 20) -> List[Dict[str, Any]]:
        """
        Get trending tokens from Base DEXs
        """
        try:
            # Query for Base DEX trades from past 3 months (more comprehensive but still efficient)
            query = """
            query {
                ethereum(network: ethereum) {
                    dexTrades(
                        options: {limit: 20, desc: "tradeAmount"}
                        date: {since: "2024-07-19"}
                    ) {
                        tradeAmount(in: USD)
                        count
                        buyCurrency {
                            symbol
                            name
                            address
                        }
                    }
                }
            }
            """
            
            variables = {"limit": limit}
            
            async with httpx.AsyncClient() as client:
                # Use Authorization Bearer as per Bitquery docs
                headers = {
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {self.api_key}"
                }
                
                logger.info(f"Calling Bitquery API at {self.base_url}")
                logger.info(f"API Key present: {bool(self.api_key)}")
                logger.info(f"API Key length: {len(self.api_key) if self.api_key else 0}")
                logger.info(f"API Key starts with: {self.api_key[:10] if self.api_key else 'None'}...")
                logger.debug(f"Query: {query[:200]}...")
                logger.debug(f"Headers: {headers}")
                
                response = await client.post(
                    self.base_url,
                    headers=headers,
                    json={"query": query, "variables": variables},
                    timeout=60.0  # Increased timeout for complex queries
                )
                
                logger.info(f"Bitquery response status: {response.status_code}")
                
                if response.status_code == 200:
                    data = response.json()
                    logger.info(f"Bitquery response data keys: {list(data.keys()) if data else 'None'}")
                    
                    # Check for errors in the response
                    if "errors" in data:
                        logger.error(f"Bitquery GraphQL errors: {data['errors']}")
                        return []
                    
                    return self._format_trending_tokens(data.get("data", {}).get("ethereum", {}).get("dexTrades", []))
                else:
                    logger.error(f"Bitquery API error: {response.status_code} - {response.text[:500]}")
                    return []
                    
        except Exception as e:
            logger.error(f"Error fetching trending tokens: {e}")
            logger.error(f"Exception type: {type(e)}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            return []
    
    async def get_token_details(self, token_address: str) -> Dict[str, Any]:
        """
        Get detailed information about a specific token
        """
        try:
            query = """
            query GetTokenDetails($tokenAddress: String!) {
                ethereum(network: ethereum) {
                    address(address: {is: $tokenAddress}) {
                        address
                        annotation
                        smartContract {
                            contractType
                            protocolType
                        }
                    }
                    transfers(
                        currency: {is: $tokenAddress}
                        options: {limit: 1, desc: "block.timestamp.time"}
                    ) {
                        currency {
                            address
                            symbol
                            name
                            decimals
                        }
                        amount
                        block {
                            timestamp {
                                time
                            }
                        }
                    }
                }
            }
            """
            
            variables = {"tokenAddress": token_address}
            
            async with httpx.AsyncClient() as client:
                headers = {
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {self.api_key}"
                }
                response = await client.post(
                    self.base_url,
                    headers=headers,
                    json={"query": query, "variables": variables},
                    timeout=60.0  # Increased timeout for complex queries
                )
                
                if response.status_code == 200:
                    data = response.json()
                    return self._format_token_details(data.get("data", {}))
                else:
                    logger.error(f"Bitquery API error: {response.status_code}")
                    return {}
                    
        except Exception as e:
            logger.error(f"Error fetching token details: {e}")
            return {}
    
    async def get_token_price(self, token_address: str) -> Optional[float]:
        """
        Get current price for a token
        """
        try:
            query = """
            query GetTokenPrice($tokenAddress: String!) {
                ethereum(network: ethereum) {
                    dexTrades(
                        currency: {is: $tokenAddress}
                        options: {limit: 1, desc: "block.timestamp.time"}
                    ) {
                        tradeAmount(in: USD)
                        amount
                        currency {
                            address
                            symbol
                        }
                    }
                }
            }
            """
            
            variables = {"tokenAddress": token_address}
            
            async with httpx.AsyncClient() as client:
                headers = {
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {self.api_key}"
                }
                response = await client.post(
                    self.base_url,
                    headers=headers,
                    json={"query": query, "variables": variables},
                    timeout=60.0  # Increased timeout for complex queries
                )
                
                if response.status_code == 200:
                    data = response.json()
                    trades = data.get("data", {}).get("ethereum", {}).get("dexTrades", [])
                    if trades:
                        trade = trades[0]
                        trade_amount = trade.get("tradeAmount", 0)
                        amount = trade.get("amount", 0)
                        if amount > 0:
                            return trade_amount / amount
                return None
                
        except Exception as e:
            logger.error(f"Error fetching token price: {e}")
            return None
    
    async def get_token_volume(self, token_address: str, timeframe: str = "24h") -> Optional[float]:
        """
        Get trading volume for a token
        """
        try:
            # Calculate time range based on timeframe
            if timeframe == "24h":
                since = datetime.now() - timedelta(days=1)
            elif timeframe == "7d":
                since = datetime.now() - timedelta(days=7)
            elif timeframe == "30d":
                since = datetime.now() - timedelta(days=30)
            else:
                since = datetime.now() - timedelta(days=1)
            
            query = """
            query GetTokenVolume($tokenAddress: String!, $since: ISO8601DateTime!) {
                ethereum(network: ethereum) {
                    dexTrades(
                        currency: {is: $tokenAddress}
                        date: {since: $since}
                    ) {
                        tradeAmount(in: USD)
                    }
                }
            }
            """
            
            variables = {
                "tokenAddress": token_address,
                "since": since.isoformat()
            }
            
            async with httpx.AsyncClient() as client:
                headers = {
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {self.api_key}"
                }
                response = await client.post(
                    self.base_url,
                    headers=headers,
                    json={"query": query, "variables": variables},
                    timeout=60.0  # Increased timeout for complex queries
                )
                
                if response.status_code == 200:
                    data = response.json()
                    trades = data.get("data", {}).get("ethereum", {}).get("dexTrades", [])
                    total_volume = sum(trade.get("tradeAmount", 0) for trade in trades)
                    return total_volume
                return None
                
        except Exception as e:
            logger.error(f"Error fetching token volume: {e}")
            return None
    
    async def get_token_liquidity(self, token_address: str) -> Optional[float]:
        """
        Get liquidity information for a token
        """
        try:
            query = """
            query GetTokenLiquidity($tokenAddress: String!) {
                ethereum(network: ethereum) {
                    dexTrades(
                        currency: {is: $tokenAddress}
                        options: {limit: 100, desc: "block.timestamp.time"}
                    ) {
                        tradeAmount(in: USD)
                        smartContract {
                            address
                        }
                    }
                }
            }
            """
            
            variables = {"tokenAddress": token_address}
            
            async with httpx.AsyncClient() as client:
                headers = {
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {self.api_key}"
                }
                response = await client.post(
                    self.base_url,
                    headers=headers,
                    json={"query": query, "variables": variables},
                    timeout=60.0  # Increased timeout for complex queries
                )
                
                if response.status_code == 200:
                    data = response.json()
                    trades = data.get("data", {}).get("ethereum", {}).get("dexTrades", [])
                    
                    # Calculate liquidity as average trade size
                    if trades:
                        total_volume = sum(trade.get("tradeAmount", 0) for trade in trades)
                        return total_volume / len(trades)
                return None
                
        except Exception as e:
            logger.error(f"Error fetching token liquidity: {e}")
            return None
    
    async def get_token_holders(self, token_address: str) -> Optional[int]:
        """
        Get number of unique holders for a token
        """
        try:
            query = """
            query GetTokenHolders($tokenAddress: String!) {
                ethereum(network: ethereum) {
                    transfers(
                        currency: {is: $tokenAddress}
                        options: {limit: 1000}
                    ) {
                        receiver {
                            address
                        }
                    }
                }
            }
            """
            
            variables = {"tokenAddress": token_address}
            
            async with httpx.AsyncClient() as client:
                headers = {
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {self.api_key}"
                }
                response = await client.post(
                    self.base_url,
                    headers=headers,
                    json={"query": query, "variables": variables},
                    timeout=60.0  # Increased timeout for complex queries
                )
                
                if response.status_code == 200:
                    data = response.json()
                    transfers = data.get("data", {}).get("ethereum", {}).get("transfers", [])
                    
                    # Count unique receivers
                    unique_holders = set()
                    for transfer in transfers:
                        receiver = transfer.get("receiver", {}).get("address")
                        if receiver:
                            unique_holders.add(receiver)
                    
                    return len(unique_holders)
                return None
                
        except Exception as e:
            logger.error(f"Error fetching token holders: {e}")
            return None
    
    def _format_trending_tokens(self, trades: List[Dict]) -> List[Dict[str, Any]]:
        """Format trending tokens data"""
        formatted_tokens = []
        
        for trade in trades:
            try:
                # Extract buy currency information (most relevant for trending)
                buy_currency = trade.get("buyCurrency", {})
                if not buy_currency.get("address"):
                    continue
                    
                formatted_token = {
                    "address": buy_currency.get("address", ""),
                    "name": buy_currency.get("name", "Unknown"),
                    "symbol": buy_currency.get("symbol", "???"),
                    "decimals": 18,  # Default for most tokens
                    "trade_amount": trade.get("tradeAmount", 0),
                    "trade_count": trade.get("count", 0),
                    "dex": "Base DEX",  # Simplified since we removed smartContract
                    "source": "bitquery",
                    "last_updated": datetime.now().isoformat()
                }
                formatted_tokens.append(formatted_token)
                
            except Exception as e:
                logger.error(f"Error formatting trade data: {e}")
                continue
        
        return formatted_tokens
    
    def _format_token_details(self, data: Dict) -> Dict[str, Any]:
        """Format token details data"""
        address_data = data.get("address", [])
        transfers_data = data.get("transfers", [])
        
        token_details = {
            "address": "",
            "name": "",
            "symbol": "",
            "decimals": 18,
            "contract_type": "",
            "protocol_type": "",
            "last_transfer": None,
            "source": "bitquery",
            "last_updated": datetime.now().isoformat()
        }
        
        if address_data:
            addr = address_data[0]
            token_details["address"] = addr.get("address", "")
            token_details["contract_type"] = addr.get("smartContract", {}).get("contractType", "")
            token_details["protocol_type"] = addr.get("smartContract", {}).get("protocolType", "")
        
        if transfers_data:
            transfer = transfers_data[0]
            currency = transfer.get("currency", {})
            token_details["name"] = currency.get("name", "")
            token_details["symbol"] = currency.get("symbol", "")
            token_details["decimals"] = currency.get("decimals", 18)
            token_details["last_transfer"] = transfer.get("block", {}).get("timestamp", {}).get("time")
        
        return token_details
