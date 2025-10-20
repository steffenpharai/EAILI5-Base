"""
Blockchain Tools - Tools for interacting with blockchain data
Part of the EAILI5 multi-agent tool system
"""

import asyncio
from typing import Dict, List, Any, Optional
import logging
from datetime import datetime
import json
from services.bitquery_service import BitqueryService
from blockchain.base_client import BaseClient

logger = logging.getLogger(__name__)

class BlockchainTools:
    """
    Tools for blockchain data retrieval and analysis
    """
    
    def __init__(self, bitquery_service: BitqueryService, base_client: BaseClient):
        self.bitquery_service = bitquery_service
        self.base_client = base_client
    
    async def get_token_price(self, token_address: str) -> Dict[str, Any]:
        """Get current price of a token"""
        try:
            # Use Bitquery to get token price
            price_data = await self.bitquery_service.get_token_price(token_address)
            
            return {
                "token_address": token_address,
                "price_usd": price_data.get("price_usd", 0),
                "price_change_24h": price_data.get("price_change_24h", 0),
                "market_cap": price_data.get("market_cap", 0),
                "volume_24h": price_data.get("volume_24h", 0),
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error getting token price: {e}")
            return {"error": str(e)}
    
    async def get_token_info(self, token_address: str) -> Dict[str, Any]:
        """Get comprehensive token information"""
        try:
            # Get token details from Bitquery
            token_data = await self.bitquery_service.get_token_details(token_address)
            
            return {
                "token_address": token_address,
                "name": token_data.get("name", "Unknown"),
                "symbol": token_data.get("symbol", "UNKNOWN"),
                "decimals": token_data.get("decimals", 18),
                "total_supply": token_data.get("total_supply", 0),
                "price_usd": token_data.get("price_usd", 0),
                "market_cap": token_data.get("market_cap", 0),
                "volume_24h": token_data.get("volume_24h", 0),
                "price_change_24h": token_data.get("price_change_24h", 0),
                "is_verified": token_data.get("is_verified", False),
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error getting token info: {e}")
            return {"error": str(e)}
    
    async def get_wallet_balance(self, wallet_address: str) -> Dict[str, Any]:
        """Get wallet balance and token holdings"""
        try:
            # Get balance from Base client
            balance_data = await self.base_client.get_wallet_balance(wallet_address)
            
            return {
                "wallet_address": wallet_address,
                "eth_balance": balance_data.get("eth_balance", 0),
                "eth_balance_usd": balance_data.get("eth_balance_usd", 0),
                "token_holdings": balance_data.get("token_holdings", []),
                "total_value_usd": balance_data.get("total_value_usd", 0),
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error getting wallet balance: {e}")
            return {"error": str(e)}
    
    async def get_transaction_history(
        self, 
        wallet_address: str, 
        limit: int = 10
    ) -> Dict[str, Any]:
        """Get transaction history for a wallet"""
        try:
            # Get transaction history from Bitquery
            tx_data = await self.bitquery_service.get_transaction_history(
                wallet_address, limit
            )
            
            return {
                "wallet_address": wallet_address,
                "transactions": tx_data.get("transactions", []),
                "total_count": tx_data.get("total_count", 0),
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error getting transaction history: {e}")
            return {"error": str(e)}
    
    async def estimate_gas_fees(self, transaction_type: str) -> Dict[str, Any]:
        """Estimate gas fees for different transaction types"""
        try:
            # Get gas estimates from Base client
            gas_data = await self.base_client.get_gas_estimates()
            
            return {
                "transaction_type": transaction_type,
                "slow": gas_data.get("slow", 0),
                "standard": gas_data.get("standard", 0),
                "fast": gas_data.get("fast", 0),
                "priority": gas_data.get("priority", 0),
                "currency": "ETH",
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error estimating gas fees: {e}")
            return {"error": str(e)}
    
    async def check_contract_verified(self, contract_address: str) -> Dict[str, Any]:
        """Check if a contract is verified on Base"""
        try:
            # Check contract verification status
            verification_data = await self.base_client.check_contract_verification(
                contract_address
            )
            
            return {
                "contract_address": contract_address,
                "is_verified": verification_data.get("is_verified", False),
                "verification_status": verification_data.get("status", "unknown"),
                "source_code": verification_data.get("source_code", None),
                "abi": verification_data.get("abi", None),
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error checking contract verification: {e}")
            return {"error": str(e)}
    
    async def get_token_holders(self, token_address: str, limit: int = 10) -> Dict[str, Any]:
        """Get top token holders"""
        try:
            # Get token holders from Bitquery
            holders_data = await self.bitquery_service.get_token_holders(
                token_address, limit
            )
            
            return {
                "token_address": token_address,
                "holders": holders_data.get("holders", []),
                "total_holders": holders_data.get("total_holders", 0),
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error getting token holders: {e}")
            return {"error": str(e)}
    
    async def get_token_transfers(
        self, 
        token_address: str, 
        limit: int = 10
    ) -> Dict[str, Any]:
        """Get recent token transfers"""
        try:
            # Get token transfers from Bitquery
            transfers_data = await self.bitquery_service.get_token_transfers(
                token_address, limit
            )
            
            return {
                "token_address": token_address,
                "transfers": transfers_data.get("transfers", []),
                "total_count": transfers_data.get("total_count", 0),
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error getting token transfers: {e}")
            return {"error": str(e)}
    
    async def analyze_wallet_activity(self, wallet_address: str) -> Dict[str, Any]:
        """Analyze wallet activity patterns"""
        try:
            # Get comprehensive wallet analysis
            analysis_data = await self.bitquery_service.analyze_wallet_activity(
                wallet_address
            )
            
            return {
                "wallet_address": wallet_address,
                "activity_score": analysis_data.get("activity_score", 0),
                "transaction_frequency": analysis_data.get("transaction_frequency", 0),
                "total_transactions": analysis_data.get("total_transactions", 0),
                "unique_tokens": analysis_data.get("unique_tokens", 0),
                "degen_score": analysis_data.get("degen_score", 0),
                "risk_level": analysis_data.get("risk_level", "unknown"),
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error analyzing wallet activity: {e}")
            return {"error": str(e)}
    
    def get_tool_definitions(self) -> List[Dict[str, Any]]:
        """Get tool definitions for registration"""
        return [
            {
                "name": "get_token_price",
                "description": "Get current price and market data for a token",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "token_address": {
                            "type": "string",
                            "description": "The contract address of the token"
                        }
                    },
                    "required": ["token_address"]
                },
                "category": "blockchain",
                "requires_auth": False
            },
            {
                "name": "get_token_info",
                "description": "Get comprehensive information about a token",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "token_address": {
                            "type": "string",
                            "description": "The contract address of the token"
                        }
                    },
                    "required": ["token_address"]
                },
                "category": "blockchain",
                "requires_auth": False
            },
            {
                "name": "get_wallet_balance",
                "description": "Get wallet balance and token holdings",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "wallet_address": {
                            "type": "string",
                            "description": "The wallet address to check"
                        }
                    },
                    "required": ["wallet_address"]
                },
                "category": "blockchain",
                "requires_auth": False
            },
            {
                "name": "get_transaction_history",
                "description": "Get transaction history for a wallet",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "wallet_address": {
                            "type": "string",
                            "description": "The wallet address to check"
                        },
                        "limit": {
                            "type": "integer",
                            "description": "Maximum number of transactions to return",
                            "default": 10
                        }
                    },
                    "required": ["wallet_address"]
                },
                "category": "blockchain",
                "requires_auth": False
            },
            {
                "name": "estimate_gas_fees",
                "description": "Estimate gas fees for different transaction types",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "transaction_type": {
                            "type": "string",
                            "description": "Type of transaction (swap, transfer, contract_call)",
                            "enum": ["swap", "transfer", "contract_call", "deploy"]
                        }
                    },
                    "required": ["transaction_type"]
                },
                "category": "blockchain",
                "requires_auth": False
            },
            {
                "name": "check_contract_verified",
                "description": "Check if a smart contract is verified on Base",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "contract_address": {
                            "type": "string",
                            "description": "The contract address to check"
                        }
                    },
                    "required": ["contract_address"]
                },
                "category": "blockchain",
                "requires_auth": False
            }
        ]
