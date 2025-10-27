// API request/response types for EAILI5

export interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  services: {
    openai: 'connected' | 'disconnected';
    tavily: 'connected' | 'disconnected';
    base_rpc: 'connected' | 'disconnected';
    bitquery: 'connected' | 'disconnected';
    educational_content: 'connected' | 'disconnected';
    progress_tracking: 'connected' | 'disconnected';
    websocket: 'connected' | 'disconnected';
    wallet_auth: 'connected' | 'disconnected';
    analytics: 'connected' | 'disconnected';
    miniapp: 'connected' | 'disconnected';
    orchestrator: 'connected' | 'disconnected';
    redis: 'connected' | 'disconnected';
    database: 'connected' | 'disconnected';
  };
  version: string;
  environment: string;
  timestamp: string;
}

export interface TokenData {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  price: number;
  market_cap: number;
  volume_24h: number;
  liquidity: number;
  holders: number;
  social_links: Record<string, string>;
  description: string;
  safety_score: number;
  last_updated: string;
  // Frontend-specific fields
  priceChange24h?: number;
  logoUrl?: string;
}

export interface PortfolioState {
  user_id: string;
  initial_balance: number;
  cash_balance: number;
  total_value: number;
  holdings: Array<Record<string, any>>;
  trade_count: number;
  total_trades: number;
  created_at: string;
  last_updated: string;
  // Frontend-specific fields
  positions?: PortfolioPosition[];
  trades?: Trade[];
  performance?: PerformanceMetrics;
}

export interface PortfolioPosition {
  tokenAddress: string;
  symbol: string;
  amount: number;
  value: number;
  price: number;
  change24h: number;
}

export interface Trade {
  id: string;
  tokenAddress: string;
  symbol: string;
  type: 'buy' | 'sell';
  amount: number;
  price: number;
  value: number;
  timestamp: string;
}

export interface PerformanceMetrics {
  totalReturn: number;
  totalReturnPercent: number;
  bestTrade: number;
  worstTrade: number;
  winRate: number;
  avgTradeSize: number;
}

export interface TradeSimulationRequest {
  tokenAddress: string;
  amount: number;
  type: 'buy' | 'sell';
  userId: string;
}

export interface TradeSimulationResponse {
  success: boolean;
  newBalance: number;
  newPosition: PortfolioPosition;
  message: string;
}

export interface WalletConnectionRequest {
  address: string;
  signature?: string;
  message?: string;
}

export interface WalletConnectionResponse {
  success: boolean;
  sessionId: string;
  message: string;
}

export interface WalletDisconnectionRequest {
  address: string;
  sessionId: string;
}

export interface WalletDisconnectionResponse {
  success: boolean;
  message: string;
}
