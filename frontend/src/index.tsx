import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import '@coinbase/onchainkit/styles.css';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { MiniKitProvider } from '@coinbase/onchainkit/minikit';
import App from './App';
import { config } from './wagmi';
import { initializeMiniApp } from './utils/minikit';
import { base } from 'wagmi/chains';

const queryClient = new QueryClient();

// Initialize Mini App features
initializeMiniApp().then((miniAppInfo) => {
});

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

// Per OnchainKit docs: MiniKitProvider wraps OnchainKitProvider for Frame SDK integration
// Reference: https://docs.base.org/onchainkit/latest/components/minikit/overview
root.render(
  <React.StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <MiniKitProvider
          apiKey={process.env.REACT_APP_COINBASE_API_KEY || ''}
          chain={base}
          config={{
            appearance: {
              name: 'EAILI5',
              logo: '/logo192.png',
              mode: 'auto',
              theme: 'base'
            },
            wallet: {
              display: 'modal',
              preference: 'smartWalletOnly',
              termsUrl: 'https://explainailikeimfive.com/terms',
              privacyUrl: 'https://explainailikeimfive.com/privacy'
            },
            analytics: true
          }}
        >
          <App />
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1e293b',
                color: '#f1f5f9',
                border: '1px solid #334155',
              },
            }}
          />
        </MiniKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>
);

// Note: MiniKitProvider is for OnchainKit integration
// Farcaster Mini App SDK requires explicit sdk.actions.ready() call in App.tsx
