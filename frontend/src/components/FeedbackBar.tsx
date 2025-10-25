import React, { useState, useEffect } from 'react';
import { ThumbsUp, ThumbsDown, Heart, Info, X, Loader2, TrendingUp } from 'lucide-react';
import { useAppreciation } from '../hooks/useAppreciation';
import { useAccount } from 'wagmi';
import { useTheme } from '../contexts/ThemeContext';
import { useMobile } from '../hooks/useMobile';
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
import TrendingTopics from './TrendingTopics';

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
  const [isLoggingAppreciation, setIsLoggingAppreciation] = useState(false);

  // FeedbackBar is always visible

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


      const barStyles: React.CSSProperties = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 20px', // Further increased padding to fit button properly
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)',
        borderBottom: `1px solid rgba(255, 255, 255, 0.1)`,
        minHeight: '44px', // Increased height to fully accommodate the button
        maxHeight: '44px', // Increased max height
        fontSize: '10px',
        fontFamily: 'Inter, system-ui, sans-serif',
        gap: '8px',
        position: 'relative',
        zIndex: 5,
      };

      const leftSectionStyles: React.CSSProperties = {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        color: theme.text.secondary,
        fontSize: '10px',
      };

      const rightSectionStyles: React.CSSProperties = {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        color: theme.text.secondary,
      };


  const buttonStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '10px 16px', // Increased padding for 44px minimum
    borderRadius: '8px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    minHeight: '44px', // Updated to meet touch target requirement
    minWidth: '44px', // Added minimum width
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
    minHeight: '16px',
    minWidth: '16px',
  };

      return (
        <div style={barStyles} className={className}>
          {/* Left Section - Support Info + Button */}
          <div style={leftSectionStyles}>
            <span>Support EAILI5 on Base</span>
            <button
              style={infoButtonStyles}
              onClick={() => setShowInfo(!showInfo)}
              title="Learn about on-chain support"
            >
              <Info size={12} />
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
            
            {/* Support Button - Grouped with support text */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '12px' }}>
              {!address && (
                <span style={{ fontSize: '10px', color: theme.text.secondary, marginRight: '6px' }}>
                  Connect wallet to support
                </span>
              )}
              <div style={{ position: 'relative', height: '20px', display: 'flex', alignItems: 'center' }}>
              <style>{`
                /* Target OnchainKit Transaction Button with maximum specificity */
                div[class*="Transaction"] button,
                button[class*="_button"],
                .send-eth-button button,
                .send-eth-button > div button,
                .send-eth-button > div > button {
                  display: flex !important;
                  align-items: center !important;
                  justify-content: center !important;
                  gap: 2px !important;
                  padding: 2px 6px !important;
                  border-radius: 4px !important;
                  border: none !important;
                  background: rgba(255, 255, 255, 0.1) !important;
                  color: #ffffff !important;
                  cursor: ${address ? 'pointer' : 'not-allowed'} !important;
                  font-size: 10px !important;
                  font-weight: 500 !important;
                  font-family: Inter, system-ui, sans-serif !important;
                  transition: all 150ms ease !important;
                  min-height: 20px !important;
                  height: 20px !important;
                  max-height: 20px !important;
                  width: auto !important;
                  min-width: auto !important;
                  opacity: ${address ? 1 : 0.5} !important;
                  line-height: 1 !important;
                  margin: 0 !important;
                  box-sizing: border-box !important;
                  text-transform: none !important;
                  letter-spacing: normal !important;
                }
                div[class*="Transaction"] button:hover:not(:disabled),
                .send-eth-button button:hover:not(:disabled) {
                  background: rgba(255, 255, 255, 0.2) !important;
                  transform: translateY(-1px) !important;
                }
                .send-eth-button,
                .send-eth-button > div {
                  height: 20px !important;
                  max-height: 20px !important;
                  display: flex !important;
                  align-items: center !important;
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

          {/* Right Section - Trending Topics */}
          <div style={rightSectionStyles}>
            <TrendingTopics 
              limit={3}
              compact={true}
              onTopicClick={(topic) => {
                console.log('Trending topic clicked:', topic);
                // Could navigate to search or show related content
              }}
            />
          </div>
        </div>
      );
};

export default FeedbackBar;
