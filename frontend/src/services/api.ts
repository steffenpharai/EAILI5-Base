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

// API endpoints with proper typing - All 62 Backend Endpoints
export const apiEndpoints = {
  // Health & Status
  health: (): Promise<{ data: HealthResponse }> => api.get('/api/health'),
  healthSimple: () => api.get('/health'),
  
  // Token Data & Analysis
  getTrendingTokens: (category?: string, limit?: number): Promise<{ data: any }> => 
    api.get('/api/tokens', { params: { category, limit } }),
  getTokenDetails: (address: string): Promise<{ data: any }> => api.get(`/api/tokens/${address}`),
  getTokenOHLC: (address: string, days?: number): Promise<{ data: any }> => 
    api.get(`/api/tokens/${address}/ohlc`, { params: { days } }),
  getTokenEnhanced: (address: string): Promise<{ data: any }> => api.get(`/api/tokens/${address}/enhanced`),
  getTokenSentiment: (address: string): Promise<{ data: any }> => api.get(`/api/tokens/${address}/sentiment`),
  getTokenSocialSentiment: (address: string): Promise<{ data: any }> => api.get(`/api/tokens/${address}/social-sentiment`),
  getTokenSentimentTimeline: (address: string): Promise<{ data: any }> => api.get(`/api/tokens/${address}/sentiment-timeline`),
  
  // Portfolio Management
  getPortfolio: (userId: string): Promise<{ data: PortfolioState }> => api.get(`/api/portfolio/${userId}`),
  simulateTrade: (tradeData: TradeSimulationRequest): Promise<{ data: TradeSimulationResponse }> => 
    api.post('/api/portfolio/simulate', tradeData),
  getPortfolioPerformance: (userId: string): Promise<{ data: any }> => api.get(`/api/portfolio/${userId}/performance`),
  getTradeHistory: (userId: string, limit?: number): Promise<{ data: any }> => 
    api.get(`/api/portfolio/${userId}/trades`, { params: { limit } }),
  
  // Education & Learning
  getEducationContent: (category: string): Promise<{ data: any }> => api.get(`/api/education/content/${category}`),
  getEducationContentById: (contentId: string): Promise<{ data: any }> => api.get(`/api/education/content/id/${contentId}`),
  getLearningPaths: (): Promise<{ data: any }> => api.get('/api/education/paths'),
  getLearningPath: (pathId: string): Promise<{ data: any }> => api.get(`/api/education/paths/${pathId}`),
  
  // Progress Tracking
  getUserProgress: (userId: string): Promise<{ data: any }> => api.get(`/api/progress/${userId}`),
  getAchievements: (userId: string): Promise<{ data: any }> => api.get(`/api/progress/${userId}/achievements`),
  getAvailableAchievements: (userId: string): Promise<{ data: any }> => api.get(`/api/progress/${userId}/achievements/available`),
  getProgressStats: (userId: string): Promise<{ data: any }> => api.get(`/api/progress/${userId}/stats`),
  getLeaderboard: (): Promise<{ data: any }> => api.get('/api/progress/leaderboard'),
  completeLesson: (userId: string, lessonId: string): Promise<{ data: any }> => 
    api.post(`/api/progress/${userId}/complete-lesson`, { lesson_id: lessonId }),
  updateStreak: (userId: string): Promise<{ data: any }> => api.post(`/api/progress/${userId}/streak`),
  getPathProgress: (pathId: string, userId: string): Promise<{ data: any }> => 
    api.get(`/api/learning-paths/${pathId}/progress/${userId}`),
  getRecommendations: (userId: string): Promise<{ data: any }> => api.get(`/api/progress/${userId}/recommendations`),
  
  // Wallet Integration
  connectWallet: (request: WalletConnectionRequest): Promise<{ data: WalletConnectionResponse }> => 
    api.post('/api/wallet/connect', request),
  disconnectWallet: (request: WalletDisconnectionRequest): Promise<{ data: WalletDisconnectionResponse }> => 
    api.post('/api/wallet/disconnect', request),
  verifyWallet: (request: any): Promise<{ data: any }> => api.post('/api/wallet/verify', request),
  getWalletSession: (sessionId: string): Promise<{ data: any }> => api.get(`/api/wallet/session/${sessionId}`),
  getWalletUser: (walletAddress: string): Promise<{ data: any }> => api.get(`/api/wallet/user/${walletAddress}`),
  getAuthToken: (request: any): Promise<{ data: any }> => api.post('/api/wallet/auth/token', request),
  updateWalletPreferences: (sessionId: string, preferences: any): Promise<{ data: any }> => 
    api.post(`/api/wallet/preferences/${sessionId}`, preferences),
  getWalletStats: (sessionId: string): Promise<{ data: any }> => api.get(`/api/wallet/stats/${sessionId}`),
  getConnectedWallets: (): Promise<{ data: any }> => api.get('/api/wallet/connected'),
  
  // Session Management
  createSession: (walletAddress?: string): Promise<{ data: any }> => 
    api.post('/api/session/create', { wallet_address: walletAddress }),
  validateSession: (sessionId: string): Promise<{ data: any }> => 
    api.post('/api/session/validate', { session_id: sessionId }),
  endSession: (sessionId: string): Promise<{ data: any }> => 
    api.post('/api/session/end', { session_id: sessionId }),
  
  // User Management
  getUser: (userId: string): Promise<{ data: any }> => api.get(`/api/users/${userId}`),
  updateUserPreferences: (userId: string, preferences: any): Promise<{ data: any }> => 
    api.put(`/api/users/${userId}/preferences`, preferences),
  getUserStats: (userId: string): Promise<{ data: any }> => api.get(`/api/users/${userId}/stats`),
  
  // Analytics
  getAnalyticsOverview: (): Promise<{ data: any }> => api.get('/api/analytics/overview'),
  getUserAnalytics: (): Promise<{ data: any }> => api.get('/api/analytics/users'),
  getContentAnalytics: (): Promise<{ data: any }> => api.get('/api/analytics/content'),
  getTokenAnalytics: (): Promise<{ data: any }> => api.get('/api/analytics/tokens'),
  
  // Base Mini App
  getMiniAppManifest: (): Promise<{ data: any }> => api.get('/api/miniapp/manifest'),
  validateMiniAppManifest: (manifestData: any): Promise<{ data: any }> => 
    api.post('/api/miniapp/validate', manifestData),
  getAccountAssociation: (): Promise<{ data: any }> => api.get('/api/miniapp/account-association'),
  getMiniAppConfig: (): Promise<{ data: any }> => api.get('/api/miniapp/config'),
  
  // Social & Sentiment
  getTrendingTopics: (): Promise<{ data: any }> => api.get('/api/social/trending-topics'),
  
  // Appreciation & Feedback
  logAppreciation: (data: any): Promise<{ data: any }> => api.post('/api/appreciation/log', data),
};

export default api;
