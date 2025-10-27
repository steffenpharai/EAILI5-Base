import { useEffect } from 'react';
import { useAccount } from 'wagmi';
import { apiEndpoints } from '../services/api';

/**
 * Hook to track wallet connect/disconnect events with backend
 * Calls backend APIs when wallet state changes
 */
export const useWalletTracking = () => {
  const { address, isConnected, isConnecting, isDisconnected } = useAccount();

  useEffect(() => {
    const trackWalletConnection = async () => {
      if (!address || !isConnected) return;

      try {
        
        // Call backend to track wallet connection
        await apiEndpoints.connectWallet({
          address: address,
          signature: undefined,
          message: undefined
        });
        
      } catch (error) {
        console.error('Error tracking wallet connection:', error);
      }
    };

    const trackWalletDisconnection = async () => {
      if (!address || !isDisconnected) return;

      try {
        
        // Call backend to track wallet disconnection
        await apiEndpoints.disconnectWallet({
          address: address,
          sessionId: localStorage.getItem('session_token') || ''
        });
        
      } catch (error) {
        console.error('Error tracking wallet disconnection:', error);
      }
    };

    // Track connection when wallet becomes connected
    if (isConnected && address) {
      trackWalletConnection();
    }

    // Track disconnection when wallet becomes disconnected
    if (isDisconnected && address) {
      trackWalletDisconnection();
    }
  }, [address, isConnected, isDisconnected]);

  return {
    isConnected,
    isConnecting,
    isDisconnected,
    address
  };
};
