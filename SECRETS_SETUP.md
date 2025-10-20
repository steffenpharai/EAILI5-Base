# Google Cloud Secret Manager Setup Guide

Complete guide for setting up secrets for EA ILI5 Base Mini App deployment on Google Cloud.

## Prerequisites

- Google Cloud SDK (`gcloud`) installed and configured
- Access to `eaili5` GCP project
- All required API keys ready

---

## Required Secrets

### 1. OpenAI API Key
For AI chat and educational content generation.

**Get your key**: https://platform.openai.com/api-keys

```powershell
# Create secret
echo YOUR_OPENAI_API_KEY | gcloud secrets create openai-api-key `
  --data-file=- `
  --project=eaili5

# Verify
gcloud secrets versions access latest --secret=openai-api-key --project=eaili5
```

### 2. Tavily API Key
For real-time web search functionality.

**Get your key**: https://tavily.com/

```powershell
echo YOUR_TAVILY_API_KEY | gcloud secrets create tavily-api-key `
  --data-file=- `
  --project=eaili5
```

### 3. Bitquery API Key
For Base DEX data and token information.

**Get your key**: https://bitquery.io/

```powershell
echo YOUR_BITQUERY_API_KEY | gcloud secrets create bitquery-api-key `
  --data-file=- `
  --project=eaili5
```

### 4. Database URL
PostgreSQL connection string for Cloud SQL.

```powershell
# Format: postgresql://user:password@/database?host=/cloudsql/CONNECTION_NAME
$DB_URL = "postgresql://postgres:YOUR_PASSWORD@/eali5?host=/cloudsql/eaili5:us-central1:eaili5-db"
echo $DB_URL | gcloud secrets create database-url `
  --data-file=- `
  --project=eaili5
```

### 5. Redis URL
Connection string for Memorystore Redis.

```powershell
# Get Redis host from Memorystore
$REDIS_HOST = gcloud redis instances describe eaili5-redis `
  --region=us-central1 `
  --format="value(host)" `
  --project=eaili5

# Create secret
$REDIS_URL = "redis://${REDIS_HOST}:6379"
echo $REDIS_URL | gcloud secrets create redis-url `
  --data-file=- `
  --project=eaili5
```

### 6. WalletConnect Project ID (Optional for Frontend)
For wallet connection functionality.

**Get your ID**: https://cloud.walletconnect.com/

```powershell
echo YOUR_WALLETCONNECT_PROJECT_ID | gcloud secrets create walletconnect-project-id `
  --data-file=- `
  --project=eaili5
```

---

## Grant Cloud Run Access to Secrets

Cloud Run services need permission to access secrets.

```powershell
# Get project number
$PROJECT_NUMBER = gcloud projects describe eaili5 --format="value(projectNumber)"

# Define service account
$SERVICE_ACCOUNT = "${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

# Grant access to all secrets
$secrets = @("openai-api-key", "tavily-api-key", "bitquery-api-key", "database-url", "redis-url", "walletconnect-project-id")

foreach ($secret in $secrets) {
    gcloud secrets add-iam-policy-binding $secret `
        --member="serviceAccount:$SERVICE_ACCOUNT" `
        --role="roles/secretmanager.secretAccessor" `
        --project=eaili5
}
```

---

## Verify Secrets Setup

```powershell
# List all secrets
gcloud secrets list --project=eaili5

# Check specific secret
gcloud secrets describe openai-api-key --project=eaili5

# View IAM policy (verify permissions)
gcloud secrets get-iam-policy openai-api-key --project=eaili5

# Test accessing secret value (should work if permissions are correct)
gcloud secrets versions access latest --secret=openai-api-key --project=eaili5
```

---

## Update Existing Secrets

To update a secret without changing its name:

```powershell
# Add new version
echo NEW_VALUE | gcloud secrets versions add SECRET_NAME --data-file=- --project=eaili5

# List versions
gcloud secrets versions list SECRET_NAME --project=eaili5

# Disable old version (optional)
gcloud secrets versions disable VERSION_NUMBER --secret=SECRET_NAME --project=eaili5
```

---

## Secrets in Cloud Build

Reference secrets in `cloudbuild.yaml`:

```yaml
steps:
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: gcloud
    args:
      - 'run'
      - 'deploy'
      - 'eaili5-base-backend'
      - '--set-secrets'
      - 'OPENAI_API_KEY=openai-api-key:latest,TAVILY_API_KEY=tavily-api-key:latest'
```

---

## Security Best Practices

### 1. Principle of Least Privilege
Only grant access to secrets that services actually need.

### 2. Rotation Schedule
Rotate secrets regularly:
- API keys: Every 90 days
- Database passwords: Every 180 days
- Service account keys: Every 90 days

### 3. Audit Logging
Monitor secret access:

```powershell
# View audit logs
gcloud logging read "resource.type=cloud_secret_manager_secret" `
  --limit=50 `
  --format=json `
  --project=eaili5
```

### 4. Backup Secrets
Keep encrypted backups of critical secrets offline (e.g., in a password manager).

---

## Troubleshooting

### Permission Denied Error

```
Error: PERMISSION_DENIED: The caller does not have permission
```

**Solution**: Grant access to service account
```powershell
gcloud secrets add-iam-policy-binding SECRET_NAME `
  --member="serviceAccount:SERVICE_ACCOUNT" `
  --role="roles/secretmanager.secretAccessor" `
  --project=eaili5
```

### Secret Not Found

```
Error: NOT_FOUND: Secret [SECRET_NAME] not found
```

**Solution**: Create the secret first
```powershell
echo VALUE | gcloud secrets create SECRET_NAME --data-file=- --project=eaili5
```

### Cloud Run Can't Access Secret

Check:
1. Secret exists: `gcloud secrets list --project=eaili5`
2. Service account has access: `gcloud secrets get-iam-policy SECRET_NAME --project=eaili5`
3. Secret is referenced correctly in cloudbuild.yaml

---

## Quick Setup Script

Run this script to set up all secrets at once:

```powershell
# setup-secrets.ps1
$secrets = @{
    "openai-api-key" = $env:OPENAI_API_KEY
    "tavily-api-key" = $env:TAVILY_API_KEY
    "bitquery-api-key" = $env:BITQUERY_API_KEY
    "database-url" = $env:DATABASE_URL
    "redis-url" = $env:REDIS_URL
    "walletconnect-project-id" = $env:REACT_APP_WALLET_CONNECT_PROJECT_ID
}

foreach ($secretName in $secrets.Keys) {
    $value = $secrets[$secretName]
    if ($value) {
        Write-Host "Creating secret: $secretName"
        echo $value | gcloud secrets create $secretName --data-file=- --project=eaili5
    } else {
        Write-Host "Skipping $secretName (not set in environment)"
    }
}

# Grant access
$PROJECT_NUMBER = gcloud projects describe eaili5 --format="value(projectNumber)"
$SERVICE_ACCOUNT = "${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

foreach ($secretName in $secrets.Keys) {
    Write-Host "Granting access to: $secretName"
    gcloud secrets add-iam-policy-binding $secretName `
        --member="serviceAccount:$SERVICE_ACCOUNT" `
        --role="roles/secretmanager.secretAccessor" `
        --project=eaili5
}

Write-Host "✅ All secrets configured!"
```

Usage:
```powershell
# Load .env file first
Get-Content .env | ForEach-Object {
    if ($_ -match '^([^=]+)=(.*)$') {
        [System.Environment]::SetEnvironment($matches[1], $matches[2])
    }
}

# Run setup script
./setup-secrets.ps1
```

---

## Resources

- [Secret Manager Documentation](https://cloud.google.com/secret-manager/docs)
- [Cloud Run Secrets](https://cloud.google.com/run/docs/configuring/secrets)
- [IAM Best Practices](https://cloud.google.com/iam/docs/best-practices-service-accounts)

---

**Next Steps**: After setting up secrets, proceed with [DEPLOYMENT.md](./DEPLOYMENT.md)

