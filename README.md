# EAILI5 Base Mini App

[![Base Batches 002](https://img.shields.io/badge/Base%20Batches-002-blue)](https://base-batches-builder-track.devfolio.co/)
[![Built on Base](https://img.shields.io/badge/Built%20on-Base-blue)](https://base.org)
[![Deployed on Google Cloud](https://img.shields.io/badge/Deployed%20on-Google%20Cloud-4285F4)](https://cloud.google.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub Repository](https://img.shields.io/badge/GitHub-Repository-black)](https://github.com/steffenpharai/EAILI5-Base)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-https://base.explainailikeimfive.com-green)](https://base.explainailikeimfive.com)

AI-powered crypto education platform built on Base L2. Uses multi-agent AI system to teach crypto newcomers through real-time DEX data analysis, risk-free portfolio simulation, and conversational learning. Features enhanced mobile UX with thumb-zone optimized interactions and production-ready security.

## 🏆 Base Batches 002 Submission

**Repository**: [https://github.com/steffenpharai/EAILI5-Base](https://github.com/steffenpharai/EAILI5-Base)  
**Live App**: [https://base.explainailikeimfive.com](https://base.explainailikeimfive.com)  
**Team**: stefo0.base.eth

## 🚀 Quick Start

**⚠️ Run all commands from this directory (`apps/base/`)**

### Development (Hot-Reload Enabled)

```bash
# Start all services with hot-reload
docker-compose up -d

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Stop services
docker-compose down
```

### Services

- **Backend** (http://localhost:8000): FastAPI + LangGraph AI agents
- **Frontend** (http://localhost:3000): React + TypeScript professional dashboard
- **PostgreSQL** (localhost:5432): User data and learning progress
- **Redis** (localhost:6379): Session management and caching

## 🔥 Hot-Reload Development

Code changes are reflected immediately without rebuilding containers:

### Backend (Python)
- Edit any `.py` file
- Uvicorn detects changes and reloads automatically (~1-2 seconds)
- No container restart needed

### Frontend (React)
- Edit React components, styles, or TypeScript files
- Hot Module Replacement (HMR) updates instantly
- Browser automatically refreshes

### When to Rebuild

Only rebuild when dependencies change:

```bash
# After modifying requirements.txt
docker-compose up -d --build backend

# After modifying package.json
docker-compose up -d --build frontend
```

## 📁 Project Structure

```
apps/base/
├── backend/
│   ├── agents/              # Multi-agent AI system
│   │   ├── coordinator.py
│   │   ├── educator_agent.py
│   │   ├── research_agent.py
│   │   ├── portfolio_agent.py
│   │   ├── trading_strategy_agent.py
│   │   ├── web_search_agent.py
│   │   ├── social_sentiment_agent.py  # Multi-platform sentiment analysis
│   │   ├── enhanced_langgraph_orchestrator.py
│   │   ├── tools/           # Agent tools and utilities
│   │   │   ├── blockchain_tools.py
│   │   │   ├── educational_tools.py
│   │   │   ├── social_sentiment_tools.py
│   │   │   ├── register_social_tools.py
│   │   │   └── tool_registry.py
│   │   ├── memory/          # AI memory systems
│   │   │   ├── episodic_memory.py
│   │   │   ├── long_term_memory.py
│   │   │   ├── procedural_memory.py
│   │   │   └── short_term_memory.py
│   │   └── context/         # Context management
│   │       ├── context_builder.py
│   │       └── user_state_tracker.py
│   ├── services/            # Business logic services
│   │   ├── openai_service.py
│   │   ├── token_service.py
│   │   ├── portfolio_simulator.py
│   │   ├── sentiment_service.py
│   │   ├── feedback_service.py
│   │   ├── tavily_service.py
│   │   ├── coingecko_service.py
│   │   ├── websocket_service.py
│   │   ├── wallet_auth_service.py
│   │   └── analytics_service.py
│   ├── blockchain/          # Base chain integration
│   │   └── base_client.py
│   ├── database/            # PostgreSQL models
│   │   └── connection.py
│   ├── models/              # Data models
│   │   └── schemas.py
│   ├── main.py              # FastAPI application
│   ├── requirements.txt     # Python dependencies
│   └── Dockerfile           # Multi-stage build
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   │   ├── ProfessionalDashboard.tsx
│   │   │   ├── TradingChart.tsx
│   │   │   ├── AIInsightsPanel.tsx
│   │   │   ├── TokenAnalysisView.tsx
│   │   │   ├── PortfolioView.tsx
│   │   │   ├── LearningView.tsx
│   │   │   ├── FeedbackBar.tsx
│   │   │   ├── EnhancedTokenSentiment.tsx
│   │   │   ├── MobileTokenFAB.tsx  # NEW: Mobile floating action button
│   │   │   ├── Leaderboard.tsx
│   │   │   ├── TrendingTopics.tsx
│   │   │   ├── PlatformStats.tsx
│   │   │   ├── CollapsiblePanel.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── pro/        # Professional features
│   │   │       ├── ProButton.tsx
│   │   │       └── ProInput.tsx
│   │   ├── hooks/           # Custom React hooks
│   │   │   ├── useChat.ts
│   │   │   ├── useTokenData.ts
│   │   │   ├── useFeedback.ts
│   │   │   ├── useAppreciation.ts
│   │   │   ├── useWalletTracking.ts
│   │   │   ├── useTokenWebSocket.ts
│   │   │   ├── usePortfolioWebSocket.ts
│   │   │   └── useMobile.ts
│   │   ├── contexts/        # Theme and state management
│   │   │   ├── ThemeContext.tsx
│   │   │   ├── SessionContext.tsx
│   │   │   └── NavigationContext.tsx
│   │   ├── services/        # API clients
│   │   │   └── api.ts
│   │   ├── utils/           # Utility functions
│   │   │   ├── minikit.ts
│   │   │   ├── basenameResolver.ts
│   │   │   └── zIndex.ts  # NEW: Centralized z-index management
│   │   ├── types/           # TypeScript definitions
│   │   │   ├── api.ts
│   │   │   ├── models.ts
│   │   │   └── websocket.ts
│   │   └── wagmi.ts         # Base wallet integration
│   ├── package.json         # Node dependencies
│   └── Dockerfile           # Multi-stage build
├── docker-compose.yml       # Development environment
├── COMPONENT_HIERARCHY_ANALYSIS.md  # NEW: UI debugging documentation
└── README.md                # This file
```

## 🧠 AI Architecture

### Multi-Agent System

Powered by LangGraph orchestrator:

- **Coordinator Agent**: Routes requests to specialist agents
- **Educator Agent**: Provides crypto education with EAILI5 personality
- **Research Agent**: Fetches real-time market data (Bitquery, Tavily)
- **Portfolio Agent**: Manages virtual portfolio simulations
- **Trading Strategy Agent**: Analyzes and explains trading strategies
- **Web Search Agent**: Real-time web search for latest crypto info
- **Social Sentiment Agent**: Multi-platform sentiment analysis (Reddit, News, CoinGecko)

### Memory Systems

- **Short-term**: Recent conversation context
- **Long-term**: User learning progress (PostgreSQL)
- **Episodic**: Specific learning experiences
- **Semantic**: Crypto concept relationships
- **Procedural**: Teaching methodologies

### Social Sentiment Analysis

Advanced multi-platform sentiment aggregation:

- **Reddit Integration**: Real-time sentiment from r/CryptoCurrency and crypto subreddits
- **News Sentiment**: Aggregated news sentiment from crypto publications
- **CoinGecko Social**: Social metrics and community sentiment scores
- **Causal Narratives**: AI-generated explanations of sentiment shifts
- **Anomaly Detection**: Identifies unusual social sentiment patterns
- **Time Series Analysis**: Tracks sentiment changes over time
- **Platform Correlation**: Compares sentiment across different sources

### Streaming Responses

Character-by-character streaming with agent status updates:
- "Coordinator routing to Research Agent..."
- "Researching Base DEX data..."
- "Social Sentiment Agent analyzing Reddit sentiment..."
- "Educator preparing explanation..."

## 🎨 Frontend Features

### Professional Trading Dashboard

Jupiter-inspired design with AI integration:

- **Live Token List**: Real-time Base tokens with price updates
- **TradingView Charts**: Interactive candlestick charts with timeframes
- **AI Insights Panel**: Streaming AI responses with agent status
- **Context-Aware Predictions**: Smart follow-up suggestions
- **Light/Dark Theme**: Professional theme toggle

### Enhanced Mobile Experience

**Thumb-Zone Optimized Design**:

- **MobileTokenFAB**: Floating action button positioned in thumb-zone for easy token list access
- **Touch-Optimized Interactions**: Enhanced touch targets and gesture support
- **Responsive Layout**: Adaptive design that works seamlessly across devices
- **Mobile-First Navigation**: Optimized navigation patterns for mobile users
- **Z-Index Management**: Centralized layering system preventing UI conflicts

**Z-Index Layering System**:

```typescript
export const Z_INDEX = {
  // Base layers
  base: 0,
  content: 1,
  
  // Navigation
  topBar: 10,
  footer: 10,
  feedbackBar: 10,
  fab: 50,
  
  // Overlays
  drawer: 100,
  drawerBackdrop: 99,
  mobileMenu: 101,
  
  // Modals
  modalBackdrop: 1000,
  modal: 1001,
  toast: 1100,
} as const;
```

### Social Sentiment Visualization

Advanced sentiment analysis display:

- **Multi-Platform Sentiment**: Reddit, News, CoinGecko sentiment aggregation
- **Sentiment Timeline**: Historical sentiment changes over time
- **Platform Breakdown**: Individual platform sentiment scores
- **Anomaly Detection**: Visual indicators for unusual sentiment patterns
- **Trending Topics**: Real-time social trending topics
- **Causal Narratives**: AI explanations of sentiment shifts

### Feedback & Appreciation System

User engagement and Base Batches compliance:

- **Thumbs Up/Down Feedback**: Simple rating system for AI responses
- **Text Feedback**: Optional detailed feedback for improvement
- **Optional Appreciation**: Send ETH to `stefo0.base.eth` (Base Batches requirement)
- **OnchainKit Integration**: Professional transaction UI with status tracking
- **Basename Resolution**: Uses `stefo0.base.eth` for recipient address
- **Transaction Logging**: Tracks appreciation transactions for analytics
- **Educational Value**: Teaches users about ETH transfers and gas fees

### Gamification & Social Features

Enhanced user engagement:

- **Leaderboard**: User rankings based on learning progress and achievements
- **Platform Statistics**: Social sentiment and engagement metrics
- **Achievement System**: Badges and milestones for learning progress
- **Learning Streaks**: Daily learning streak tracking
- **Progress Tracking**: Comprehensive learning analytics

### Hot Module Replacement (HMR)

- Instant component updates
- State preservation during reload
- CSS changes apply without refresh
- TypeScript type checking on save

### Component Hierarchy Debugging

**COMPONENT_HIERARCHY_ANALYSIS.md** provides comprehensive debugging documentation:

- **Layout Issue Detection**: Identifies common UI problems like overflow issues
- **Z-Index Conflicts**: Documents proper layering for complex UIs
- **Mobile Layout Optimization**: Guidelines for responsive design
- **Performance Insights**: Component rendering and state management patterns

## 🔧 Development Commands

```bash
# Working directory: apps/base/

# Start all services
docker-compose up -d

# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Check service health
docker-compose ps

# Restart a service
docker-compose restart backend

# Rebuild a service
docker-compose up -d --build backend

# Stop all services
docker-compose down

# Clean slate (remove volumes)
docker-compose down -v

# Run backend tests
docker-compose exec backend pytest

# Run frontend tests
docker-compose exec frontend npm test

# Access backend shell
docker-compose exec backend sh

# Access frontend shell
docker-compose exec frontend sh

# View database
docker-compose exec postgres psql -U eali5 -d eali5

# View Redis
docker-compose exec redis redis-cli
```

## 🧪 Testing

### Backend Tests

```bash
# Inside backend container
docker-compose exec backend pytest -v

# With coverage
docker-compose exec backend pytest --cov=. --cov-report=html

# Specific test file
docker-compose exec backend pytest tests/test_agents.py
```

### Frontend Tests

```bash
# Inside frontend container
docker-compose exec frontend npm test

# With coverage
docker-compose exec frontend npm test -- --coverage
```

### Integration Tests

```bash
# From apps/base/
docker-compose exec backend pytest tests/test_integration.py -v

# Or run full test suite
docker-compose exec backend pytest -v
docker-compose exec frontend npm test
```

## 🔐 Environment Variables

Required in `.env` file:

```bash
# API Keys
OPENAI_API_KEY=your_openai_api_key
BASE_RPC_URL=https://mainnet.base.org
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
BITQUERY_API_KEY=your_bitquery_api_key
TAVILY_API_KEY=your_tavily_api_key

# Social Sentiment APIs (Optional)
REDDIT_CLIENT_ID=your_reddit_client_id
REDDIT_CLIENT_SECRET=your_reddit_client_secret
NEYNAR_API_KEY=your_neynar_api_key  # For Farcaster (optional)

# Database (defaults work for local dev)
POSTGRES_DB=eali5
POSTGRES_USER=eali5
POSTGRES_PASSWORD=eali5_password
REDIS_URL=redis://localhost:6379

# Application Ports
BACKEND_PORT=8000
FRONTEND_PORT=3000
```

## 📦 Dependencies

### Backend Dependencies (Python)

**Core Framework**:
- `fastapi==0.104.1` - Web framework
- `uvicorn[standard]==0.24.0` - ASGI server
- `websockets==12.0` - WebSocket support

**AI & LangChain**:
- `openai==1.3.7` - OpenAI API client
- `langchain==0.0.350` - LangChain framework
- `langgraph==0.0.20` - LangGraph orchestration
- `tavily-python==0.3.0` - Web search API

**Social Sentiment Analysis** (NEW):
- `praw==7.7.1` - Reddit API client
- `textblob==0.17.1` - Enhanced sentiment analysis
- `vaderSentiment==3.3.2` - Crypto-optimized sentiment scoring

**Database & Caching**:
- `sqlalchemy==2.0.23` - ORM
- `asyncpg==0.29.0` - PostgreSQL async driver
- `redis==5.0.1` - Redis client

**Blockchain**:
- `web3==6.11.4` - Ethereum interaction
- `eth-account==0.9.0` - Account management

### Frontend Dependencies (Node.js)

**Core Framework**:
- `react==^18.2.0` - React framework
- `typescript==^5.0.4` - TypeScript support

**Base Ecosystem Integration**:
- `@coinbase/onchainkit==^0.38.0` - OnchainKit for transactions
- `@coinbase/wallet-sdk==^3.7.0` - Coinbase Wallet SDK
- `wagmi==^2.18.1` - React hooks for Ethereum
- `viem==^2.38.3` - TypeScript interface for Ethereum

**UI & Styling**:
- `tailwindcss==^3.3.0` - CSS framework
- `lucide-react==^0.294.0` - Icon library
- `framer-motion==^10.16.0` - Animation library

**Data & Charts**:
- `lightweight-charts==^5.0.9` - TradingView charts
- `recharts==^2.8.0` - React charts
- `@tanstack/react-query==^5.90.5` - Data fetching

**Utilities**:
- `react-hot-toast==^2.4.0` - Toast notifications
- `axios==^1.6.0` - HTTP client

## 🚢 Production Deployment

The application is currently deployed on Google Cloud Run:

- **Frontend**: https://base.explainailikeimfive.com
- **Backend API**: https://base-api.explainailikeimfive.com
- **Health Check**: https://base-api.explainailikeimfive.com/health

### Deployment Architecture

- **Frontend**: React SPA served via Cloud Run with Nginx
- **Backend**: FastAPI application with LangGraph AI agents
- **Database**: Cloud SQL PostgreSQL with Redis caching
- **Infrastructure**: Google Cloud Run with auto-scaling

For detailed deployment instructions, see the [Google Cloud Run documentation](https://cloud.google.com/run/docs).

## 📚 API Endpoints

### Backend API

#### Core Endpoints
- `GET /health` - Health check
- `GET /api/health` - Detailed health check with service status

#### Token & Market Data
- `GET /api/tokens` - List Base tokens with categories
- `GET /api/tokens/{address}` - Token details
- `GET /api/tokens/{address}/ohlc` - OHLC data for charts
- `GET /api/tokens/{address}/enhanced` - Enhanced token data
- `GET /api/tokens/{address}/sentiment` - Basic sentiment analysis
- `GET /api/tokens/{address}/social-sentiment` - Multi-platform sentiment
- `GET /api/tokens/{address}/sentiment-timeline` - Sentiment time series

#### Social Sentiment & Analytics
- `GET /api/social/trending-topics` - Trending social topics
- `GET /api/analytics/overview` - Platform analytics overview
- `GET /api/analytics/users` - User analytics
- `GET /api/analytics/content` - Content analytics
- `GET /api/analytics/tokens` - Token analytics

#### Portfolio & Trading
- `GET /api/portfolio/{user_id}` - User portfolio
- `POST /api/portfolio/simulate` - Simulate trade
- `POST /api/portfolio/{user_id}/trade` - Execute trade

#### Feedback & Appreciation
- `POST /api/appreciation/log` - Log appreciation transaction
- `GET /api/feedback/stats` - Feedback statistics
- `GET /api/feedback/{user_id}/history` - User feedback history

#### WebSocket Endpoints
- `WS /ws/chat/secure` - Secure AI chat WebSocket
- `WS /ws/tokens` - Real-time token updates
- `WS /ws/portfolio/{user_id}` - Portfolio updates

#### Wallet & Authentication
- `POST /api/wallet/connect` - Connect wallet
- `POST /api/wallet/disconnect` - Disconnect wallet
- `POST /api/wallet/verify` - Verify wallet signature
- `GET /api/wallet/session/{session_id}` - Get wallet session
- `POST /api/wallet/auth/token` - Generate auth token

#### Progress & Learning
- `GET /api/progress/{user_id}` - User progress
- `GET /api/progress/{user_id}/achievements` - User achievements
- `GET /api/progress/leaderboard` - Learning leaderboard
- `POST /api/progress/{user_id}/complete-lesson` - Complete lesson
- `GET /api/progress/{user_id}/recommendations` - Learning recommendations

#### Mini App Integration
- `GET /api/miniapp/manifest` - Mini app manifest
- `POST /api/miniapp/validate` - Validate manifest
- `GET /api/miniapp/config` - Mini app configuration

### WebSocket Protocol

```json
{
  "type": "chat",
  "message": "Explain what Base is",
  "streaming": true
}
```

Response types:
- `status` - Agent status update
- `chunk` - Character chunk for streaming
- `message` - Complete message
- `error` - Error message

## 🆕 Latest Features

### Enhanced Mobile UX & Production Security

**Mobile Experience Improvements**:

- **MobileTokenFAB Component**: Floating action button optimized for thumb-zone access
- **Z-Index Management**: Centralized layering system preventing UI conflicts
- **Touch-Optimized Interactions**: Enhanced mobile gesture support and responsive design
- **Component Hierarchy Analysis**: Comprehensive debugging documentation for UI issues

**Production Security Enhancements**:

- **Console.log Removal**: All debug logging removed from production code
- **Environment Variable Validation**: Comprehensive security audit passed
- **Google Cloud Secret Manager**: Proper integration with Coinbase API key secrets
- **No Secrets Exposed**: All sensitive data properly managed through environment variables

### Feedback & Appreciation System

**Base Batches Compliance**: Optional appreciation transactions to `stefo0.base.eth`

- **Simple Feedback**: Thumbs up/down rating system (no wallet required)
- **Text Feedback**: Optional detailed feedback for AI improvement
- **Optional Appreciation**: Send ETH to `stefo0.base.eth` using OnchainKit
- **Transaction Tracking**: Logs appreciation transactions for analytics
- **Educational Value**: Teaches users about ETH transfers and gas fees
- **Basename Integration**: Uses Base naming service for recipient address

**Technical Implementation**:
- OnchainKit Transaction components for professional UI
- PostgreSQL logging for feedback and appreciation tracking
- Redis caching for real-time feedback statistics
- WebSocket integration for live feedback updates

### Social Sentiment Analysis

**Multi-Platform Aggregation**: Reddit, News, CoinGecko sentiment analysis

- **Reddit Integration**: Real-time sentiment from r/CryptoCurrency
- **News Sentiment**: Aggregated sentiment from crypto publications
- **CoinGecko Social**: Community sentiment scores and social metrics
- **Causal Narratives**: AI-generated explanations of sentiment shifts
- **Anomaly Detection**: Identifies unusual social sentiment patterns
- **Time Series Analysis**: Tracks sentiment changes over time
- **Platform Correlation**: Compares sentiment across different sources

**Technical Implementation**:
- PRAW (Reddit API) for Reddit sentiment analysis
- TextBlob and VADER sentiment analysis for text processing
- Tavily API for news sentiment aggregation
- CoinGecko API for social metrics
- Real-time WebSocket updates for sentiment changes

### Enhanced UI Components

**Professional Dashboard Enhancements**:

- **Leaderboard**: User rankings based on learning progress and achievements
- **Trending Topics**: Real-time social trending topics visualization
- **Platform Statistics**: Social sentiment and engagement metrics
- **Enhanced Token Sentiment**: Multi-platform sentiment display
- **Collapsible Panels**: Improved UI organization
- **Mobile Optimization**: Responsive design with mobile detection
- **Footer Component**: Professional app footer with links

**New React Hooks**:
- `useFeedback`: Feedback submission and management
- `useAppreciation`: Appreciation transaction handling
- `useWalletTracking`: Wallet connection state tracking
- `useTokenWebSocket`: Real-time token data updates
- `usePortfolioWebSocket`: Real-time portfolio updates
- `useMobile`: Mobile device detection and optimization

### Real-Time Features

**WebSocket Integration**:
- Real-time token price updates
- Live portfolio simulation updates
- Streaming AI responses with agent status
- Live social sentiment updates
- Real-time feedback statistics

**Performance Optimizations**:
- Hot Module Replacement (HMR) for instant updates
- State preservation during component reloads
- Optimized WebSocket connections
- Efficient data caching with Redis

## 🐛 Troubleshooting

### Backend won't start

```bash
# Check logs
docker-compose logs backend

# Rebuild container
docker-compose up -d --build backend

# Check database connection
docker-compose exec backend python -c "from database.connection import get_db_session; print('DB OK')"
```

### Frontend won't start

```bash
# Check logs
docker-compose logs frontend

# Clear node_modules and rebuild
docker-compose down
docker-compose up -d --build frontend

# Check for port conflicts
netstat -ano | findstr :3000
```

### Hot-reload not working

```bash
# Verify volume mounts
docker-compose config

# Check environment variables
docker-compose exec frontend env | grep CHOKIDAR

# Restart service
docker-compose restart backend
docker-compose restart frontend
```

### Database issues

```bash
# Reset database
docker-compose down -v
docker-compose up -d postgres
docker-compose exec postgres psql -U eali5 -d eali5 -c "\dt"
```

## 🔒 Security & Base Batches Compliance

### Appreciation Address (`stefo0.base.eth`)

**Intentional Hardcoded Address**: `0x7897ee83FE2281d8780483A6E7bFD251d3152cF7`

This address is intentionally hardcoded for Base Batches submission requirements:

- **Purpose**: Optional appreciation transactions for Base Batches testnet requirement
- **Recipient**: `stefo0.base.eth` (resolves to the hardcoded address)
- **Use Case**: Educational ETH transfers on Base Sepolia testnet
- **Security**: Address is public by design (appreciation recipient)
- **Base Batches**: Satisfies testnet transaction requirement for submission

### Security Features

- **No Fund Custody**: App never holds user funds
- **Read-Only Wallet**: Only reads wallet state, never requests transactions
- **Optional Transactions**: Users choose whether to send appreciation
- **Testnet Focus**: Appreciation transactions use Base Sepolia testnet
- **Educational**: Teaches users about blockchain transactions safely

### Base Ecosystem Integration

- **Basename Resolution**: Uses Base naming service (`stefo0.base.eth`)
- **OnchainKit**: Professional transaction UI components
- **Wagmi**: Secure wallet connection management
- **Base Sepolia**: Testnet transactions for learning

## 🤝 Contributing

1. Create feature branch from `develop`
2. Make changes with hot-reload for rapid iteration
3. Test locally: `docker-compose up -d`
4. Run tests: Backend `pytest`, Frontend `npm test`
5. Create PR to `develop`
6. GitHub Actions will validate

## 📄 License

Part of the EAILI5 ecosystem. See main repository for licensing information.

---

**Need help?** Check the main repository README or open an issue.
