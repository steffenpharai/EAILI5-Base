# WalletConnect Project Setup

## Current Status
A placeholder WalletConnect Project ID has been created in Google Cloud Secret Manager. You need to replace it with a real Project ID for production use.

## Steps to Get WalletConnect Project ID

### 1. Create WalletConnect Project
1. Go to https://cloud.walletconnect.com
2. Sign up or login with:
   - GitHub
   - Email
   - Google
3. Click "Create New Project"
4. Enter project details:
   - **Name**: EAILI5
   - **Description**: AI-powered crypto education platform on Base
   - **Website**: https://base.explainailikeimfive.com

### 2. Copy Project ID
1. After creating the project, you'll see your **Project ID** on the dashboard
2. Copy this Project ID (it looks like: `a1b2c3d4e5f6g7h8i9j0...`)

### 3. Update Google Cloud Secret
```bash
# Update the secret with your real Project ID
echo -n "YOUR_REAL_PROJECT_ID" | gcloud secrets versions add walletconnect-project-id \
  --data-file=- \
  --project=eaili5
```

### 4. Update Local .env File
Edit `apps/base/.env`:
```env
REACT_APP_WALLET_CONNECT_PROJECT_ID=YOUR_REAL_PROJECT_ID
```

### 5. Redeploy Frontend
```bash
cd apps/base/frontend
gcloud builds submit . \
  --config=cloudbuild.yaml \
  --substitutions=_WALLET_CONNECT_PROJECT_ID=YOUR_REAL_PROJECT_ID \
  --project=eaili5
```

## Why WalletConnect is Needed
WalletConnect enables users to:
- Connect various wallet apps (MetaMask, Rainbow, Trust Wallet, etc.)
- Sign transactions securely
- Interact with your dApp without browser extensions

## Alternative: Use Coinbase Wallet Only
If you want to use only Coinbase Wallet (which is already configured), you can:
1. Remove WalletConnect from `apps/base/frontend/src/wagmi.ts`:
   ```typescript
   // Remove this line:
   walletConnect({
     projectId: process.env.REACT_APP_WALLET_CONNECT_PROJECT_ID || '',
   }),
   ```
2. Keep only `coinbaseWallet` and `injected` connectors

## Verification
After updating:
1. Check the app console at https://base.explainailikeimfive.com
2. No more "Project ID Not Configured" errors should appear
3. WalletConnect modal should work when clicking "Connect Wallet"

## Support
- WalletConnect Documentation: https://docs.walletconnect.com
- WalletConnect Cloud: https://cloud.walletconnect.com

