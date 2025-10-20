"""
Pydantic schemas for API request/response models
Part of the DeCrypt backend models
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

class TradeType(str, Enum):
    BUY = "buy"
    SELL = "sell"

class ChatMessage(BaseModel):
    message: str = Field(..., description="User's message")
    user_id: str = Field(..., description="Unique user identifier")
    context: Optional[Dict[str, Any]] = Field(None, description="Additional context")

class TokenData(BaseModel):
    address: str = Field(..., description="Token contract address")
    name: str = Field(..., description="Token name")
    symbol: str = Field(..., description="Token symbol")
    decimals: int = Field(18, description="Token decimals")
    price: float = Field(0.0, description="Current token price")
    market_cap: float = Field(0.0, description="Market capitalization")
    volume_24h: float = Field(0.0, description="24-hour trading volume")
    liquidity: float = Field(0.0, description="Total liquidity")
    holders: int = Field(0, description="Number of holders")
    social_links: Dict[str, str] = Field(default_factory=dict, description="Social media links")
    description: str = Field("", description="Token description")
    safety_score: float = Field(0.0, description="Safety score (0-100)")
    last_updated: datetime = Field(default_factory=datetime.now, description="Last update timestamp")

class PortfolioState(BaseModel):
    user_id: str = Field(..., description="Unique user identifier")
    initial_balance: float = Field(100.0, description="Initial virtual balance")
    cash_balance: float = Field(100.0, description="Current cash balance")
    total_value: float = Field(100.0, description="Total portfolio value")
    holdings: List[Dict[str, Any]] = Field(default_factory=list, description="Token holdings")
    trade_count: int = Field(0, description="Number of trades")
    total_trades: int = Field(0, description="Total trades ever")
    created_at: datetime = Field(default_factory=datetime.now, description="Portfolio creation timestamp")
    last_updated: datetime = Field(default_factory=datetime.now, description="Last update timestamp")

class TradeRequest(BaseModel):
    user_id: str = Field(..., description="Unique user identifier")
    token_address: str = Field(..., description="Token contract address")
    trade_type: TradeType = Field(..., description="Type of trade (buy/sell)")
    amount: float = Field(..., description="Trade amount in USD")

class TradeResult(BaseModel):
    trade_type: str = Field(..., description="Type of trade")
    token_address: str = Field(..., description="Token contract address")
    amount_usd: float = Field(..., description="Trade amount in USD")
    token_price: float = Field(..., description="Token price at time of trade")
    tokens_amount: float = Field(..., description="Amount of tokens traded")
    status: str = Field(..., description="Trade status")
    timestamp: datetime = Field(default_factory=datetime.now, description="Trade timestamp")

class PortfolioPerformance(BaseModel):
    total_value: float = Field(..., description="Total portfolio value")
    initial_balance: float = Field(..., description="Initial balance")
    total_return: float = Field(..., description="Total return in USD")
    return_percentage: float = Field(..., description="Return percentage")
    token_performance: List[Dict[str, Any]] = Field(default_factory=list, description="Individual token performance")
    last_updated: datetime = Field(default_factory=datetime.now, description="Last update timestamp")

class UserLearningLevel(BaseModel):
    user_id: str = Field(..., description="Unique user identifier")
    learning_level: int = Field(0, description="Learning level (0-100)")
    total_questions: int = Field(0, description="Total questions asked")
    correct_answers: int = Field(0, description="Correct answers given")
    badges_earned: List[str] = Field(default_factory=list, description="Badges earned")
    last_updated: datetime = Field(default_factory=datetime.now, description="Last update timestamp")

class AIResponse(BaseModel):
    message: str = Field(..., description="AI response message")
    suggestions: List[str] = Field(default_factory=list, description="Follow-up suggestions")
    learning_level: int = Field(0, description="User's learning level")
    intent: str = Field("", description="Detected intent")
    timestamp: datetime = Field(default_factory=datetime.now, description="Response timestamp")

class HealthCheck(BaseModel):
    status: str = Field(..., description="Health status")
    database: str = Field(..., description="Database connection status")
    redis: str = Field(..., description="Redis connection status")
    base_rpc: str = Field(..., description="Base RPC connection status")
    timestamp: datetime = Field(default_factory=datetime.now, description="Health check timestamp")

class ErrorResponse(BaseModel):
    error: str = Field(..., description="Error message")
    status: str = Field("error", description="Response status")
    timestamp: datetime = Field(default_factory=datetime.now, description="Error timestamp")

class SuccessResponse(BaseModel):
    message: str = Field(..., description="Success message")
    status: str = Field("success", description="Response status")
    data: Optional[Dict[str, Any]] = Field(None, description="Response data")
    timestamp: datetime = Field(default_factory=datetime.now, description="Response timestamp")
