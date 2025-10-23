import React, { useState, useEffect } from 'react';
import { ThumbsUp, ThumbsDown, Heart, Info, X, Loader2 } from 'lucide-react';
import { useAppreciation } from '../hooks/useAppreciation';
import { useAccount } from 'wagmi';
import { useTheme } from '../contexts/ThemeContext';
import { 
  Transaction, 
  TransactionButton,
  TransactionStatus,
  TransactionStatusLabel,
  TransactionStatusAction
} from '@coinbase/onchainkit/transaction';
import { parseEther } from 'viem';
import { getAppreciationAddress } from '../utils/basenameResolver';
import toast from 'react-hot-toast';

interface FeedbackBarProps {
  messageId?: string;
  sessionId?: string;
  onSupportSent?: (transactionHash: string) => void;
  className?: string;
}

const FeedbackBar: React.FC<FeedbackBarProps> = ({
  messageId,
  sessionId,
  onSupportSent,
  className = '',
}) => {
  const { theme } = useTheme();
  const { address } = useAccount();
  const {
    logAppreciationTransaction,
  } = useAppreciation();

  const [showInfo, setShowInfo] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isLoggingAppreciation, setIsLoggingAppreciation] = useState(false);

  // Show bar immediately for testing
  useEffect(() => {
    if (messageId) {
      setIsVisible(true);
    }
  }, [messageId]);

  // Keep bar visible - no auto-hide

  const handleAppreciationSuccess = async (response: any) => {
    try {
      setIsLoggingAppreciation(true);
      
      const transactionHash = response.hash || response.transactionHash;
      if (!transactionHash) {
        throw new Error('No transaction hash received');
      }
      
      // Log the appreciation transaction
      const result = await logAppreciationTransaction(transactionHash, 0.001, messageId);
      
      if (result.success) {
        toast.success('Thank you for supporting EAILI5 on Base! Transaction recorded.');
        onSupportSent?.(transactionHash);
      } else {
        toast.error('Failed to log appreciation transaction');
      }
    } catch (error) {
      console.error('Error handling appreciation success:', error);
      toast.error('Failed to process appreciation');
    } finally {
      setIsLoggingAppreciation(false);
    }
  };

  const handleAppreciationError = (error: any) => {
    console.error('Appreciation transaction error:', error);
    toast.error('Transaction failed. Please try again.');
  };

  const appreciationAddress = getAppreciationAddress();
  const calls = [
    {
      to: appreciationAddress,
      value: parseEther('0.001'),
      data: "0x" as `0x${string}`,
    },
  ];

  if (!isVisible) {
    return null;
  }

  const barStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: '6px 12px',
    background: 'rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(10px)',
    borderBottom: `1px solid rgba(255, 255, 255, 0.1)`,
    minHeight: '32px',
    fontSize: '12px',
    fontFamily: 'Inter, system-ui, sans-serif',
    gap: '8px',
    position: 'relative',
    zIndex: 5,
  };

  const leftSectionStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: theme.text.secondary,
  };


  const buttonStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '6px 10px',
    borderRadius: '8px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    minHeight: '28px',
    minWidth: '28px',
    background: 'transparent',
  };


  const supportButtonStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 8px',
    borderRadius: '6px',
    border: '1px solid #3B82F6',
    background: 'rgba(59, 130, 246, 0.1)',
    color: '#3B82F6',
    cursor: address ? 'pointer' : 'not-allowed',
    fontSize: '11px',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    minHeight: '24px',
    opacity: address ? 1 : 0.5,
    pointerEvents: 'auto',
    zIndex: 10,
    position: 'relative',
  };

  const infoButtonStyles: React.CSSProperties = {
    ...buttonStyles,
    background: 'transparent',
    color: theme.text.secondary,
    border: 'none',
    padding: '2px',
    minHeight: '20px',
    minWidth: '20px',
  };

  return (
    <div style={barStyles} className={className}>
      {/* Left Section */}
      <div style={leftSectionStyles}>
        <span>Support EAILI5 on Base</span>
        <button
          style={infoButtonStyles}
          onClick={() => setShowInfo(!showInfo)}
          title="Learn about on-chain support"
        >
          <Info size={14} />
        </button>
        {showInfo && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: '16px',
            background: theme.surface.primary,
            border: `1px solid ${theme.border.primary}`,
            borderRadius: '8px',
            padding: '12px',
            fontSize: '12px',
            color: theme.text.secondary,
            maxWidth: '300px',
            zIndex: 1000,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          }}>
            <strong>On-Chain Support:</strong> Send ETH to stefo0.base.eth to support EAILI5. 
            Creates a verified transaction on Base testnet. Your support helps improve our AI.
            <button
              style={{...infoButtonStyles, position: 'absolute', top: '4px', right: '4px'}}
              onClick={() => setShowInfo(false)}
            >
              <X size={12} />
            </button>
          </div>
        )}
      </div>

      {/* Support Button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {!address && (
          <span style={{ fontSize: '10px', color: theme.text.secondary, marginRight: '6px' }}>
            Connect wallet to support
          </span>
        )}
        <div style={{ position: 'relative' }}>
          <style>{`
            .send-eth-button button {
              display: flex !important;
              align-items: center !important;
              gap: 4px !important;
              padding: 4px 8px !important;
              border-radius: 6px !important;
              border: 1px solid #3B82F6 !important;
              background: rgba(59, 130, 246, 0.1) !important;
              color: #3B82F6 !important;
              cursor: ${address ? 'pointer' : 'not-allowed'} !important;
              font-size: 11px !important;
              font-weight: 500 !important;
              transition: all 0.2s ease !important;
              min-height: 24px !important;
              opacity: ${address ? 1 : 0.5} !important;
            }
            .send-eth-button button:hover:not(:disabled) {
              background: rgba(59, 130, 246, 0.2) !important;
              border-color: #60A5FA !important;
            }
          `}</style>
          <Transaction
            calls={calls}
            chainId={84532} // Base Sepolia testnet
            onSuccess={handleAppreciationSuccess}
            onError={handleAppreciationError}
          >
            <TransactionButton
              text={isLoggingAppreciation ? "Processing..." : "Send 0.001 ETH"}
              disabled={isLoggingAppreciation || !address}
              className="send-eth-button"
            />
            <TransactionStatus>
              <TransactionStatusLabel />
              <TransactionStatusAction />
            </TransactionStatus>
          </Transaction>
        </div>
      </div>
    </div>
  );
};

export default FeedbackBar;
