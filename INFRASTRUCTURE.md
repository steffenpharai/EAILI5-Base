# Infrastructure Architecture

EAILI5 Base Mini App infrastructure on Google Cloud Platform (eaili5 project).

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                        USERS / BROWSERS                          │
│                                                                 │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           │ HTTPS
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                     GOOGLE CLOUD CDN                             │
│             (Automatic with Cloud Run domains)                   │
│                                                                 │
└──────────────────────────┬──────────────────────────────────────┘
                           │
        ┌──────────────────┴──────────────────┐
        │                                     │
        ▼                                     ▼
┌───────────────────┐                 ┌───────────────────┐
│  Cloud Run        │                 │  Cloud Run        │
│  Frontend         │                 │  Backend          │
│                   │                 │                   │
│  React + Nginx    │◄───────────────►│  FastAPI + Python │
│  Port 80          │    WebSocket    │  Port 8000        │
│                   │    HTTP/REST    │                   │
└───────────────────┘                 └─────────┬─────────┘
                                                │
                           ┌────────────────────┼────────────────────┐
                           │                    │                    │
                           ▼                    ▼                    ▼
                  ┌────────────────┐   ┌────────────────┐  ┌─────────────────┐
                  │  Cloud SQL     │   │  Memorystore   │  │ Secret Manager  │
                  │  PostgreSQL 15 │   │  Redis 7       │  │                 │
                  │                │   │                │  │  API Keys       │
                  │  User Data     │   │  Sessions      │  │  DB Credentials │
                  │  Learning      │   │  Cache         │  │                 │
                  └────────────────┘   └────────────────┘  └─────────────────┘
```

---

## Components

### 1. Cloud Run Services

#### Frontend Service
- **Name**: `eaili5-base-frontend`
- **Region**: us-central1
- **Image**: `gcr.io/eaili5/eaili5-base-frontend:latest`
- **Port**: 80 (nginx)
- **Memory**: 512 MB
- **CPU**: 1
- **Min Instances**: 0 (cost-effective)
- **Max Instances**: 10
- **Domain**: https://base.explainailikeimfive.com

**Purpose**: Serves React SPA, static assets, handles routing

#### Backend Service
- **Name**: `eaili5-base-backend`
- **Region**: us-central1
- **Image**: `gcr.io/eaili5/eaili5-base-backend:latest`
- **Port**: 8000 (uvicorn)
- **Memory**: 2 GB
- **CPU**: 2
- **Min Instances**: 1 (keep warm for WebSocket)
- **Max Instances**: 10
- **Domain**: https://base-api.explainailikeimfive.com

**Purpose**: FastAPI REST API, WebSocket server, AI orchestration

---

### 2. Database Layer

#### Cloud SQL (PostgreSQL 15)
- **Instance Name**: `eaili5-db`
- **Tier**: db-f1-micro (upgradeable)
- **Storage**: 10 GB SSD (auto-scaling)
- **Region**: us-central1
- **Backups**: Daily at 3:00 AM UTC
- **Connection**: Cloud SQL Proxy

**Schema**:
```sql
-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    wallet_address VARCHAR(42) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    last_active TIMESTAMP
);

-- Learning progress
CREATE TABLE user_progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    topic VARCHAR(100),
    completed BOOLEAN DEFAULT FALSE,
    score INTEGER,
    timestamp TIMESTAMP DEFAULT NOW()
);

-- Portfolio simulator
CREATE TABLE portfolios (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    balance DECIMAL(18, 8) DEFAULT 100.00,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Sessions
CREATE TABLE sessions (
    id VARCHAR(64) PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    data JSONB,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### Memorystore Redis
- **Instance Name**: `eaili5-redis`
- **Tier**: Basic (1 GB)
- **Version**: Redis 7.0
- **Region**: us-central1
- **Network**: Default VPC

**Usage**:
- Session storage (short-term)
- API response caching
- Rate limiting counters
- WebSocket connection tracking

---

### 3. Security & Secrets

#### Secret Manager
Stores sensitive credentials:

| Secret Name | Purpose | Rotation |
|-------------|---------|----------|
| `openai-api-key` | AI chat functionality | 90 days |
| `tavily-api-key` | Web search | 90 days |
| `bitquery-api-key` | DEX data | 90 days |
| `database-url` | Cloud SQL connection | 180 days |
| `redis-url` | Memorystore connection | Never (internal) |
| `walletconnect-project-id` | Wallet integration | Never |

**Access Control**:
- Secrets accessible only by Cloud Run service accounts
- IAM role: `roles/secretmanager.secretAccessor`
- Audit logging enabled

---

### 4. Networking

#### VPC & Firewall
- **VPC**: Default (auto-mode)
- **Subnet**: us-central1 (10.128.0.0/20)
- **Firewall**: Cloud Run managed (allow ingress from internet)

#### DNS Configuration

| Record Type | Name | Value | TTL |
|-------------|------|-------|-----|
| CNAME | base | ghs.googlehosted.com | 300 |
| CNAME | base-api | ghs.googlehosted.com | 300 |

**Domain**: explainailikeimfive.com (managed externally)

#### SSL/TLS
- **Provider**: Google-managed SSL certificates
- **Auto-renewal**: Yes
- **Protocol**: TLS 1.2, TLS 1.3
- **HTTP → HTTPS**: Automatic redirect

---

### 5. Container Registry

#### Google Container Registry (GCR)
- **Location**: us.gcr.io/eaili5
- **Images**:
  - `eaili5-base-frontend:latest`
  - `eaili5-base-frontend:{GIT_SHA}`
  - `eaili5-base-backend:latest`
  - `eaili5-base-backend:{GIT_SHA}`

**Retention**: Keep last 10 versions per image

---

### 6. CI/CD Pipeline

#### Cloud Build
- **Trigger**: Manual via `gcloud builds submit`
- **Config**: `cloudbuild.yaml` per service
- **Steps**:
  1. Build Docker image
  2. Push to GCR
  3. Deploy to Cloud Run
  4. Run health checks

**Build Time**:
- Frontend: ~5-8 minutes
- Backend: ~3-5 minutes

---

### 7. Monitoring & Logging

#### Cloud Logging
- **Retention**: 30 days
- **Log Types**:
  - Request logs (frontend/backend)
  - Application logs (console.log, logger)
  - Error logs (exceptions, crashes)
  - Audit logs (Secret Manager access)

#### Cloud Monitoring
- **Metrics Collected**:
  - Request count
  - Request latency (p50, p95, p99)
  - Error rate
  - CPU utilization
  - Memory utilization
  - Active WebSocket connections

#### Alerts (Recommended Setup)
```powershell
# Create alert policy for high error rate
gcloud alpha monitoring policies create `
  --notification-channels=CHANNEL_ID `
  --display-name="High Error Rate - Backend" `
  --condition-display-name="Error rate > 5%" `
  --condition-threshold-value=0.05 `
  --condition-threshold-duration=300s
```

---

## Deployment Flow

```
Developer
    │
    ▼
Local Changes
    │
    ▼
Git Commit
    │
    ▼
gcloud builds submit
    │
    ├─► Build Docker Image
    │   (Cloud Build)
    │
    ├─► Push to GCR
    │   (Container Registry)
    │
    └─► Deploy to Cloud Run
        (Rolling Update)
        │
        ├─► Health Check
        │
        ├─► Route Traffic
        │   (Gradual rollout)
        │
        └─► Deployment Complete
            (Old revision decommissioned)
```

---

## Scaling & Performance

### Auto-Scaling
- **Frontend**: 0-10 instances
  - Scales to 0 when idle (cold start: ~2-3s)
  - Each instance handles ~100 concurrent requests

- **Backend**: 1-10 instances
  - Min 1 instance (warm for WebSocket)
  - Each instance handles ~80 concurrent requests
  - Scales based on CPU/memory utilization

### Performance Targets
- **P95 Latency**: < 500ms
- **P99 Latency**: < 1000ms
- **Availability**: 99.5% (Cloud Run SLA: 99.95%)
- **WebSocket Connections**: Up to 1000 concurrent

---

## Cost Estimation

### Monthly Costs (Projected)

| Service | Configuration | Est. Cost |
|---------|--------------|-----------|
| Cloud Run (Frontend) | 512MB, 0-10 instances | $5-15 |
| Cloud Run (Backend) | 2GB, 1-10 instances | $20-40 |
| Cloud SQL | db-f1-micro, 10GB | $7 |
| Memorystore Redis | Basic 1GB | $30 |
| Container Registry | 10GB storage | $0.26 |
| Cloud Build | ~20 builds/month | $2 |
| Egress | 10GB/month | $1.20 |
| **Total** | | **$65-95/month** |

### Cost Optimization Tips
1. Set min-instances=0 for frontend (accept cold starts)
2. Use shared-core machine types for Cloud SQL
3. Enable CPU throttling on backend
4. Implement aggressive caching with Redis
5. Use CDN for static assets

---

## Disaster Recovery

### Backup Strategy

#### Database Backups
- **Frequency**: Daily at 3:00 AM UTC
- **Retention**: 7 days
- **Location**: us-central1
- **Type**: Automated (Cloud SQL)

#### Configuration Backups
- **Code**: Git repository (GitHub)
- **Secrets**: Offline encrypted backup
- **Infrastructure as Code**: cloudbuild.yaml files

### Recovery Procedures

#### Database Restoration
```powershell
# List backups
gcloud sql backups list --instance=eaili5-db

# Restore from backup
gcloud sql backups restore BACKUP_ID `
  --backup-instance=eaili5-db `
  --backup-instance=eaili5-db
```

#### Service Rollback
```powershell
# List revisions
gcloud run revisions list --service=eaili5-base-backend --region=us-central1

# Rollback to previous revision
gcloud run services update-traffic eaili5-base-backend `
  --to-revisions=REVISION_NAME=100 `
  --region=us-central1
```

---

## Security Architecture

### Network Security
- Cloud Run services only accessible via HTTPS
- Internal VPC for database/Redis communication
- No public IPs for database instances

### Application Security
- CORS restricted to allowed origins
- Rate limiting on API endpoints
- Input validation and sanitization
- SQL injection prevention (parameterized queries)

### Secrets Management
- Zero secrets in code or environment variables
- All secrets in Secret Manager
- Automatic rotation reminders
- Access logging enabled

---

## Future Enhancements

### Planned Improvements
1. **Cloud CDN**: Enable for static assets
2. **Cloud Armor**: DDoS protection and WAF
3. **Load Balancer**: Geographic distribution
4. **Cloud Tasks**: Async job processing
5. **Pub/Sub**: Event-driven architecture
6. **Firestore**: Alternative to PostgreSQL for certain data

### Scalability Roadmap
- **Current**: Handles ~1000 concurrent users
- **Phase 2**: 10,000 concurrent users (horizontal scaling)
- **Phase 3**: Multi-region deployment
- **Phase 4**: Edge computing with Cloud CDN

---

## Maintenance Windows

### Scheduled Maintenance
- **Database**: Sundays 3:00-4:00 AM UTC
- **Cloud Run**: Rolling updates (zero downtime)
- **Redis**: No scheduled maintenance

### Update Policy
- Security patches: Immediate
- Minor updates: Weekly
- Major updates: Monthly (with testing)

---

## Resources

- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Cloud SQL Documentation](https://cloud.google.com/sql/docs)
- [Memorystore Documentation](https://cloud.google.com/memorystore/docs/redis)
- [Secret Manager Documentation](https://cloud.google.com/secret-manager/docs)

---

**Architecture Version**: 1.0  
**Last Updated**: October 2025  
**Next Review**: January 2026

