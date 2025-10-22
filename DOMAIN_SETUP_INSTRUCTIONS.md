# Custom Domain Setup for EAILI5 Base App

## Current Status
✅ **Backend Deployed**: https://eaili5-base-backend-uqc2fzhntq-uc.a.run.app
✅ **Frontend Deployed**: https://eaili5-base-frontend-uqc2fzhntq-uc.a.run.app
✅ **Google Cloud SQL PostgreSQL**: `eaili5-postgres` (us-central1)
✅ **Google Cloud Memorystore Redis**: `eaili5-redis` (us-central1)

## Required: Domain Verification & Mapping

### Step 1: Verify Your Domains in Google Cloud

You need to verify ownership of `explainailikeimfive.com` before mapping subdomains.

**Option A: Google Search Console (Recommended)**
1. Go to [Google Search Console](https://search.google.com/search-console)
2. Add property: `explainailikeimfive.com`
3. Verify using one of:
   - DNS TXT record (recommended)
   - HTML file upload
   - Meta tag
4. Wait 5-10 minutes for verification

**Option B: Google Cloud Console**
1. Go to [Domain Verification](https://console.cloud.google.com/apis/credentials/domainverification?project=eaili5)
2. Click "Add Domain"
3. Enter `explainailikeimfive.com`
4. Follow verification instructions

### Step 2: Map Custom Domains to Cloud Run

After verification, run these commands:

```powershell
# Map backend domain
gcloud beta run domain-mappings create `
  --service=eaili5-base-backend `
  --domain=base-api.explainailikeimfive.com `
  --region=us-central1 `
  --project=eaili5

# Map frontend domain
gcloud beta run domain-mappings create `
  --service=eaili5-base-frontend `
  --domain=base.explainailikeimfive.com `
  --region=us-central1 `
  --project=eaili5
```

### Step 3: Get DNS Records

After mapping, get the required DNS records:

```powershell
# Backend DNS records
gcloud beta run domain-mappings describe base-api.explainailikeimfive.com `
  --region=us-central1 `
  --project=eaili5 `
  --format="value(status.resourceRecords)"

# Frontend DNS records
gcloud beta run domain-mappings describe base.explainailikeimfive.com `
  --region=us-central1 `
  --project=eaili5 `
  --format="value(status.resourceRecords)"
```

### Step 4: Update DNS in Your Domain Provider

Add the records provided by Google Cloud to your DNS configuration at your domain registrar.

**Example DNS Records:**
```
Type: CNAME
Name: base-api
Value: ghs.googlehosted.com

Type: CNAME
Name: base
Value: ghs.googlehosted.com
```

### Step 5: Wait for DNS Propagation

- DNS propagation typically takes 10-60 minutes
- Check status: `dig base.explainailikeimfive.com`
- Or use: https://dnschecker.org

### Step 6: Update Farcaster Manifest

After domains are live, update the signed `accountAssociation` in:
`frontend/public/.well-known/farcaster.json`

Visit https://base.dev to sign the manifest with your wallet.

## SSL Certificates

Google Cloud Run automatically provisions and manages SSL certificates for your custom domains. This may take 15-60 minutes after DNS propagation.

## Troubleshooting

**Domain not verified:**
- Ensure you're logged in with the same Google account for both Cloud Console and Search Console
- Wait 10-15 minutes after adding verification records

**DNS not resolving:**
- Check DNS records: `nslookup base.explainailikeimfive.com`
- Verify CNAME points to `ghs.googlehosted.com`
- Clear DNS cache: `ipconfig /flushdns` (Windows)

**SSL certificate errors:**
- Wait 30-60 minutes for automatic provisioning
- Check status in Cloud Run console

## Next Steps After Domain Setup

1. Test the app at `https://base.explainailikeimfive.com`
2. Sign Farcaster manifest at base.dev
3. Test on Base Sepolia testnet
4. Record demo video (minimum 1 minute)
5. Submit to Base Batches before October 24, 2025

## Support

- Google Cloud Run docs: https://cloud.google.com/run/docs/mapping-custom-domains
- Base Mini Apps: https://docs.base.org/get-started/base
- Farcaster Mini Apps: https://docs.farcaster.xyz/developers/miniapps

