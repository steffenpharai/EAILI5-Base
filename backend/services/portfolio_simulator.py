"""
Portfolio Simulator - Manages virtual portfolio simulation and trading
Part of the DeCrypt backend services
"""

import asyncio
from typing import Dict, List, Any, Optional
import logging
from datetime import datetime, timedelta
import json
from decimal import Decimal, ROUND_DOWN

logger = logging.getLogger(__name__)

class PortfolioSimulator:
    """
    Service for managing virtual portfolio simulation and trading
    """
    
    def __init__(self):
        self.redis_client = None
        self.token_service = None
        
        # Default portfolio settings
        self.default_balance = 100.0  # $100 virtual starting balance
        self.min_trade_amount = 1.0  # Minimum $1 trade
        self.max_trade_amount = 50.0  # Maximum $50 trade
        
        # Portfolio cache settings
        self.portfolio_cache_ttl = 3600  # 1 hour
    
    async def initialize(self, redis_client, token_service):
        """Initialize the portfolio simulator"""
        try:
            self.redis_client = redis_client
            self.token_service = token_service
            logger.info("Portfolio simulator initialized successfully")
            
        except Exception as e:
            logger.error(f"Error initializing portfolio simulator: {e}")
            raise
    
    async def get_portfolio(self, user_id: str) -> Dict[str, Any]:
        """
        Get user's virtual portfolio
        """
        try:
            # Check cache first
            cache_key = f"portfolio:{user_id}"
            cached_portfolio = await self._get_from_cache(cache_key)
            
            if cached_portfolio:
                return cached_portfolio
            
            # Create new portfolio if doesn't exist
            portfolio = await self._create_new_portfolio(user_id)
            
            # Cache the portfolio
            await self._set_cache(cache_key, portfolio, self.portfolio_cache_ttl)
            
            return portfolio
            
        except Exception as e:
            logger.error(f"Error getting portfolio: {e}")
            return {}
    
    async def simulate_trade(self, trade_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Simulate a trade in the virtual portfolio
        """
        try:
            user_id = trade_data.get("user_id")
            token_address = trade_data.get("token_address")
            trade_type = trade_data.get("trade_type")  # "buy" or "sell"
            amount = float(trade_data.get("amount", 0))
            
            if not user_id or not token_address or not trade_type or amount <= 0:
                return {"error": "Invalid trade data", "status": "error"}
            
            # Get current portfolio
            portfolio = await self.get_portfolio(user_id)
            
            # Get current token price
            token_price = await self.token_service.get_token_price(token_address)
            if not token_price:
                return {"error": "Token price not available", "status": "error"}
            
            # Calculate trade details
            trade_result = await self._calculate_trade(
                portfolio=portfolio,
                token_address=token_address,
                trade_type=trade_type,
                amount=amount,
                token_price=token_price
            )
            
            if trade_result["status"] == "error":
                return trade_result
            
            # Update portfolio
            updated_portfolio = await self._update_portfolio(
                portfolio=portfolio,
                trade_result=trade_result
            )
            
            # Cache updated portfolio
            cache_key = f"portfolio:{user_id}"
            await self._set_cache(cache_key, updated_portfolio, self.portfolio_cache_ttl)
            
            return {
                "trade_result": trade_result,
                "updated_portfolio": updated_portfolio,
                "status": "success"
            }
            
        except Exception as e:
            logger.error(f"Error simulating trade: {e}")
            return {"error": "Trade simulation failed", "status": "error"}
    
    async def get_portfolio_performance(self, user_id: str) -> Dict[str, Any]:
        """
        Get portfolio performance metrics
        """
        try:
            portfolio = await self.get_portfolio(user_id)
            
            # Calculate performance metrics
            total_value = portfolio.get("total_value", 0)
            initial_balance = portfolio.get("initial_balance", 100)
            total_return = total_value - initial_balance
            return_percentage = (total_return / initial_balance) * 100 if initial_balance > 0 else 0
            
            # Calculate individual token performance
            token_performance = []
            for holding in portfolio.get("holdings", []):
                token_address = holding.get("token_address")
                current_price = await self.token_service.get_token_price(token_address)
                
                if current_price:
                    current_value = holding.get("amount", 0) * current_price
                    cost_basis = holding.get("cost_basis", 0)
                    pnl = current_value - cost_basis
                    pnl_percentage = (pnl / cost_basis) * 100 if cost_basis > 0 else 0
                    
                    token_performance.append({
                        "token_address": token_address,
                        "symbol": holding.get("symbol", ""),
                        "amount": holding.get("amount", 0),
                        "cost_basis": cost_basis,
                        "current_value": current_value,
                        "pnl": pnl,
                        "pnl_percentage": pnl_percentage
                    })
            
            return {
                "total_value": total_value,
                "initial_balance": initial_balance,
                "total_return": total_return,
                "return_percentage": return_percentage,
                "token_performance": token_performance,
                "last_updated": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error getting portfolio performance: {e}")
            return {}
    
    async def get_trade_history(self, user_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """
        Get user's trade history
        """
        try:
            cache_key = f"trade_history:{user_id}"
            cached_history = await self._get_from_cache(cache_key)
            
            if cached_history:
                return cached_history[:limit]
            
            # Return empty history if no trades
            return []
            
        except Exception as e:
            logger.error(f"Error getting trade history: {e}")
            return []
    
    async def _create_new_portfolio(self, user_id: str) -> Dict[str, Any]:
        """
        Create a new virtual portfolio for a user
        """
        try:
            portfolio = {
                "user_id": user_id,
                "initial_balance": self.default_balance,
                "cash_balance": self.default_balance,
                "total_value": self.default_balance,
                "holdings": [],
                "trade_count": 0,
                "total_trades": 0,
                "created_at": datetime.now().isoformat(),
                "last_updated": datetime.now().isoformat()
            }
            
            return portfolio
            
        except Exception as e:
            logger.error(f"Error creating new portfolio: {e}")
            return {}
    
    async def _calculate_trade(
        self,
        portfolio: Dict[str, Any],
        token_address: str,
        trade_type: str,
        amount: float,
        token_price: float
    ) -> Dict[str, Any]:
        """
        Calculate trade details and validate trade
        """
        try:
            # Validate trade amount
            if amount < self.min_trade_amount:
                return {"error": f"Minimum trade amount is ${self.min_trade_amount}", "status": "error"}
            
            if amount > self.max_trade_amount:
                return {"error": f"Maximum trade amount is ${self.max_trade_amount}", "status": "error"}
            
            # Calculate trade details
            if trade_type == "buy":
                # Check if user has enough cash
                if amount > portfolio.get("cash_balance", 0):
                    return {"error": "Insufficient cash balance", "status": "error"}
                
                # Calculate tokens to buy
                tokens_to_buy = amount / token_price
                
                return {
                    "trade_type": "buy",
                    "token_address": token_address,
                    "amount_usd": amount,
                    "token_price": token_price,
                    "tokens_amount": tokens_to_buy,
                    "status": "success"
                }
            
            elif trade_type == "sell":
                # Check if user has enough tokens
                current_holding = self._get_current_holding(portfolio, token_address)
                if not current_holding or current_holding.get("amount", 0) < (amount / token_price):
                    return {"error": "Insufficient token balance", "status": "error"}
                
                # Calculate tokens to sell
                tokens_to_sell = amount / token_price
                
                return {
                    "trade_type": "sell",
                    "token_address": token_address,
                    "amount_usd": amount,
                    "token_price": token_price,
                    "tokens_amount": tokens_to_sell,
                    "status": "success"
                }
            
            else:
                return {"error": "Invalid trade type", "status": "error"}
                
        except Exception as e:
            logger.error(f"Error calculating trade: {e}")
            return {"error": "Trade calculation failed", "status": "error"}
    
    async def _update_portfolio(
        self,
        portfolio: Dict[str, Any],
        trade_result: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Update portfolio after a trade
        """
        try:
            trade_type = trade_result.get("trade_type")
            token_address = trade_result.get("token_address")
            amount_usd = trade_result.get("amount_usd", 0)
            tokens_amount = trade_result.get("tokens_amount", 0)
            token_price = trade_result.get("token_price", 0)
            
            # Update cash balance
            if trade_type == "buy":
                portfolio["cash_balance"] -= amount_usd
            elif trade_type == "sell":
                portfolio["cash_balance"] += amount_usd
            
            # Update holdings
            if trade_type == "buy":
                # Add to existing holding or create new one
                current_holding = self._get_current_holding(portfolio, token_address)
                if current_holding:
                    # Update existing holding
                    current_holding["amount"] += tokens_amount
                    current_holding["cost_basis"] += amount_usd
                else:
                    # Create new holding
                    portfolio["holdings"].append({
                        "token_address": token_address,
                        "amount": tokens_amount,
                        "cost_basis": amount_usd,
                        "average_price": token_price,
                        "first_purchased": datetime.now().isoformat()
                    })
            
            elif trade_type == "sell":
                # Update existing holding
                current_holding = self._get_current_holding(portfolio, token_address)
                if current_holding:
                    current_holding["amount"] -= tokens_amount
                    current_holding["cost_basis"] -= amount_usd
                    
                    # Remove holding if amount is zero
                    if current_holding["amount"] <= 0:
                        portfolio["holdings"].remove(current_holding)
            
            # Update portfolio metrics
            portfolio["trade_count"] += 1
            portfolio["total_trades"] += 1
            portfolio["last_updated"] = datetime.now().isoformat()
            
            # Calculate total value
            total_value = portfolio["cash_balance"]
            for holding in portfolio["holdings"]:
                token_address = holding.get("token_address")
                current_price = await self.token_service.get_token_price(token_address)
                if current_price:
                    total_value += holding.get("amount", 0) * current_price
            
            portfolio["total_value"] = total_value
            
            return portfolio
            
        except Exception as e:
            logger.error(f"Error updating portfolio: {e}")
            return portfolio
    
    def _get_current_holding(self, portfolio: Dict[str, Any], token_address: str) -> Optional[Dict[str, Any]]:
        """
        Get current holding for a token
        """
        for holding in portfolio.get("holdings", []):
            if holding.get("token_address") == token_address:
                return holding
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
