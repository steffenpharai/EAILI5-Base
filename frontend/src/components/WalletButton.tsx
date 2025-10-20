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

/**
 * Base-Recommended Wallet Button with Basenames Integration
 * Automatically displays Basename if user has one, otherwise shows address
 * This component satisfies Base Batches "Basenames integration" requirement
 * Styled for EAILI5's minimalist design language
 */
export function WalletButton() {
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
 * Styled to match EAILI5 minimalist, line-driven design
 */
export function CompactWalletButton() {
  return (
    <div style={{ 
      fontSize: '12px',
      fontFamily: 'JetBrains Mono, monospace'
    }}>
      <style>{`
        .eaili5-compact-wallet button {
          padding: 6px 12px !important;
          font-size: 12px !important;
          font-family: 'JetBrains Mono', monospace !important;
          background: transparent !important;
          border: 1px solid rgba(59, 130, 246, 0.3) !important;
          border-radius: 4px !important;
          color: rgba(255, 255, 255, 0.9) !important;
          min-height: 32px !important;
          transition: all 0.2s ease !important;
        }
        .eaili5-compact-wallet button:hover {
          border-color: rgba(59, 130, 246, 0.6) !important;
          background: rgba(59, 130, 246, 0.05) !important;
        }
        .eaili5-compact-wallet span {
          font-family: 'JetBrains Mono', monospace !important;
          font-size: 12px !important;
        }
      `}</style>
      <div className="eaili5-compact-wallet">
        <Wallet>
          <ConnectWallet>
            <Avatar className="h-4 w-4" />
            <Name className="text-xs font-mono" />
          </ConnectWallet>
          <WalletDropdown>
            <Identity className="px-4 pt-3 pb-2" hasCopyAddressOnClick>
              <Avatar />
              <Name />
              <Address className="text-xs font-mono" />
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

