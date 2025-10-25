import { useState, useCallback } from 'react';
import { useAccount } from 'wagmi';
import toast from 'react-hot-toast';
import { getAppreciationAddress } from '../utils/basenameResolver';


interface AppreciationData {
  user_id: string;
  transaction_hash: string;
  amount_eth: number;
  message_id?: string;
}


export const useAppreciation = () => {
  const { address } = useAccount();
  
  const [isLoggingAppreciation, setIsLoggingAppreciation] = useState(false);

  const logAppreciationTransaction = useCallback(async (transactionHash: string, amountEth: number, messageId?: string) => {
    if (!address) {
      return { success: false, error: 'Wallet not connected' };
    }

    setIsLoggingAppreciation(true);
    
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
      console.log('Logging appreciation to:', `${apiUrl}/api/appreciation/log`);
      
      const response = await fetch(`${apiUrl}/api/appreciation/log`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: address,
          transaction_hash: transactionHash,
          amount_eth: amountEth,
          message_id: messageId,
        }),
      });

      console.log('Appreciation response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Appreciation result:', result);
      
      return { success: result.status === 'success', data: result };
    } catch (error: unknown) {
      console.error('Error logging appreciation transaction:', error);
      const errorMessage = error instanceof Error ? error.message : 'Network error';
      return { success: false, error: errorMessage };
    } finally {
      setIsLoggingAppreciation(false);
    }
  }, [address]);



  return {
    // State
    isLoggingAppreciation,
    
    // Actions
    logAppreciationTransaction,
  };
};
