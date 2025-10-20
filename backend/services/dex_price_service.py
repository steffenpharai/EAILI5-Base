"""
DEX Price Service - Fetch token prices from Base DEXs
Uses Uniswap V3 and other DEXs on Base mainnet to get real-time token prices
"""

import asyncio
from typing import Dict, Optional
import logging
from web3 import Web3
import httpx

logger = logging.getLogger(__name__)

# Uniswap V3 Factory on Base
UNISWAP_V3_FACTORY = "0x33128a8fC17869897dcE68Ed026d694621f6FDfD"

# Uniswap V3 Quoter V2 on Base
UNISWAP_V3_QUOTER = "0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a"

# Common quote tokens on Base
WETH_BASE = "0x4200000000000000000000000000000000000006"
USDC_BASE = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"

# Minimal ABI for price queries
QUOTER_ABI = [
    {
        "inputs": [
            {"internalType": "bytes", "name": "path", "type": "bytes"},
            {"internalType": "uint256", "name": "amountIn", "type": "uint256"}
        ],
        "name": "quoteExactInput",
        "outputs": [
            {"internalType": "uint256", "name": "amountOut", "type": "uint256"},
            {"internalType": "uint160[]", "name": "sqrtPriceX96AfterList", "type": "uint160[]"},
            {"internalType": "uint32[]", "name": "initializedTicksCrossedList", "type": "uint32[]"},
            {"internalType": "uint256", "name": "gasEstimate", "type": "uint256"}
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    }
]

ERC20_ABI = [
    {
        "constant": True,
        "inputs": [],
        "name": "decimals",
        "outputs": [{"name": "", "type": "uint8"}],
        "type": "function"
    }
]


class DexPriceService:
    """Service for fetching token prices from Base DEXs"""
    
    def __init__(self):
        self.w3 = None
        self.quoter_contract = None
        self.rpc_url = None
        
    async def initialize(self, rpc_url: str):
        """Initialize the DEX price service with Web3"""
        try:
            self.rpc_url = rpc_url or "https://mainnet.base.org"
            self.w3 = Web3(Web3.HTTPProvider(self.rpc_url))
            
            # Initialize quoter contract
            self.quoter_contract = self.w3.eth.contract(
                address=Web3.to_checksum_address(UNISWAP_V3_QUOTER),
                abi=QUOTER_ABI
            )
            
            logger.info(f"DEX price service initialized with RPC: {self.rpc_url}")
            logger.info(f"Connected to Base: {self.w3.is_connected()}")
            
        except Exception as e:
            logger.error(f"Error initializing DEX price service: {e}")
            raise
    
    async def get_token_price_usd(self, token_address: str) -> Optional[float]:
        """
        Get token price in USD using Uniswap V3 on Base
        
        Args:
            token_address: Token contract address
            
        Returns:
            Price in USD or None if not available
        """
        try:
            if not self.w3 or not self.w3.is_connected():
                logger.warning("Web3 not connected")
                return None
            
            token_address = Web3.to_checksum_address(token_address.lower())
            
            # Try to get price via WETH first, then USDC
            price = await self._get_price_via_quote_token(token_address, WETH_BASE, "WETH")
            
            if price is None:
                price = await self._get_price_via_quote_token(token_address, USDC_BASE, "USDC")
            
            return price
            
        except Exception as e:
            logger.error(f"Error getting price for {token_address}: {e}")
            return None
    
    async def _get_price_via_quote_token(
        self, 
        token_address: str, 
        quote_token_address: str,
        quote_token_name: str
    ) -> Optional[float]:
        """
        Get token price via a quote token (WETH or USDC)
        
        Args:
            token_address: Token to price
            quote_token_address: Quote token (WETH or USDC)
            quote_token_name: Name for logging
            
        Returns:
            Price in USD or None
        """
        try:
            # Get token decimals
            token_contract = self.w3.eth.contract(
                address=token_address,
                abi=ERC20_ABI
            )
            token_decimals = token_contract.functions.decimals().call()
            
            # Amount to quote (1 token)
            amount_in = 10 ** token_decimals
            
            # Encode path for Uniswap V3 (token -> quote token, fee tier 3000 = 0.3%)
            fee_tier = 3000
            path = self._encode_path([token_address, quote_token_address], [fee_tier])
            
            # Get quote from Uniswap V3
            result = self.quoter_contract.functions.quoteExactInput(
                path,
                amount_in
            ).call()
            
            amount_out = result[0]
            
            if amount_out == 0:
                logger.debug(f"No liquidity for {token_address} via {quote_token_name}")
                return None
            
            # Convert to price in USD
            if quote_token_name == "USDC":
                # USDC has 6 decimals
                price_usd = amount_out / (10 ** 6)
            else:  # WETH
                # WETH has 18 decimals, need to get WETH price in USD
                weth_price = await self._get_weth_price_usd()
                if weth_price is None:
                    return None
                price_in_weth = amount_out / (10 ** 18)
                price_usd = price_in_weth * weth_price
            
            logger.info(f"Got price for {token_address} via {quote_token_name}: ${price_usd:.8f}")
            return price_usd
            
        except Exception as e:
            logger.debug(f"Could not get price via {quote_token_name}: {e}")
            return None
    
    async def _get_weth_price_usd(self) -> Optional[float]:
        """Get WETH price in USD using WETH/USDC pool"""
        try:
            # WETH/USDC pool - quote 1 WETH in USDC
            amount_in = 10 ** 18  # 1 WETH
            
            fee_tier = 500  # 0.05% fee tier for WETH/USDC
            path = self._encode_path([WETH_BASE, USDC_BASE], [fee_tier])
            
            result = self.quoter_contract.functions.quoteExactInput(
                path,
                amount_in
            ).call()
            
            amount_out = result[0]
            
            if amount_out == 0:
                return None
            
            # USDC has 6 decimals
            weth_price = amount_out / (10 ** 6)
            
            logger.debug(f"WETH price: ${weth_price:.2f}")
            return weth_price
            
        except Exception as e:
            logger.error(f"Error getting WETH price: {e}")
            return None
    
    def _encode_path(self, tokens: list, fees: list) -> bytes:
        """
        Encode path for Uniswap V3
        Format: token0 + fee + token1
        """
        if len(tokens) != len(fees) + 1:
            raise ValueError("Invalid path: tokens length must be fees length + 1")
        
        encoded = b''
        for i, token in enumerate(tokens):
            # Add token address (20 bytes)
            encoded += bytes.fromhex(token[2:].lower())  # Remove 0x prefix
            
            # Add fee if not last token (3 bytes, uint24)
            if i < len(fees):
                fee_bytes = fees[i].to_bytes(3, byteorder='big')
                encoded += fee_bytes
        
        return encoded

