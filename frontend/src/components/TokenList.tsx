import React, { useState } from 'react';
import { Search, TrendingUp, TrendingDown, ChevronDown } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { ProInput } from './pro';
import { Token } from '../hooks/useTokenData';

interface TokenListProps {
  tokens: Token[];
  selectedToken: Token | null;
  onSelectToken: (token: Token) => void;
  loading?: boolean;
  category?: string;
  onCategoryChange?: (category: string) => void;
}

const TokenList: React.FC<TokenListProps> = ({ 
  tokens, 
  selectedToken, 
  onSelectToken,
  loading = false,
  category = 'top15',
  onCategoryChange
}) => {
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const categories = [
    { id: 'top15', label: 'Top 15', description: 'Most active tokens' },
    { id: 'trending', label: 'Trending', description: 'Rising in popularity' },
    { id: 'volume', label: 'High Volume', description: 'Highest trading volume' },
    { id: 'new', label: 'New Tokens', description: 'Recently discovered' }
  ];

  const filteredTokens = tokens.filter(token =>
    token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    token.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const containerStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    background: theme.surface.primary,
    borderRight: `1px solid ${theme.border.primary}`,
    width: '280px',
    overflow: 'hidden',
  };

  const headerStyles: React.CSSProperties = {
    padding: '16px',
    borderBottom: `1px solid ${theme.border.primary}`,
  };

  const titleStyles: React.CSSProperties = {
    fontSize: '14px',
    fontWeight: 600,
    color: theme.text.primary,
    marginBottom: '12px',
    fontFamily: 'Inter, system-ui, sans-serif',
  };

  const listContainerStyles: React.CSSProperties = {
    flex: 1,
    overflowY: 'auto',
    padding: '8px',
  };

  const tokenItemStyles = (isSelected: boolean): React.CSSProperties => ({
    padding: '12px',
    background: isSelected ? theme.surface.secondary : 'transparent',
    border: `1px solid ${isSelected ? theme.border.secondary : 'transparent'}`,
    borderRadius: '6px',
    marginBottom: '4px',
    cursor: 'pointer',
    transition: 'all 150ms ease',
  });

  const tokenHeaderStyles: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '4px',
  };

  const symbolStyles: React.CSSProperties = {
    fontSize: '14px',
    fontWeight: 600,
    color: theme.text.primary,
    fontFamily: 'Inter, system-ui, sans-serif',
  };

  const priceStyles: React.CSSProperties = {
    fontSize: '14px',
    fontWeight: 500,
    color: theme.text.primary,
    fontFamily: 'JetBrains Mono, monospace',
  };

  const changeStyles = (change: number): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '12px',
    fontWeight: 500,
    color: change >= 0 ? theme.accent.green : theme.accent.red,
    fontFamily: 'JetBrains Mono, monospace',
  });

  const formatPrice = (token: Token) => {
    // Use formatted price from backend if available, otherwise format locally
    if (token.priceFormatted) {
      return `$${token.priceFormatted}`;
    }
    const price = token.price;
    if (price === 0) return '$0.00';
    if (price < 0.01) return `$${price.toFixed(6)}`;
    if (price < 1) return `$${price.toFixed(4)}`;
    return `$${price.toFixed(2)}`;
  };

  const formatChange = (change: number) => {
    return `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
  };

  return (
    <div style={containerStyles}>
      <div style={headerStyles}>
        <div style={titleStyles}>Tokens</div>
        
        {/* Category Dropdown */}
        <div style={{ position: 'relative', marginBottom: '12px' }}>
          <div
            onClick={() => setShowDropdown(!showDropdown)}
            style={{
              width: '100%',
              padding: '8px 12px',
              background: theme.surface.primary,
              border: `1px solid ${theme.border.primary}`,
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '14px',
              color: theme.text.primary,
              transition: 'all 150ms ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = theme.surface.secondary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = theme.surface.primary;
            }}
          >
            <span>{categories.find(c => c.id === category)?.label}</span>
            <ChevronDown className="w-4 h-4" />
          </div>
          
          {showDropdown && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              background: theme.surface.primary,
              border: `1px solid ${theme.border.primary}`,
              borderRadius: '6px',
              zIndex: 1000,
              marginTop: '4px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
            }}>
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  onClick={() => {
                    if (onCategoryChange) {
                      onCategoryChange(cat.id);
                    }
                    setShowDropdown(false);
                  }}
                  style={{
                    padding: '12px',
                    cursor: 'pointer',
                    borderBottom: `1px solid ${theme.border.primary}`,
                    background: category === cat.id ? theme.surface.secondary : 'transparent',
                    transition: 'background 150ms ease'
                  }}
                  onMouseEnter={(e) => {
                    if (category !== cat.id) {
                      e.currentTarget.style.background = theme.surface.secondary;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (category !== cat.id) {
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                >
                  <div style={{ fontSize: '14px', fontWeight: 500, color: theme.text.primary }}>
                    {cat.label}
                  </div>
                  <div style={{ fontSize: '12px', color: theme.text.tertiary, marginTop: '2px' }}>
                    {cat.description}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <ProInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search..."
          icon={<Search className="w-4 h-4" />}
        />
      </div>

      <div style={listContainerStyles}>
        {loading ? (
          <div style={{ padding: '20px', textAlign: 'center', color: theme.text.secondary }}>
            Loading tokens...
          </div>
        ) : filteredTokens.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: theme.text.secondary }}>
            No tokens found
          </div>
        ) : (
          filteredTokens.map((token) => (
            <div
              key={token.address}
              style={tokenItemStyles(selectedToken?.address === token.address)}
              onClick={() => onSelectToken(token)}
              onMouseEnter={(e) => {
                if (selectedToken?.address !== token.address) {
                  e.currentTarget.style.background = theme.surface.secondary;
                }
              }}
              onMouseLeave={(e) => {
                if (selectedToken?.address !== token.address) {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              <div style={tokenHeaderStyles}>
                <div>
                  <div style={symbolStyles}>{token.symbol}</div>
                  <div style={{ fontSize: '11px', color: theme.text.tertiary }}>
                    {token.name}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={priceStyles}>{formatPrice(token)}</div>
                  <div style={changeStyles(token.priceChange24h)}>
                    {token.priceChange24h >= 0 ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {formatChange(token.priceChange24h)}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TokenList;

