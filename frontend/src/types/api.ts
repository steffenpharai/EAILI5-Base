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
  symbol: string;
  name: string;
  price: number;
  priceChange24h: number;
  volume24h: number;
  marketCap: number;
  liquidity: number;
  decimals: number;
  logoUrl?: string;
}

export interface PortfolioState {
  userId: string;
  balance: number;
  totalValue: number;
  positions: PortfolioPosition[];
  trades: Trade[];
  performance: PerformanceMetrics;
  lastUpdated: string;
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
