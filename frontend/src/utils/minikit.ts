/**
 * MiniKit utilities for Base Mini App integration
 * Detects if running inside Coinbase Wallet and provides Mini App functionality
 * Integrates with OnchainKit MiniKit components and Farcaster Mini App SDK
 * Reference: https://docs.base.org/onchainkit/latest/components/minikit/overview
 */

import { sdk } from '@farcaster/miniapp-sdk';

export interface MiniAppInfo {
  isMiniApp: boolean;
  platform: 'coinbase-wallet' | 'web' | 'unknown';
  version?: string;
  features?: string[];
}

/**
 * Detects if the app is running inside Coinbase Wallet as a Mini App
 * Enhanced to check for OnchainKit MiniKit context
 */
export function detectMiniApp(): MiniAppInfo {
  if (typeof window === 'undefined') {
    return {
      isMiniApp: false,
      platform: 'unknown',
      features: []
    };
  }

  // Check for Coinbase Wallet Mini App environment
  const isCoinbaseWallet = 
    window.parent !== window || 
    window.location.href.includes('coinbase-wallet') ||
    window.location.href.includes('wallet.coinbase.com') ||
    document.referrer.includes('coinbase-wallet') ||
    document.referrer.includes('wallet.coinbase.com');

  // Check for Mini App specific APIs
  const hasMiniAppAPI = 
    'coinbase' in window || 
    'ethereum' in window ||
    // Check for OnchainKit MiniKit context
    document.querySelector('[data-minikit-enabled="true"]') !== null;

  const isMiniApp = isCoinbaseWallet || hasMiniAppAPI;

  return {
    isMiniApp,
    platform: isMiniApp ? 'coinbase-wallet' : 'web',
    version: isMiniApp ? '1.0.0' : undefined,
    features: isMiniApp ? ['wallet', 'identity', 'base-network', 'notifications'] : []
  };
}

/**
 * Initialize Mini App features if running inside Coinbase Wallet
 * Enhanced with OnchainKit MiniKit integration and Farcaster SDK
 */
export function initializeMiniApp(): Promise<MiniAppInfo> {
  return new Promise((resolve) => {
    const miniAppInfo = detectMiniApp();
    
    if (miniAppInfo.isMiniApp) {
      // Set up Mini App specific configurations
      document.title = 'EAILI5 - Crypto Education';
      
      // Add Mini App meta tags for proper rendering in Coinbase Wallet
      const metaTheme = document.querySelector('meta[name="theme-color"]');
      if (metaTheme) {
        metaTheme.setAttribute('content', '#3B82F6');
      } else {
        const meta = document.createElement('meta');
        meta.name = 'theme-color';
        meta.content = '#3B82F6';
        document.head.appendChild(meta);
      }

      // Add viewport meta for mobile optimization
      const metaViewport = document.querySelector('meta[name="viewport"]');
      if (metaViewport) {
        metaViewport.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no');
      }

      // Mark app as MiniKit-enabled for detection
      document.documentElement.setAttribute('data-minikit-enabled', 'true');
      
      console.log('🚀 EAILI5 Mini App initialized in Coinbase Wallet');
    }
    
    resolve(miniAppInfo);
  });
}

/**
 * Signal to Farcaster that the app is ready
 * This dismisses the splash screen in Farcaster Mini Apps
 */
export async function signalAppReady(): Promise<void> {
  try {
    await sdk.actions.ready();
    console.log('✅ Farcaster Mini App ready signal sent');
  } catch (error) {
    console.warn('⚠️ Farcaster SDK not available (running in web environment):', error);
  }
}

/**
 * Get Mini App manifest data
 */
export function getMiniAppManifest() {
  return {
    name: 'EAILI5 - Crypto Education Platform',
    short_name: 'EAILI5',
    description: 'AI-powered crypto education through real-time DEX data and risk-free portfolio simulation on Base',
    version: '1.0.0',
    categories: ['education', 'defi', 'ai'],
    icon: 'logo512.png',
    start_url: '/',
    display: 'standalone',
    theme_color: '#3B82F6',
    background_color: '#0A0A0F',
    orientation: 'portrait-primary',
    scope: '/',
    lang: 'en',
    manifest_version: 3,
    permissions: ['wallet', 'identity'],
    features: {
      wallet_connect: true,
      identity_verification: true,
      base_network: true
    },
    app_metadata: {
      developer: 'stefo0.base.eth',
      website: 'https://explainailikeimfive.com',
      support: 'https://github.com/coinbase/onchainkit',
      privacy_policy: 'https://explainailikeimfive.com/privacy',
      terms_of_service: 'https://explainailikeimfive.com/terms'
    }
  };
}

/**
 * Check if Mini App features are available
 */
export function hasMiniAppFeature(feature: string): boolean {
  const miniAppInfo = detectMiniApp();
  return miniAppInfo.features?.includes(feature) || false;
}

/**
 * Get network indicator for Mini App
 */
export function getNetworkIndicator(): string {
  const miniAppInfo = detectMiniApp();
  if (miniAppInfo.isMiniApp) {
    return 'Base Sepolia Testnet';
  }
  return 'Base Sepolia Testnet';
}
