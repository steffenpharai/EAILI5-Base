import axios from 'axios';
import { 
  HealthResponse, 
  TokenData, 
  PortfolioState, 
  TradeSimulationRequest, 
  TradeSimulationResponse,
  WalletConnectionRequest,
  WalletConnectionResponse,
  WalletDisconnectionRequest,
  WalletDisconnectionResponse
} from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('auth_token');
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

// API endpoints with proper typing
export const apiEndpoints = {
  // Health check
  health: (): Promise<{ data: HealthResponse }> => api.get('/api/health'),
  
  // Token data
  getTrendingTokens: (): Promise<{ data: TokenData[] }> => api.get('/api/tokens'),
  getTokenDetails: (address: string): Promise<{ data: TokenData }> => api.get(`/api/tokens/${address}`),
  
  // Portfolio
  getPortfolio: (userId: string): Promise<{ data: PortfolioState }> => api.get(`/api/portfolio/${userId}`),
  simulateTrade: (tradeData: TradeSimulationRequest): Promise<{ data: TradeSimulationResponse }> => 
    api.post('/api/portfolio/simulate', tradeData),
  
  // Wallet
  connectWallet: (request: WalletConnectionRequest): Promise<{ data: WalletConnectionResponse }> => 
    api.post('/api/wallet/connect', request),
  disconnectWallet: (request: WalletDisconnectionRequest): Promise<{ data: WalletDisconnectionResponse }> => 
    api.post('/api/wallet/disconnect', request),
};

export default api;
