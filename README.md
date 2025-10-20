# EAILI5 Base Mini App

[![Base Batches 002](https://img.shields.io/badge/Base%20Batches-002-blue)](https://base-batches-builder-track.devfolio.co/)
[![Built on Base](https://img.shields.io/badge/Built%20on-Base-blue)](https://base.org)
[![Deployed on Google Cloud](https://img.shields.io/badge/Deployed%20on-Google%20Cloud-4285F4)](https://cloud.google.com)

AI-powered crypto education platform built on Base L2. Uses multi-agent AI system to teach crypto newcomers through real-time DEX data analysis, risk-free portfolio simulation, and conversational learning.

## 🏆 Base Batches 002 Submission

- ✅ **Functioning onchain app** - Deployed at https://base.explainailikeimfive.com
- ✅ **Open-source repository** - Complete source code available
- ✅ **Base Sepolia deployment** - Tested on testnet with transaction proof
- ✅ **Smart Wallet integration** - Coinbase Wallet with smartWalletOnly preference
- ✅ **Basenames support** - OnchainKit integration for Base naming service
- ⏳ **Demo video** - 1-minute walkthrough (link TBD)
- ⏳ **Farcaster manifest** - Signed at base.dev (pending user signature)

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
│   │   ├── coordinator_agent.py
│   │   ├── educator_agent.py
│   │   ├── research_agent.py
│   │   ├── portfolio_agent.py
│   │   └── enhanced_langgraph_orchestrator.py
│   ├── services/            # Business logic
│   │   ├── openai_service.py
│   │   ├── token_service.py
│   │   └── portfolio_service.py
│   ├── blockchain/          # Base chain integration
│   ├── database/            # PostgreSQL models
│   ├── main.py              # FastAPI application
│   ├── requirements.txt     # Python dependencies
│   └── Dockerfile           # Multi-stage build
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   │   ├── ProfessionalDashboard.tsx
│   │   │   ├── TradingChart.tsx
│   │   │   ├── AIInsightsPanel.tsx
│   │   │   └── AgentStatus.tsx
│   │   ├── hooks/           # Custom React hooks
│   │   │   ├── useChat.ts
│   │   │   └── useTokenData.ts
│   │   ├── contexts/        # Theme and state management
│   │   └── wagmi.ts         # Base wallet integration
│   ├── package.json         # Node dependencies
│   └── Dockerfile           # Multi-stage build
├── docker-compose.yml       # Development environment
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

### Memory Systems

- **Short-term**: Recent conversation context
- **Long-term**: User learning progress (PostgreSQL)
- **Episodic**: Specific learning experiences
- **Semantic**: Crypto concept relationships
- **Procedural**: Teaching methodologies

### Streaming Responses

Character-by-character streaming with agent status updates:
- "Coordinator routing to Research Agent..."
- "Researching Base DEX data..."
- "Educator preparing explanation..."

## 🎨 Frontend Features

### Professional Trading Dashboard

Jupiter-inspired design with AI integration:

- **Live Token List**: Real-time Base tokens with price updates
- **TradingView Charts**: Interactive candlestick charts with timeframes
- **AI Insights Panel**: Streaming AI responses with agent status
- **Context-Aware Predictions**: Smart follow-up suggestions
- **Light/Dark Theme**: Professional theme toggle

### Hot Module Replacement (HMR)

- Instant component updates
- State preservation during reload
- CSS changes apply without refresh
- TypeScript type checking on save

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
BITQUERY_API_KEY=your_bitquery_api_key
TAVILY_API_KEY=your_tavily_api_key

# Database (defaults work for local dev)
POSTGRES_DB=eali5
POSTGRES_USER=eali5
POSTGRES_PASSWORD=eali5_password

# Application Ports
BACKEND_PORT=8000
FRONTEND_PORT=3000
```

## 🚢 Production Deployment (Google Cloud Run)

### Quick Deploy

```powershell
# Navigate to Base Mini App directory
cd apps/base

# Deploy both backend and frontend
./deploy-gcloud.ps1
```

### Prerequisites

- Google Cloud SDK (gcloud CLI) installed
- Access to `eaili5` GCP project
- API keys configured in `.env` file

### Deployment Steps

1. **Setup Environment**
   ```powershell
   # Copy environment template
   Copy-Item .env.example .env
   
   # Edit with your API keys
   notepad .env
   ```

2. **Configure Secrets**
   ```powershell
   # Setup Google Cloud Secret Manager
   # See SECRETS_SETUP.md for details
   ./setup-secrets.ps1
   ```

3. **Deploy Services**
   ```powershell
   # Switch to eaili5 project
   gcloud config set project eaili5
   
   # Deploy with script
   ./deploy-gcloud.ps1
   ```

4. **Configure Custom Domains**
   ```powershell
   # Map domains to Cloud Run services
   gcloud run domain-mappings create \
     --service eaili5-base-frontend \
     --domain base.explainailikeimfive.com \
     --region us-central1
   
   gcloud run domain-mappings create \
     --service eaili5-base-backend \
     --domain base-api.explainailikeimfive.com \
     --region us-central1
   ```

### Production URLs

- **Frontend**: https://base.explainailikeimfive.com
- **Backend API**: https://base-api.explainailikeimfive.com
- **Health Check**: https://base-api.explainailikeimfive.com/health

### Detailed Guides

- [DEPLOYMENT.md](./DEPLOYMENT.md) - Complete deployment guide
- [SECURITY.md](./SECURITY.md) - Security best practices
- [SECRETS_SETUP.md](./SECRETS_SETUP.md) - Secret Manager configuration
- [TESTNET_DEPLOYMENT.md](./TESTNET_DEPLOYMENT.md) - Base Sepolia testing
- [INFRASTRUCTURE.md](./INFRASTRUCTURE.md) - Architecture overview

## 📚 API Endpoints

### Backend API

- `GET /health` - Health check
- `GET /api/tokens` - List Base tokens
- `GET /api/tokens/{address}` - Token details
- `WS /ws/chat/{user_id}` - AI chat WebSocket
- `GET /api/portfolio/{user_id}` - User portfolio
- `POST /api/portfolio/{user_id}/trade` - Execute trade

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
