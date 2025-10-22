# EAILI5 Base Mini App - Deployment Guide

Complete guide for deploying EAILI5 to Google Cloud Run with custom domain integration.

## 📋 Prerequisites

### Required Tools
- [Google Cloud SDK (gcloud CLI)](https://cloud.google.com/sdk/docs/install) - Already installed ✓
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) - For local testing
- [Node.js 22+](https://nodejs.org/) and npm
- [Python 3.11+](https://www.python.org/downloads/)
- [Git](https://git-scm.com/) and GitHub account

### Google Cloud Setup
- Access to `eaili5` GCP project ✓
- Billing enabled on the project ✓
- Sufficient permissions (Owner/Editor role) ✓
- **Current Status**: Production deployment active

### Base Requirements (for Base Batches submission)
- Farcaster account with stefo0.base.eth ✓
- Access to https://base.dev for manifest signing ✓
- Base Sepolia testnet ETH for testing (pending user action)
- WalletConnect Project ID ✓ (configured in Secret Manager)

---

## 🚀 Quick Start Deployment

### 1. Clone and Setup

```powershell
# Clone repository (or use existing)
cd apps/base

# Copy environment template
Copy-Item .env.example .env

# Edit .env with your actual API keys
notepad .env
```

### 2. Configure Environment Variables

Edit `.env` file:

```env
# Required API Keys
OPENAI_API_KEY=sk-...
TAVILY_API_KEY=tvly-...
BITQUERY_API_KEY=...
REACT_APP_WALLET_CONNECT_PROJECT_ID=...

# Production URLs (will be set after first deployment)
REACT_APP_API_URL=https://base-api.explainailikeimfive.com
REACT_APP_WS_URL=wss://base-api.explainailikeimfive.com
```

### 3. Switch to eaili5 Project

```powershell
gcloud config set project eaili5
gcloud config get-value project  # Verify
```

### 4. Deploy with Script

```powershell
# Deploy both backend and frontend
./deploy-gcloud.ps1

# Or deploy individually
./deploy-gcloud.ps1 -BackendOnly
./deploy-gcloud.ps1 -FrontendOnly

# Skip tests (faster, use with caution)
./deploy-gcloud.ps1 -SkipTests
```

---

## 🔧 Manual Deployment Steps

### Backend Deployment

1. **Setup Google Cloud Secrets** (first time only)

```powershell
# Create secrets from .env file
echo $env:OPENAI_API_KEY | gcloud secrets create openai-api-key --data-file=- --project=eaili5
echo $env:TAVILY_API_KEY | gcloud secrets create tavily-api-key --data-file=- --project=eaili5
echo $env:BITQUERY_API_KEY | gcloud secrets create bitquery-api-key --data-file=- --project=eaili5

# Grant Cloud Run access to secrets
$PROJECT_NUMBER = gcloud projects describe eaili5 --format="value(projectNumber)"
gcloud secrets add-iam-policy-binding openai-api-key `
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" `
  --role="roles/secretmanager.secretAccessor"
```

2. **Deploy Backend**

```powershell
cd backend
gcloud builds submit --config cloudbuild.yaml --project=eaili5
cd ..
```

3. **Get Backend URL**

```powershell
$BACKEND_URL = gcloud run services describe eaili5-base-backend `
  --region=us-central1 --format="value(status.url)" --project=eaili5
Write-Host "Backend URL: $BACKEND_URL"
```

### Frontend Deployment

1. **Update Frontend Build Config**

Edit `frontend/cloudbuild.yaml` and set `_BACKEND_URL` substitution:

```yaml
substitutions:
  _BACKEND_URL: 'https://eaili5-base-backend-XXXXX-uc.a.run.app'
  _BACKEND_WS_URL: 'wss://eaili5-base-backend-XXXXX-uc.a.run.app'
```

2. **Deploy Frontend**

```powershell
cd frontend
gcloud builds submit --config cloudbuild.yaml --project=eaili5
cd ..
```

---

## 🌐 Custom Domain Configuration

### 1. Map Domains to Cloud Run

```powershell
# Map backend API subdomain
gcloud run domain-mappings create `
  --service eaili5-base-backend `
  --domain base-api.explainailikeimfive.com `
  --region us-central1 `
  --project eaili5

# Map frontend subdomain
gcloud run domain-mappings create `
  --service eaili5-base-frontend `
  --domain base.explainailikeimfive.com `
  --region us-central1 `
  --project eaili5
```

### 2. Update DNS Records

Add these CNAME records in your domain registrar (e.g., Google Domains, Cloudflare):

| Type  | Name                | Value                  | TTL  |
|-------|---------------------|------------------------|------|
| CNAME | base                | ghs.googlehosted.com   | 300  |
| CNAME | base-api            | ghs.googlehosted.com   | 300  |

**DNS Propagation**: Wait 5-60 minutes for DNS to propagate globally.

### 3. Verify SSL Certificate

```powershell
# Check domain mapping status
gcloud run domain-mappings describe base.explainailikeimfive.com `
  --region us-central1 --project=eaili5

# SSL certificates are automatically provisioned by Google
```

---

## 🗄️ Database & Redis Setup

### Option 1: Cloud SQL (PostgreSQL) - Recommended for Production

```powershell
# Create Cloud SQL instance
gcloud sql instances create eaili5-db `
  --database-version=POSTGRES_15 `
  --tier=db-f1-micro `
  --region=us-central1 `
  --project=eaili5

# Create database
gcloud sql databases create eali5 --instance=eaili5-db --project=eaili5

# Set root password
gcloud sql users set-password postgres `
  --instance=eaili5-db `
  --password=YOUR_SECURE_PASSWORD `
  --project=eaili5

# Get connection name
gcloud sql instances describe eaili5-db `
  --format="value(connectionName)" `
  --project=eaili5
# Output: eaili5:us-central1:eaili5-db

# Store in Secret Manager
$DB_URL = "postgresql://postgres:YOUR_PASSWORD@/eali5?host=/cloudsql/eaili5:us-central1:eaili5-db"
echo $DB_URL | gcloud secrets create database-url --data-file=- --project=eaili5
```

### Option 2: Memorystore (Redis)

```powershell
# Create Redis instance
gcloud redis instances create eaili5-redis `
  --size=1 `
  --region=us-central1 `
  --redis-version=redis_7_0 `
  --project=eaili5

# Get Redis host
gcloud redis instances describe eaili5-redis `
  --region=us-central1 `
  --format="value(host)" `
  --project=eaili5

# Store in Secret Manager
$REDIS_URL = "redis://REDIS_HOST:6379"
echo $REDIS_URL | gcloud secrets create redis-url --data-file=- --project=eaili5
```

---

## 🎯 Base Batches Submission Checklist

### Required Components

- [x] **Functioning onchain app** - Deployed at https://base.explainailikeimfive.com
- [x] **Open-source GitHub repository** - Public repo with source code
- [ ] **Demo video (1+ minutes)** - Intro, Demo, Problem, Solution, Architecture
- [ ] **Base testnet transactions** - Proof of 1+ transactions on Base Sepolia
- [x] **Basenames integration** - WalletButton component with OnchainKit
- [x] **Base Account (Smart Wallet)** - Coinbase Wallet with smartWalletOnly
- [ ] **Signed farcaster.json** - Manifest signed at https://base.dev

### Farcaster Manifest Signing

1. Visit https://base.dev and sign in with stefo0.base.eth
2. Navigate to **Preview → Account Association**
3. Enter Mini App domain: `base.explainailikeimfive.com`
4. Sign the message in your Coinbase Wallet
5. Copy the generated `accountAssociation` object
6. Update `frontend/public/.well-known/farcaster.json`:

```json
{
  "accountAssociation": {
    "header": "PASTE_HEADER_HERE",
    "payload": "PASTE_PAYLOAD_HERE",
    "signature": "PASTE_SIGNATURE_HERE"
  },
  // ... rest of manifest
}
```

7. Redeploy frontend: `cd frontend && gcloud builds submit --config cloudbuild.yaml`

### Base Sepolia Testnet Testing

1. Get testnet ETH from faucet:
   - https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet
   - Or https://faucet.quicknode.com/base/sepolia

2. Connect wallet to app at https://base.explainailikeimfive.com

3. Switch network to Base Sepolia in Coinbase Wallet

4. Perform test transactions (e.g., portfolio trades)

5. Record transaction hash from Base Sepolia explorer:
   - https://sepolia.basescan.org/

6. Save transaction proof for Base Batches submission

---

## 🧪 Testing Deployment

### Local Testing Before Deployment

```powershell
# Start local environment
docker-compose up -d

# Run tests
docker-compose exec backend pytest -v
docker-compose exec frontend npm test

# Test WebSocket connections
# Visit http://localhost:3000 and try chat functionality
```

### Production Smoke Tests

After deployment, verify:

1. **Frontend Loads**: Visit https://base.explainailikeimfive.com
2. **API Health**: `curl https://base-api.explainailikeimfive.com/health`
3. **WebSocket Chat**: Test AI chat functionality
4. **Wallet Connection**: Connect Coinbase Wallet
5. **Token Data**: Verify token list loads from Base DEX
6. **Portfolio Simulator**: Test virtual trades

---

## 🔒 Security Best Practices

### API Key Management

- ✅ Store all secrets in Google Cloud Secret Manager
- ✅ Never commit `.env` files to Git
- ✅ Rotate API keys after any exposure
- ✅ Use separate keys for dev/staging/prod

### Cloud Run Security

```powershell
# Set minimum instances to 0 for cost savings (cold starts acceptable)
gcloud run services update eaili5-base-frontend `
  --min-instances=0 `
  --region=us-central1

# Set maximum instances to prevent runaway costs
gcloud run services update eaili5-base-backend `
  --max-instances=10 `
  --region=us-central1

# Enable CPU throttling (save costs)
gcloud run services update eaili5-base-backend `
  --cpu-throttling `
  --region=us-central1
```

---

## 📊 Monitoring & Logs

### View Logs

```powershell
# Backend logs
gcloud run services logs read eaili5-base-backend `
  --region=us-central1 --limit=50 --project=eaili5

# Frontend logs
gcloud run services logs read eaili5-base-frontend `
  --region=us-central1 --limit=50 --project=eaili5

# Stream live logs
gcloud run services logs tail eaili5-base-backend `
  --region=us-central1 --project=eaili5
```

### Cloud Console

- **Logs Explorer**: https://console.cloud.google.com/logs
- **Cloud Run Services**: https://console.cloud.google.com/run
- **Secret Manager**: https://console.cloud.google.com/security/secret-manager

---

## 🐛 Troubleshooting

### Build Fails

```powershell
# Check Cloud Build logs
gcloud builds list --limit=5 --project=eaili5

# View specific build
gcloud builds log BUILD_ID --project=eaili5
```

### Service Won't Start

```powershell
# Check service status
gcloud run services describe eaili5-base-backend `
  --region=us-central1 --project=eaili5

# View recent logs
gcloud run services logs read eaili5-base-backend `
  --region=us-central1 --limit=100 --project=eaili5
```

### DNS Not Resolving

```powershell
# Check domain mapping
gcloud run domain-mappings describe base.explainailikeimfive.com `
  --region=us-central1 --project=eaili5

# Verify DNS propagation
nslookup base.explainailikeimfive.com
```

### Secret Access Errors

```powershell
# Verify service account has access
gcloud secrets get-iam-policy openai-api-key --project=eaili5

# Grant access if missing
$PROJECT_NUMBER = gcloud projects describe eaili5 --format="value(projectNumber)"
gcloud secrets add-iam-policy-binding openai-api-key `
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" `
  --role="roles/secretmanager.secretAccessor" `
  --project=eaili5
```

---

## 💰 Cost Optimization

### Expected Monthly Costs (Base Tier)

- Cloud Run (Backend): ~$10-30/month
- Cloud Run (Frontend): ~$5-15/month
- Cloud SQL (db-f1-micro): ~$7/month
- Memorystore Redis (1GB): ~$30/month
- **Total**: ~$52-82/month

### Cost Reduction Tips

1. Use Cloud Run min-instances=0 (accept cold starts)
2. Enable CPU throttling
3. Use Cloud SQL serverless tier
4. Consider external Redis (e.g., Upstash free tier)
5. Set budget alerts in GCP console

---

## 📚 Additional Resources

- [Base Documentation](https://docs.base.org/)
- [Base Batches Builder Track](https://base-batches-builder-track.devfolio.co/overview)
- [OnchainKit Documentation](https://onchainkit.xyz/)
- [Google Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Cloud SQL Documentation](https://cloud.google.com/sql/docs)

---

**Ready to deploy?** Run `./deploy-gcloud.ps1` and follow the prompts!

For issues or questions, check [TROUBLESHOOTING.md](./frontend/TROUBLESHOOTING.md) or open a GitHub issue.

