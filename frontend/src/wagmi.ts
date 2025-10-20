import { http, cookieStorage, createConfig, createStorage } from 'wagmi';
import { base, baseSepolia } from 'wagmi/chains';
import { coinbaseWallet, injected, walletConnect } from 'wagmi/connectors';

// Following Base best practices for chain integration
// Reference: https://docs.base.org/onchainkit/latest/configuration/wagmi-viem-integration
export const config = createConfig({
  chains: [base, baseSepolia], // Prioritize Base mainnet
  connectors: [
    coinbaseWallet({
      appName: 'EAILI5 - Crypto Education Platform',
      preference: 'smartWalletOnly',
      version: '4',
    }),
    injected(),
    walletConnect({
      projectId: process.env.REACT_APP_WALLET_CONNECT_PROJECT_ID || '',
    }),
  ],
  storage: createStorage({
    storage: cookieStorage,
  }),
  ssr: false, // React app doesn't use SSR
  transports: {
    [base.id]: http(process.env.REACT_APP_BASE_RPC_URL || 'https://mainnet.base.org'),
    [baseSepolia.id]: http(process.env.REACT_APP_BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org'),
  },
});

// Type declaration for module augmentation
declare module 'wagmi' {
  interface Register {
    config: typeof config;
  }
}