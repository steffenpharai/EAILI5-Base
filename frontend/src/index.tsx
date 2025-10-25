import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import '@coinbase/onchainkit/styles.css';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { OnchainKitProvider } from '@coinbase/onchainkit';
import App from './App';
import { config } from './wagmi';
import { initializeMiniApp, signalAppReady } from './utils/minikit';
import { base } from 'wagmi/chains';

const queryClient = new QueryClient();

// Initialize Mini App features
initializeMiniApp().then((miniAppInfo) => {
  console.log('Mini App Info:', miniAppInfo);
});

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

// Per OnchainKit docs: WagmiProvider and QueryClientProvider must wrap OnchainKitProvider
// Reference: https://docs.base.org/onchainkit/latest/configuration/wagmi-viem-integration
root.render(
  <React.StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <OnchainKitProvider
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
        </OnchainKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>
);

// Signal to Farcaster that the app is ready after React renders
// This dismisses the splash screen in Farcaster Mini Apps
setTimeout(() => {
  signalAppReady();
}, 100);
