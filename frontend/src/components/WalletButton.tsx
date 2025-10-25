/**
 * WalletButton Component - Base Batches Compliant
 * Integrates Coinbase Smart Wallet with Basenames support (Base requirement)
 * Uses OnchainKit as recommended by Base Batches Builder Track
 * Reference: https://base-batches-builder-track.devfolio.co/overview
 */

import { 
  ConnectWallet,
  Wallet,
  WalletDropdown,
  WalletDropdownLink,
  WalletDropdownDisconnect,
} from '@coinbase/onchainkit/wallet';
import { 
  Address,
  Avatar,
  Name,
  Identity,
  EthBalance,
} from '@coinbase/onchainkit/identity';
import { useWalletTracking } from '../hooks/useWalletTracking';

/**
 * Base-Recommended Wallet Button with Basenames Integration
 * Automatically displays Basename if user has one, otherwise shows address
 * This component satisfies Base Batches "Basenames integration" requirement
 * Styled for EAILI5's minimalist design language
 */
export function WalletButton() {
  // Track wallet connect/disconnect events with backend
  useWalletTracking();

  return (
    <div style={{
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      <div style={{
        display: 'inline-block'
      }}>
        <style>{`
          .eaili5-wallet button {
            padding: 8px 16px !important;
            font-size: 14px !important;
            background: transparent !important;
            border: 1px solid rgba(59, 130, 246, 0.3) !important;
            border-radius: 6px !important;
            color: rgba(255, 255, 255, 0.9) !important;
            min-height: 40px !important;
            transition: all 0.2s ease !important;
          }
          .eaili5-wallet button:hover {
            border-color: rgba(59, 130, 246, 0.6) !important;
            background: rgba(59, 130, 246, 0.05) !important;
          }
        `}</style>
        <div className="eaili5-wallet">
          <Wallet>
            <ConnectWallet>
              <Avatar className="h-6 w-6" />
              <Name className="text-sm" />
            </ConnectWallet>
            <WalletDropdown>
              <Identity className="px-4 pt-3 pb-2" hasCopyAddressOnClick>
                <Avatar />
                <Name />
                <Address />
                <EthBalance />
              </Identity>
              <WalletDropdownLink
                icon="wallet"
                href="https://wallet.coinbase.com"
              >
                Wallet
              </WalletDropdownLink>
              <WalletDropdownDisconnect />
            </WalletDropdown>
          </Wallet>
        </div>
      </div>
    </div>
  );
}

/**
 * Compact Wallet Button for TopBar/Header
 * Uses OnchainKit components as designed with professional styling
 */
export function CompactWalletButton() {
  // Track wallet connect/disconnect events with backend
  useWalletTracking();

  return (
    <div style={{ 
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: '14px'
    }}>
      <style>{`
        /* Target OnchainKit's actual CSS classes */
        [data-rk] button {
          font-family: 'Inter, system-ui, sans-serif' !important;
          font-weight: 500 !important;
        }
        
        /* Connect Wallet Button */
        [data-rk] button[data-testid="connect-wallet-button"] {
          padding: 6px 12px !important;
          font-size: 13px !important;
          background: rgba(59, 130, 246, 0.2) !important;
          border: 1px solid rgba(59, 130, 246, 0.5) !important;
          border-radius: 6px !important;
          color: #ffffff !important;
          min-height: 36px !important;
          transition: all 200ms ease !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 8px !important;
        }
        
        [data-rk] button[data-testid="connect-wallet-button"]:hover {
          border-color: rgba(59, 130, 246, 0.8) !important;
          background: rgba(59, 130, 246, 0.3) !important;
          transform: translateY(-1px) !important;
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3) !important;
        }
        
        /* Wallet Dropdown */
        [data-rk] [role="menu"] {
          z-index: 1000 !important;
          background: rgba(20, 20, 20, 0.95) !important;
          backdrop-filter: blur(10px) !important;
          border: 1px solid rgba(59, 130, 246, 0.3) !important;
          border-radius: 8px !important;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3) !important;
          padding: 16px !important;
          min-width: 280px !important;
        }
        
        /* Identity Section */
        [data-rk] [data-testid="identity"] {
          padding-bottom: 16px !important;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
          margin-bottom: 16px !important;
        }
        
        [data-rk] [data-testid="identity"] * {
          font-family: 'Inter, system-ui, sans-serif' !important;
        }
        
        [data-rk] [data-testid="identity"] [data-testid="name"] {
          font-size: 16px !important;
          font-weight: 600 !important;
          color: #ffffff !important;
        }
        
        [data-rk] [data-testid="identity"] [data-testid="address"] {
          font-size: 12px !important;
          color: rgba(255, 255, 255, 0.7) !important;
        }
        
        [data-rk] [data-testid="identity"] [data-testid="balance"] {
          font-size: 14px !important;
          font-weight: 500 !important;
          color: rgba(255, 255, 255, 0.9) !important;
        }
        
        /* Disconnect Button */
        [data-rk] [data-testid="disconnect-button"] {
          color: #ff6b6b !important;
          font-weight: 600 !important;
          border-top: 1px solid rgba(255, 255, 255, 0.1) !important;
          margin-top: 8px !important;
          padding-top: 16px !important;
        }
        
        [data-rk] [data-testid="disconnect-button"]:hover {
          background: rgba(255, 107, 107, 0.1) !important;
          color: #ff5252 !important;
        }
        
        /* Mobile Responsive */
        @media (max-width: 768px) {
          [data-rk] button[data-testid="connect-wallet-button"] {
            padding: 8px 12px !important;
            font-size: 12px !important;
            min-height: 44px !important;
            min-width: 44px !important;
          }
          
          /* Hide name on very small screens, show only avatar */
          @media (max-width: 480px) {
            [data-rk] button[data-testid="connect-wallet-button"] [data-testid="name"] {
              display: none !important;
            }
            
            [data-rk] button[data-testid="connect-wallet-button"] {
              padding: 8px !important;
              width: 44px !important;
              height: 44px !important;
              min-height: 44px !important;
              min-width: 44px !important;
            }
          }
          
          [data-rk] [role="menu"] {
            min-width: 260px !important;
            padding: 12px !important;
          }
        }
      `}</style>
      <div style={{ position: 'relative', zIndex: 50 }}>
        <Wallet>
          <ConnectWallet>
            <Avatar className="h-4 w-4" />
            <Name className="text-sm font-medium" />
          </ConnectWallet>
          <WalletDropdown>
            <Identity hasCopyAddressOnClick>
              <Avatar />
              <Name />
              <Address />
              <EthBalance />
            </Identity>
            <WalletDropdownDisconnect />
          </WalletDropdown>
        </Wallet>
      </div>
    </div>
  );
}

/**
 * Basenames Display Component
 * Shows Basename if available, otherwise shows truncated address
 * Use this for read-only display of addresses
 */
export function BasenameDisplay({ address }: { address?: `0x${string}` }) {
  if (!address) return null;

  return (
    <div className="flex items-center gap-2">
      <Avatar address={address} className="h-8 w-8" />
      <Name address={address} className="text-sm font-medium" />
    </div>
  );
}

// Re-export OnchainKit components for convenience
export { Avatar, Name, Identity, EthBalance, Address } from '@coinbase/onchainkit/identity';

