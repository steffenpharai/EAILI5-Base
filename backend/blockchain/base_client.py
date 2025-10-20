"""
Base Client - Handles Base blockchain interactions
Part of the DeCrypt backend services
"""

import asyncio
import os
from typing import Dict, List, Any, Optional
import logging
from datetime import datetime
import httpx
from web3 import Web3

logger = logging.getLogger(__name__)

class BaseClient:
    """
    Client for interacting with Base blockchain
    """
    
    def __init__(self):
        self.web3 = None
        self.base_rpc_url = None
        self.bitquery_api_key = None
        
        # Base network configuration (Sepolia testnet)
        self.base_chain_id = 84532  # Base Sepolia testnet
        self.base_chain_name = "Base Sepolia"
        self.base_native_token = "ETH"
        
        # Common Base DEX addresses
        self.dex_addresses = {
            "uniswap_v3": "0x03a520b32C04BF3bEEf7BF5e44D0B8e4C3e6B5e4",
            "aerodrome": "0x4200000000000000000000000000000000000006",
            "baseswap": "0x327Df1E6de05895d2ab08513aaDD9313Fe505d86"
        }
    
    async def initialize(self, rpc_url: str = None):
        """Initialize the Base client"""
        try:
            # Set RPC URL from parameter or environment (default to Sepolia testnet)
            if rpc_url:
                self.base_rpc_url = rpc_url
            else:
                self.base_rpc_url = os.getenv("BASE_RPC_URL", "https://sepolia.base.org")
            
            # Initialize Web3 connection
            self.web3 = Web3(Web3.HTTPProvider(self.base_rpc_url))
            
            # Test connection
            if self.web3.is_connected():
                logger.info("Base client initialized successfully")
            else:
                logger.error("Failed to connect to Base RPC")
                raise Exception("Base RPC connection failed")
                
        except Exception as e:
            logger.error(f"Error initializing Base client: {e}")
            raise
    
    async def check_connection(self) -> bool:
        """Check if Base RPC connection is working"""
        try:
            if self.web3:
                return self.web3.is_connected()
            return False
        except Exception as e:
            logger.error(f"Base connection check failed: {e}")
            return False
    
    async def get_latest_block(self) -> Optional[Dict[str, Any]]:
        """
        Get the latest block from Base
        """
        try:
            if not self.web3:
                return None
            
            latest_block = self.web3.eth.get_block('latest')
            
            return {
                "block_number": latest_block.number,
                "block_hash": latest_block.hash.hex(),
                "timestamp": latest_block.timestamp,
                "gas_used": latest_block.gasUsed,
                "gas_limit": latest_block.gasLimit,
                "base_fee": latest_block.baseFeePerGas,
                "transaction_count": len(latest_block.transactions)
            }
            
        except Exception as e:
            logger.error(f"Error getting latest block: {e}")
            return None
    
    async def get_token_balance(self, wallet_address: str, token_address: str) -> Optional[float]:
        """
        Get token balance for a wallet address
        """
        try:
            if not self.web3:
                return None
            
            # For ETH balance
            if token_address.lower() == "0x0000000000000000000000000000000000000000":
                balance_wei = self.web3.eth.get_balance(wallet_address)
                balance_eth = self.web3.from_wei(balance_wei, 'ether')
                return float(balance_eth)
            
            # For ERC-20 tokens
            # This would require token contract ABI and contract interaction
            # For now, return None as we'd need to implement ERC-20 balance checking
            return None
            
        except Exception as e:
            logger.error(f"Error getting token balance: {e}")
            return None
    
    async def get_transaction_history(self, wallet_address: str, limit: int = 50) -> List[Dict[str, Any]]:
        """
        Get transaction history for a wallet address
        """
        try:
            if not self.web3:
                return []
            
            # This would require more complex implementation
            # For now, return empty list
            return []
            
        except Exception as e:
            logger.error(f"Error getting transaction history: {e}")
            return []
    
    async def get_gas_price(self) -> Optional[Dict[str, Any]]:
        """
        Get current gas price on Base
        """
        try:
            if not self.web3:
                return None
            
            gas_price = self.web3.eth.gas_price
            gas_price_gwei = self.web3.from_wei(gas_price, 'gwei')
            
            return {
                "gas_price_wei": gas_price,
                "gas_price_gwei": float(gas_price_gwei),
                "gas_price_eth": float(self.web3.from_wei(gas_price, 'ether')),
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error getting gas price: {e}")
            return None
    
    async def get_network_info(self) -> Dict[str, Any]:
        """
        Get Base network information
        """
        try:
            if not self.web3:
                return {}
            
            latest_block = await self.get_latest_block()
            gas_price = await self.get_gas_price()
            
            return {
                "chain_id": self.base_chain_id,
                "chain_name": self.base_chain_name,
                "native_token": self.base_native_token,
                "latest_block": latest_block,
                "gas_price": gas_price,
                "rpc_url": self.base_rpc_url,
                "is_connected": self.web3.is_connected()
            }
            
        except Exception as e:
            logger.error(f"Error getting network info: {e}")
            return {}
    
    async def validate_address(self, address: str) -> bool:
        """
        Validate if an address is a valid Ethereum address
        """
        try:
            if not self.web3:
                return False
            
            return self.web3.is_address(address)
            
        except Exception as e:
            logger.error(f"Error validating address: {e}")
            return False
    
    async def get_token_info(self, token_address: str) -> Optional[Dict[str, Any]]:
        """
        Get basic token information from Base
        """
        try:
            if not self.web3:
                return None
            
            # This would require token contract interaction
            # For now, return basic info
            return {
                "address": token_address,
                "chain_id": self.base_chain_id,
                "chain_name": self.base_chain_name,
                "is_valid_address": await self.validate_address(token_address)
            }
            
        except Exception as e:
            logger.error(f"Error getting token info: {e}")
            return None
    
    async def get_dex_info(self) -> Dict[str, Any]:
        """
        Get information about Base DEXs
        """
        try:
            return {
                "dex_addresses": self.dex_addresses,
                "chain_id": self.base_chain_id,
                "chain_name": self.base_chain_name,
                "last_updated": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error getting DEX info: {e}")
            return {}
    
    async def get_base_stats(self) -> Dict[str, Any]:
        """
        Get Base network statistics
        """
        try:
            if not self.web3:
                return {}
            
            latest_block = await self.get_latest_block()
            gas_price = await self.get_gas_price()
            
            return {
                "latest_block_number": latest_block.get("block_number", 0) if latest_block else 0,
                "gas_price_gwei": gas_price.get("gas_price_gwei", 0) if gas_price else 0,
                "is_connected": self.web3.is_connected(),
                "chain_id": self.base_chain_id,
                "chain_name": self.base_chain_name,
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error getting Base stats: {e}")
            return {}
