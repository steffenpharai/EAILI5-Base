# EAILI5 Frontend Troubleshooting Guide

## Common Issues and Solutions

### Source Map Warnings During Development

**Symptoms:**
You may see warnings like these during `npm start` or `docker-compose up`:

```
WARNING in ./node_modules/@wagmi/connectors/node_modules/@coinbase/wallet-sdk/dist/util/encoding.js
Module Warning (from ./node_modules/source-map-loader/dist/cjs.js):
Failed to parse source map from '/app/node_modules/@wagmi/connectors/node_modules/@coinbase/wallet-sdk/src/util/encoding.ts' file: Error: ENOENT: no such file or directory
```

**Root Cause:**
These warnings are caused by:
1. `@wagmi/connectors` and `@coinbase/wallet-sdk` packages include source maps that reference TypeScript source files
2. These TypeScript source files (`.ts`) are NOT included in the published npm packages
3. Only the compiled JavaScript (`.js`) and source map (`.js.map`) files are published
4. Webpack's `source-map-loader` tries to find the original TypeScript files and fails
5. This is a common issue with npm packages that publish source maps without including source files

**Impact:**
- **None** - These warnings do NOT affect:
  - Application functionality
  - Build output quality
  - Runtime behavior
  - Production builds
  - Development experience (beyond console clutter)

**Why We Don't Fix This:**
1. **Upstream Issue**: This is a problem with how the dependency packages are published, not our code
2. **Complexity**: Suppressing these warnings would require:
   - Ejecting from `react-scripts` (losing automatic updates and support)
   - Or adding CRACO (another dependency and configuration layer)
   - Modifying webpack configuration to ignore source-map-loader warnings
3. **Risk vs Reward**: The complexity and maintenance burden outweigh the benefit of cleaner console output
4. **Industry Standard**: This is a well-known issue in the React/TypeScript ecosystem and is generally accepted

**Alternative Solutions (Not Recommended):**
If you absolutely must suppress these warnings, you can:

1. **Option 1 - Eject from create-react-app:**
   ```bash
   npm run eject
   # Then modify config/webpack.config.js to exclude source-map-loader warnings
   ```
   ⚠️ **Warning**: This is irreversible and makes upgrades difficult

2. **Option 2 - Use CRACO:**
   ```bash
   npm install @craco/craco --legacy-peer-deps
   # Create craco.config.js with webpack configuration overrides
   ```
   ⚠️ **Warning**: Adds complexity and another dependency to maintain

**Recommendation:**
Leave these warnings as-is. They are cosmetic and do not impact the application.

---

## OnchainKit Integration Issues

### Provider Order Error

**Symptoms:**
Components can't access Wagmi hooks or OnchainKit features.

**Solution:**
Ensure providers are in the correct order per [OnchainKit documentation](https://docs.base.org/onchainkit/latest/configuration/wagmi-viem-integration):

```tsx
<WagmiProvider config={config}>
  <QueryClientProvider client={queryClient}>
    <OnchainKitProvider {...props}>
      <App />
    </OnchainKitProvider>
  </QueryClientProvider>
</WagmiProvider>
```

**Key Point**: WagmiProvider and QueryClientProvider must WRAP (be outside of) OnchainKitProvider.

---

## Base Sepolia Network Issues

### Wrong Network Selected

**Symptoms:**
Wallet connects but to the wrong network (Base Mainnet instead of Base Sepolia).

**Solution:**
1. Check `wagmi.ts` - Base Sepolia should be first in the chains array:
   ```typescript
   chains: [baseSepolia, base]
   ```

2. Check `index.tsx` - OnchainKitProvider should use baseSepolia:
   ```typescript
   <OnchainKitProvider chain={baseSepolia} ...>
   ```

3. In your wallet, manually switch to Base Sepolia network

---

## MiniKit Integration Issues

### Mini App Not Detected

**Symptoms:**
App doesn't recognize it's running inside Coinbase Wallet.

**Solution:**
1. Ensure `miniKit` prop is set in OnchainKitProvider:
   ```typescript
   miniKit={{
     enabled: true,
     autoConnect: true,
     notificationProxyUrl: '/api/notify'
   }}
   ```

2. Check browser console for "🚀 EAILI5 Mini App initialized" message

3. Verify `miniapp-manifest.json` is accessible at `/miniapp-manifest.json`

---

## Build Issues

### Type Errors After OnchainKit Update

**Solution:**
1. Clear node_modules and reinstall:
   ```bash
   rm -rf node_modules package-lock.json
   npm install --legacy-peer-deps
   ```

2. Ensure TypeScript types are up to date:
   ```bash
   npm install --save-dev @types/node@^22.0.0
   ```

---

## Docker Issues

### Frontend Container Won't Start

**Solution:**
1. Check if port 3000 is already in use:
   ```bash
   # Windows PowerShell
   netstat -ano | findstr :3000
   ```

2. Rebuild containers:
   ```bash
   cd apps/base
   docker-compose down -v
   docker-compose up --build
   ```

---

## Getting Help

If you encounter issues not covered here:

1. **Check Documentation**:
   - [OnchainKit Docs](https://docs.base.org/onchainkit/latest)
   - [Base Documentation](https://docs.base.org)
   - [Project README](../README.md)

2. **GitHub Issues**:
   - [OnchainKit Issues](https://github.com/coinbase/onchainkit/issues)
   - Project-specific issues in this repository

3. **Community**:
   - Base Discord
   - OnchainKit Discord

