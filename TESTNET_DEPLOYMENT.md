# Base Sepolia Testnet Deployment Guide

Guide for testing EAILI5 on Base Sepolia testnet as required by Base Batches Builder Track.

## Why Base Sepolia Testnet?

Base Batches requires:
> "Must submit proof of deployment and 1+ transactions on Base testnet"

This ensures your app works on the actual Base blockchain before mainnet deployment.

---

## Prerequisites

- Deployed EAILI5 app (frontend accessible)
- Coinbase Wallet or compatible Web3 wallet
- Base Sepolia testnet ETH

---

## Step 1: Get Base Sepolia Testnet ETH

### Option 1: Coinbase Faucet (Recommended)

1. Visit https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet
2. Sign in with Coinbase account
3. Enter your wallet address
4. Request testnet ETH
5. Wait 1-2 minutes for transaction confirmation

### Option 2: QuickNode Faucet

1. Visit https://faucet.quicknode.com/base/sepolia
2. Connect your wallet or enter address
3. Complete captcha
4. Request testnet ETH

### Option 3: Bware Labs Faucet

1. Visit https://bwarelabs.com/faucets/base-testnet
2. Enter wallet address
3. Request testnet ETH

---

## Step 2: Connect Wallet to Base Sepolia

### Using Coinbase Wallet

1. Open EAILI5 app: https://base.explainailikeimfive.com
2. Click "Connect Wallet" button (top right)
3. Select "Coinbase Wallet"
4. In wallet popup, click network selector
5. Switch to "Base Sepolia" testnet
6. Approve connection

### Manual Network Addition

If Base Sepolia isn't listed:

**Network Details:**
- Network Name: Base Sepolia
- RPC URL: https://sepolia.base.org
- Chain ID: 84532
- Currency Symbol: ETH
- Block Explorer: https://sepolia.basescan.org

---

## Step 3: Test Application Functions

### 3.1 View Token List

1. Navigate to Home view
2. Verify token list loads (should show Base Sepolia tokens)
3. Note: Token prices may be $0 or mock data on testnet

### 3.2 AI Chat Functionality

1. Click "Start Learning" or navigate to Learn view
2. Ask EAILI5 a question (e.g., "What is DeFi?")
3. Verify AI responds with educational content
4. Check that streaming works properly

### 3.3 Portfolio Simulator

1. Navigate to Portfolio view
2. Verify $100 virtual starting balance
3. Try executing a simulated trade:
   - Select a token
   - Enter amount
   - Confirm trade
4. Verify portfolio balance updates

**Note**: Portfolio simulator uses virtual funds, not real testnet ETH.

### 3.4 Wallet Integration

1. Verify wallet address displays correctly
2. Click on connected wallet
3. Verify Basename shows if you have one (e.g., yourname.base.eth)
4. Test disconnect/reconnect functionality

---

## Step 4: Execute Test Transaction (Required for Base Batches)

To prove deployment on testnet, you need at least **one real transaction** on Base Sepolia.

### Method 1: Send Test ETH to Another Address

```typescript
// Using Coinbase Wallet UI
1. Click "Send" in wallet
2. Enter recipient address (can be your own second address)
3. Amount: 0.001 ETH (minimal)
4. Confirm transaction
5. Copy transaction hash
```

### Method 2: Interact with a Test Contract

If your app includes smart contract interactions:

1. Deploy test contract to Base Sepolia
2. Execute contract function through your app
3. Record transaction hash

### Method 3: Use Faucet Transaction

The faucet transaction itself counts! When you requested testnet ETH, that created a transaction:

1. Go to https://sepolia.basescan.org/
2. Search for your wallet address
3. Find the faucet transaction (incoming ETH)
4. Copy transaction hash

---

## Step 5: Record Transaction Proof

### Get Transaction Details

1. Visit Base Sepolia Block Explorer: https://sepolia.basescan.org/
2. Search for your wallet address or transaction hash
3. Click on the transaction
4. Take screenshots of:
   - Transaction hash
   - Block number
   - From/To addresses
   - Status (Success)
   - Timestamp

### Example Transaction Proof

```markdown
## Base Sepolia Testnet Deployment Proof

- **Transaction Hash**: 0xabc123...
- **Block Number**: 123456
- **From Address**: 0xYourAddress...
- **To Address**: 0xRecipientAddress...
- **Status**: Success ✓
- **Explorer Link**: https://sepolia.basescan.org/tx/0xabc123...
- **Timestamp**: 2025-10-20 12:34:56 UTC
```

Save this information for your Base Batches submission!

---

## Step 6: Test Basenames Integration

### If You Have a Basename

1. Register a basename at https://www.base.org/names (testnet or mainnet)
2. Connect wallet with basename to your app
3. Verify basename displays instead of truncated address
4. Take screenshot showing basename in your app

### If You Don't Have a Basename

1. App should gracefully display truncated address (0xABC...DEF)
2. Verify address is still clickable/copyable
3. This is acceptable - Basenames are recommended but not required

---

## Step 7: Verify Deployment Checklist

Before submitting to Base Batches, confirm:

- [ ] App accessible at public URL (https://base.explainailikeimfive.com)
- [ ] Wallet connects successfully to Base Sepolia
- [ ] At least 1 transaction executed on Base Sepolia
- [ ] Transaction hash recorded and verified on block explorer
- [ ] Screenshots/proof of deployment saved
- [ ] Basenames integration working (or gracefully degraded)
- [ ] All core features functional on testnet

---

## Troubleshooting

### Wallet Won't Connect

- Ensure Coinbase Wallet is updated to latest version
- Try clearing browser cache
- Try different browser (Chrome recommended)
- Check if WalletConnect Project ID is configured

### Network Switch Fails

- Manually add Base Sepolia network (see network details above)
- Restart wallet app
- Ensure you have some testnet ETH for gas

### Transactions Fail

- Verify you have enough testnet ETH (gas fees)
- Check Base Sepolia RPC is not rate-limited
- Wait a few minutes and retry
- Check Base Sepolia status: https://status.base.org

### Faucet Not Working

- Some faucets have rate limits (1 request per 24 hours)
- Try alternative faucets listed above
- Join Base Discord for testnet ETH requests

---

## Common Test Scenarios

### Scenario 1: New User Onboarding

1. User visits app without wallet
2. Clicks "Connect Wallet"
3. Installs Coinbase Wallet
4. Creates wallet
5. Switches to Base Sepolia
6. Gets testnet ETH from faucet
7. Connects to app
8. Uses learning features

### Scenario 2: Portfolio Simulation

1. Connected user navigates to Portfolio
2. Views $100 virtual balance
3. Explores token list
4. Executes simulated buy order
5. Portfolio balance updates
6. Views transaction history
7. Resets portfolio (if feature exists)

### Scenario 3: AI Learning Path

1. User starts chat with EAILI5
2. Asks beginner question: "What is a blockchain?"
3. EAILI5 responds with ELI5 explanation
4. User follows up: "Tell me about Base"
5. EAILI5 explains Base L2
6. User receives learning progress badge

---

## Base Batches Submission Format

Include this in your Base Batches application:

```markdown
### Testnet Deployment Proof

**App URL**: https://base.explainailikeimfive.com

**Base Sepolia Transaction**:
- Hash: 0x[YOUR_TX_HASH]
- Explorer: https://sepolia.basescan.org/tx/0x[YOUR_TX_HASH]
- Block: [BLOCK_NUMBER]
- Timestamp: [TIMESTAMP]

**Wallet Integration**:
- Coinbase Smart Wallet: ✓
- Basenames Support: ✓
- OnchainKit Integration: ✓

**Screenshots**:
- [Attach screenshot of connected wallet]
- [Attach screenshot of transaction on block explorer]
- [Attach screenshot of app functionality]

**Video Demo**: [Link to 1-minute demo video]
```

---

## Next Steps

1. ✅ Complete testnet deployment and testing
2. ✅ Record transaction hash and take screenshots
3. ⏳ Create 1-minute demo video (required for Base Batches)
4. ⏳ Sign farcaster.json at https://base.dev
5. ⏳ Submit application to Base Batches before October 24, 2025

---

## Resources

- [Base Sepolia Faucet](https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet)
- [Base Sepolia Explorer](https://sepolia.basescan.org/)
- [Base Documentation](https://docs.base.org/)
- [Base Batches Submission](https://base-batches-builder-track.devfolio.co/)
- [Coinbase Wallet](https://www.coinbase.com/wallet)

---

**Questions?** Check [DEPLOYMENT.md](./DEPLOYMENT.md) or [TROUBLESHOOTING.md](./frontend/TROUBLESHOOTING.md)

