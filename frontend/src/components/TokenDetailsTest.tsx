import React, { useState } from 'react';
import { 
  Info, 
  TrendingUp, 
  BarChart3, 
  Globe, 
  Star, 
  BookOpen,
  RefreshCw,
  ExternalLink,
  Copy,
  Check
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { ProButton } from './pro';
import TokenDetailsTabs from './TokenDetailsTabs';
import EnhancedTokenInfo from './EnhancedTokenInfo';
import LearningDashboard from './LearningDashboard';
import { useTokenList } from '../hooks/useChartData';

const TokenDetailsTest: React.FC = () => {
  const { theme } = useTheme();
  const [selectedToken, setSelectedToken] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'tabs' | 'enhanced' | 'learning'>('tabs');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  
  const { tokens, loading: tokensLoading, error: tokensError, refetch } = useTokenList('top15', 15);

  const handleTokenSelect = (token: any) => {
    setSelectedToken(token);
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const formatPrice = (price: number) => {
    if (price === 0) return '$0.00';
    if (price < 0.000001) return `$${price.toFixed(8)}`;
    if (price < 0.01) return `$${price.toFixed(6)}`;
    if (price < 1) return `$${price.toFixed(4)}`;
    return `$${price.toFixed(2)}`;
  };

  const containerStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    background: theme.surface.primary,
    padding: '20px',
    gap: '20px',
  };

  const headerStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    background: theme.surface.secondary,
    borderRadius: '12px',
    border: `1px solid ${theme.border.primary}`,
  };

  const titleStyles: React.CSSProperties = {
    fontSize: '20px',
    fontWeight: 600,
    color: theme.text.primary,
    fontFamily: 'Inter, system-ui, sans-serif',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  };

  const controlsStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  };

  const mainContentStyles: React.CSSProperties = {
    display: 'flex',
    gap: '20px',
    height: 'calc(100vh - 200px)',
  };

  const sidebarStyles: React.CSSProperties = {
    width: '350px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  };

  const tokenListStyles: React.CSSProperties = {
    background: theme.surface.secondary,
    borderRadius: '12px',
    border: `1px solid ${theme.border.primary}`,
    padding: '16px',
    maxHeight: '400px',
    overflowY: 'auto',
  };

  const tokenItemStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 150ms ease',
    border: '1px solid transparent',
    marginBottom: '8px',
  };

  const selectedTokenStyles: React.CSSProperties = {
    background: theme.accent.blue,
    color: theme.surface.primary,
    borderColor: theme.accent.blue,
  };

  const tokenNameStyles: React.CSSProperties = {
    fontSize: '14px',
    fontWeight: 500,
    color: 'inherit',
    fontFamily: 'Inter, system-ui, sans-serif',
  };

  const tokenPriceStyles: React.CSSProperties = {
    fontSize: '12px',
    fontFamily: 'JetBrains Mono, monospace',
    color: 'inherit',
  };

  const tabContainerStyles: React.CSSProperties = {
    flex: 1,
    background: theme.surface.secondary,
    borderRadius: '12px',
    border: `1px solid ${theme.border.primary}`,
    overflow: 'hidden',
  };

  const tabButtonsStyles: React.CSSProperties = {
    display: 'flex',
    gap: '4px',
    padding: '16px 20px',
    borderBottom: `1px solid ${theme.border.primary}`,
    background: theme.surface.primary,
  };

  const tabButtonStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    borderRadius: '8px',
    border: 'none',
    background: 'transparent',
    color: theme.text.secondary,
    cursor: 'pointer',
    transition: 'all 150ms ease',
    fontSize: '14px',
    fontWeight: 500,
    fontFamily: 'Inter, system-ui, sans-serif',
  };

  const activeTabStyles: React.CSSProperties = {
    background: theme.accent.blue,
    color: theme.surface.primary,
  };

  const contentStyles: React.CSSProperties = {
    flex: 1,
    overflowY: 'auto',
  };

  const tokenInfoStyles: React.CSSProperties = {
    background: theme.surface.secondary,
    borderRadius: '12px',
    border: `1px solid ${theme.border.primary}`,
    padding: '16px',
  };

  const infoRowStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 0',
    borderBottom: `1px solid ${theme.border.primary}`,
  };

  const infoLabelStyles: React.CSSProperties = {
    fontSize: '14px',
    color: theme.text.secondary,
    fontFamily: 'Inter, system-ui, sans-serif',
  };

  const infoValueStyles: React.CSSProperties = {
    fontSize: '14px',
    fontWeight: 500,
    color: theme.text.primary,
    fontFamily: 'JetBrains Mono, monospace',
  };

  const copyButtonStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 8px',
    borderRadius: '6px',
    border: 'none',
    background: 'transparent',
    color: theme.text.secondary,
    cursor: 'pointer',
    fontSize: '12px',
    transition: 'all 150ms ease',
  };

  return (
    <div style={containerStyles}>
      <div style={headerStyles}>
        <h2 style={titleStyles}>
          <Info className="w-6 h-6" />
          Token Details Test
        </h2>
        <div style={controlsStyles}>
          <ProButton
            variant="ghost"
            size="sm"
            onClick={refetch}
            disabled={tokensLoading}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className={`w-4 h-4 ${tokensLoading ? 'animate-spin' : ''}`} />
            Refresh
          </ProButton>
        </div>
      </div>

      <div style={mainContentStyles}>
        {/* Sidebar */}
        <div style={sidebarStyles}>
          {/* Token List */}
          <div style={tokenListStyles}>
            <h3 style={{
              fontSize: '16px',
              fontWeight: 600,
              color: theme.text.primary,
              marginBottom: '12px',
              fontFamily: 'Inter, system-ui, sans-serif',
            }}>
              Select Token
            </h3>
            
            {tokensLoading ? (
              <div style={{ textAlign: 'center', color: theme.text.secondary, padding: '20px' }}>
                Loading tokens...
              </div>
            ) : tokensError ? (
              <div style={{ textAlign: 'center', color: theme.accent.red, padding: '20px' }}>
                Error: {tokensError}
              </div>
            ) : (
              tokens.map((token) => (
                <div
                  key={token.address}
                  style={{
                    ...tokenItemStyles,
                    ...(selectedToken?.address === token.address ? selectedTokenStyles : {}),
                  }}
                  onClick={() => handleTokenSelect(token)}
                  onMouseEnter={(e) => {
                    if (selectedToken?.address !== token.address) {
                      e.currentTarget.style.background = theme.surface.tertiary;
                      e.currentTarget.style.borderColor = theme.border.primary;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedToken?.address !== token.address) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.borderColor = 'transparent';
                    }
                  }}
                >
                  <div>
                    <div style={tokenNameStyles}>{token.symbol}</div>
                    <div style={{ fontSize: '12px', color: 'inherit', opacity: 0.7 }}>
                      {token.name}
                    </div>
                  </div>
                  <div style={tokenPriceStyles}>
                    {formatPrice(token.price)}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Selected Token Info */}
          {selectedToken && (
            <div style={tokenInfoStyles}>
              <h4 style={{
                fontSize: '16px',
                fontWeight: 600,
                color: theme.text.primary,
                marginBottom: '12px',
                fontFamily: 'Inter, system-ui, sans-serif',
              }}>
                Token Information
              </h4>
              
              <div style={infoRowStyles}>
                <span style={infoLabelStyles}>Symbol</span>
                <span style={infoValueStyles}>{selectedToken.symbol}</span>
              </div>
              
              <div style={infoRowStyles}>
                <span style={infoLabelStyles}>Price</span>
                <span style={infoValueStyles}>{formatPrice(selectedToken.price)}</span>
              </div>
              
              <div style={infoRowStyles}>
                <span style={infoLabelStyles}>24h Change</span>
                <span style={{
                  ...infoValueStyles,
                  color: selectedToken.priceChange24h >= 0 ? theme.accent.green : theme.accent.red
                }}>
                  {selectedToken.priceChange24h >= 0 ? '+' : ''}{selectedToken.priceChange24h.toFixed(2)}%
                </span>
              </div>
              
              <div style={infoRowStyles}>
                <span style={infoLabelStyles}>Market Cap</span>
                <span style={infoValueStyles}>
                  ${selectedToken.marketCap ? selectedToken.marketCap.toLocaleString() : 'N/A'}
                </span>
              </div>
              
              <div style={infoRowStyles}>
                <span style={infoLabelStyles}>Volume (24h)</span>
                <span style={infoValueStyles}>
                  ${selectedToken.volume24h ? selectedToken.volume24h.toLocaleString() : 'N/A'}
                </span>
              </div>
              
              <div style={infoRowStyles}>
                <span style={infoLabelStyles}>Address</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={infoValueStyles}>
                    {selectedToken.address.substring(0, 6)}...{selectedToken.address.substring(selectedToken.address.length - 4)}
                  </span>
                  <button
                    style={copyButtonStyles}
                    onClick={() => copyToClipboard(selectedToken.address, 'address')}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = theme.surface.tertiary;
                      e.currentTarget.style.color = theme.text.primary;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = theme.text.secondary;
                    }}
                  >
                    {copiedField === 'address' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div style={tabContainerStyles}>
          <div style={tabButtonsStyles}>
            <button
              style={{
                ...tabButtonStyles,
                ...(activeTab === 'tabs' ? activeTabStyles : {}),
              }}
              onClick={() => setActiveTab('tabs')}
            >
              <Info className="w-4 h-4" />
              Token Details Tabs
            </button>
            
            <button
              style={{
                ...tabButtonStyles,
                ...(activeTab === 'enhanced' ? activeTabStyles : {}),
              }}
              onClick={() => setActiveTab('enhanced')}
            >
              <BarChart3 className="w-4 h-4" />
              Enhanced Info
            </button>
            
            <button
              style={{
                ...tabButtonStyles,
                ...(activeTab === 'learning' ? activeTabStyles : {}),
              }}
              onClick={() => setActiveTab('learning')}
            >
              <BookOpen className="w-4 h-4" />
              Learning Dashboard
            </button>
          </div>
          
          <div style={contentStyles}>
            {activeTab === 'tabs' && (
              <TokenDetailsTabs 
                token={selectedToken} 
              />
            )}
            
            {activeTab === 'enhanced' && (
              <EnhancedTokenInfo token={selectedToken} />
            )}
            
            {activeTab === 'learning' && (
              <LearningDashboard userId="test-user" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TokenDetailsTest;
