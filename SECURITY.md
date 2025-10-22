# Security Policy

## Overview

EAILI5 Base Mini App follows security best practices for handling sensitive data, API keys, and user information in compliance with Base Batches requirements and GDPR/CCPA regulations.

## Reporting Security Vulnerabilities

If you discover a security vulnerability, please report it responsibly:

- **Email**: security@explainailikeimfive.com
- **GitHub**: Create a private security advisory at https://github.com/steffenpharai/EAILI5-Base/security/advisories
- **Response Time**: We aim to respond within 48 hours
- **PGP Key**: Available upon request for sensitive communications

**Please do NOT** create public GitHub issues for security vulnerabilities.

---

## Security Measures

### 1. API Key Management

#### Google Cloud Secret Manager
All production secrets are stored in Google Cloud Secret Manager:

```powershell
# Never hardcode - always use Secret Manager
gcloud secrets create openai-api-key --data-file=- --project=eaili5
gcloud secrets create tavily-api-key --data-file=- --project=eaili5
```

#### Environment Variables
- ✅ Use `.env.example` as template only (no real keys)
- ✅ Add `.env` to `.gitignore`
- ✅ Never commit API keys to version control
- ✅ Rotate keys immediately if exposed

###  API Key Rotation Procedure

If an API key is compromised:

1. **Immediately revoke** the exposed key from the provider dashboard
2. **Generate new key** from provider
3. **Update Secret Manager**:
   ```powershell
   echo NEW_KEY | gcloud secrets versions add openai-api-key --data-file=-
   ```
4. **Redeploy services**:
   ```powershell
   ./deploy-gcloud.ps1
   ```
5. **Verify** old key no longer works

---

### 2. Cloud Run Security

#### Service Account Permissions

Use principle of least privilege:

```powershell
# Grant only necessary permissions
gcloud secrets add-iam-policy-binding SECRET_NAME `
  --member="serviceAccount:SERVICE_ACCOUNT" `
  --role="roles/secretmanager.secretAccessor"
```

#### Network Security

- ✅ HTTPS only (enforced by Cloud Run)
- ✅ Automatic SSL certificate provisioning
- ✅ DDoS protection via Google infrastructure
- ✅ CORS configured for specific origins only

#### Authentication & Authorization

```python
# Backend CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://base.explainailikeimfive.com",
        "http://localhost:3000"  # Dev only
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

### 3. Database Security

#### Cloud SQL

```powershell
# Use Cloud SQL Proxy for secure connections
gcloud sql connect eaili5-db --user=postgres --project=eaili5

# Enable automatic backups
gcloud sql instances patch eaili5-db `
  --backup-start-time=03:00 `
  --enable-bin-log `
  --project=eaili5

# Restrict network access
gcloud sql instances patch eaili5-db `
  --authorized-networks=0.0.0.0/0 `  # Cloud Run only
  --project=eaili5
```

#### Redis (Memorystore)

- ✅ Private IP only (not publicly accessible)
- ✅ VPC peering for secure access
- ✅ No authentication required (private network)

---

### 4. Blockchain & Wallet Security

#### Read-Only Operations

EAILI5 **never**:
- ❌ Stores private keys
- ❌ Custodies user funds
- ❌ Executes real blockchain transactions on behalf of users
- ❌ Requests seed phrases

#### Wallet Integration

- ✅ Uses Coinbase Smart Wallet (Base recommended)
- ✅ WalletConnect for secure connection
- ✅ Read-only access to wallet address
- ✅ Users control all transactions

```typescript
// Wallet configuration (wagmi.ts)
coinbaseWallet({
  appName: 'EAILI5',
  preference: 'smartWalletOnly',  // Base requirement
  version: '4',
})
```

---

### 5. Data Privacy (GDPR/CCPA Compliance)

#### User Data Collection

We collect minimal data:
- Wallet address (public information)
- Learning progress and quiz scores
- Portfolio simulator state (virtual, not real funds)
- Chat conversation history (for AI context)

#### Data Retention

- Chat history: 30 days
- Learning progress: Retained until user requests deletion
- Portfolio simulator: Retained until user requests deletion
- No personally identifiable information (PII) beyond wallet address

#### User Rights

Users can request:
1. **Data export**: Download all their data
2. **Data deletion**: Permanent removal from our systems
3. **Data correction**: Update inaccurate information

Contact privacy@explainailikeimfive.com for data requests.

---

### 6. AI Safety & Content Moderation

#### OpenAI API

- ✅ Content filtering enabled
- ✅ System prompts restrict harmful outputs
- ✅ No financial advice given (educational only)
- ✅ Scam detection in token descriptions

#### Guardrails

```python
# AI safety system prompt
SAFETY_PROMPT = """
You are EAILI5, an educational AI assistant for crypto beginners.

Rules:
- Provide educational content only, not financial advice
- Warn users about scams and risks
- Never encourage risky behavior
- Always emphasize "Do Your Own Research"
"""
```

---

### 7. Rate Limiting & DDoS Protection

#### API Rate Limits

```python
# FastAPI rate limiting
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@app.get("/api/tokens")
@limiter.limit("10/minute")
async def get_tokens():
    ...
```

#### Cloud Run Autoscaling

- Max instances: 10 (prevents cost explosion)
- Min instances: 0-1 (cost-effective)
- CPU throttling enabled

---

### 8. Dependency Security

#### Automated Scanning

```powershell
# Backend (Python)
pip install safety
safety check --file requirements.txt

# Frontend (Node.js)
npm audit
npm audit fix
```

#### Update Policy

- Critical vulnerabilities: Patch within 24 hours
- High vulnerabilities: Patch within 7 days
- Medium/Low: Patch in next release cycle

---

### 9. Incident Response Plan

#### Detection

- Monitor Cloud Run error rates
- Alert on unusual API usage patterns
- Check Secret Manager access logs

#### Response Steps

1. **Identify** the scope and impact
2. **Contain** the incident (e.g., disable affected services)
3. **Eradicate** the root cause
4. **Recover** services safely
5. **Post-mortem** and prevention measures

#### Communication

- Notify affected users within 72 hours (GDPR requirement)
- Publish incident report on status page
- Update security measures to prevent recurrence

---

## Security Checklist for Deployment

Before deploying to production:

- [ ] All API keys in Secret Manager (not hardcoded)
- [ ] `.env` files in `.gitignore`
- [ ] CORS origins restricted to production domains
- [ ] HTTPS enforced (automatic with Cloud Run)
- [ ] Database passwords strong and unique
- [ ] Backup strategy configured
- [ ] Rate limiting enabled
- [ ] Error messages don't leak sensitive info
- [ ] Dependencies scanned for vulnerabilities
- [ ] Monitoring and alerting configured

---

## Security Tools & Resources

### Recommended Tools

- [Google Cloud Security Scanner](https://cloud.google.com/security-command-center)
- [Dependabot](https://github.com/dependabot) - Automated dependency updates
- [npm audit](https://docs.npmjs.com/cli/v8/commands/npm-audit) - Node.js security
- [Safety](https://pypi.org/project/safety/) - Python security
- [OWASP ZAP](https://www.zaproxy.org/) - Web app security testing

### External Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Base Security Best Practices](https://docs.base.org/security)
- [Google Cloud Security Best Practices](https://cloud.google.com/security/best-practices)
- [GDPR Compliance Guide](https://gdpr.eu/)
- [CCPA Compliance Guide](https://oag.ca.gov/privacy/ccpa)

---

## Contact

For security concerns:
- Email: security@explainailikeimfive.com
- GitHub: https://github.com/steffenpharai/EAILI5-Base/security/advisories
- Response time: 48 hours

For general support:
- GitHub Issues: https://github.com/steffenpharai/EAILI5-Base/issues
- Documentation: [README.md](./README.md)
- Community: GitHub Discussions

---

**Last Updated**: October 2025  
**Next Review**: Quarterly or after major changes

