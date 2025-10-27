import React, { useState, useEffect } from 'react';
import { Search, TrendingUp, TrendingDown, ChevronDown, X, ChevronLeft, ChevronRight, LayoutDashboard } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useMobile } from '../hooks/useMobile';
import { useMobileDrawer } from '../hooks/useMobileLayout';
import { useTokenWebSocket } from '../hooks/useTokenWebSocket';
import { Z_INDEX } from '../utils/zIndex';
import { ProInput } from './pro';
import { Token } from '../hooks/useTokenData';

interface TokenListProps {
  tokens: Token[];
  selectedToken: Token | null;
  onSelectToken: (token: Token) => void;
  loading?: boolean;
  category?: string;
  onCategoryChange?: (category: string) => void;
  isMobileDrawerOpen?: boolean;
  onMobileDrawerToggle?: () => void;
  onDashboardClick?: () => void;
}

const TokenList: React.FC<TokenListProps> = ({ 
  tokens, 
  selectedToken, 
  onSelectToken,
  loading = false,
  category = 'top15',
  onCategoryChange,
  isMobileDrawerOpen = false,
  onMobileDrawerToggle,
  onDashboardClick
}) => {
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const isMobile = useMobile();
  const { getDrawerStyles, getBackdropStyles } = useMobileDrawer();
  const { tokenUpdates } = useTokenWebSocket();
  
  // Drawer state for desktop
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);
  
  // Load drawer state from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('eaili5_tokenlist_drawer_open');
    if (stored !== null) {
      setIsDrawerOpen(JSON.parse(stored));
    }
  }, []);
  
  // Persist drawer state to localStorage
  useEffect(() => {
    localStorage.setItem('eaili5_tokenlist_drawer_open', JSON.stringify(isDrawerOpen));
  }, [isDrawerOpen]);
  
  const toggleDrawer = () => {
    setIsDrawerOpen(!isDrawerOpen);
  };

  const categories = [
    { id: 'top15', label: 'Top 15', description: 'Most active tokens' },
    { id: 'trending', label: 'Trending', description: 'Rising in popularity' },
    { id: 'volume', label: 'High Volume', description: 'Highest trading volume' },
    { id: 'new', label: 'New Tokens', description: 'Recently discovered' }
  ];

  // Get real-time token data if available
  const getTokenWithRealtimeData = (token: Token) => {
    const realtimeData = tokenUpdates.get(token.address);
    if (realtimeData) {
      return {
        ...token,
        price: realtimeData.price || token.price,
        priceChange24h: realtimeData.priceChange24h || token.priceChange24h,
        volume24h: realtimeData.volume24h || token.volume24h,
        lastUpdate: realtimeData.lastUpdate
      };
    }
    return token;
  };

  const filteredTokens = tokens.filter(token => 
    token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    token.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const containerStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    height: isMobile ? 'auto' : '100%',
    background: theme.surface.primary,
    borderRight: isMobile ? 'none' : `1px solid ${theme.border.primary}`,
    width: isMobile ? '100%' : '300px',
    overflow: 'hidden',
    flexShrink: 0,
    margin: '0',
    padding: '0',
    gap: 0,
    // Mobile drawer styles using mobile layout system
    ...(isMobile && {
      ...getDrawerStyles(isMobileDrawerOpen),
      // Additional safe area padding for mobile drawer
      paddingBottom: 'max(20px, env(safe-area-inset-bottom))',
    }),
  };

  const headerStyles: React.CSSProperties = {
    padding: isMobile ? '20px 16px 16px' : '16px',
    borderBottom: `1px solid ${theme.border.primary}`,
    position: 'relative',
    // Safe area insets for mobile drawer
    ...(isMobile && {
      paddingTop: 'max(20px, env(safe-area-inset-top) + 20px)',
      paddingBottom: 'max(16px, env(safe-area-inset-bottom) + 16px)',
      paddingLeft: 'max(16px, env(safe-area-inset-left))',
      paddingRight: 'max(16px, env(safe-area-inset-right))',
    }),
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
    padding: isMobile ? '18px 16px' : '14px 12px',
    background: isSelected ? theme.surface.secondary : 'transparent',
    border: `1px solid ${isSelected ? theme.border.secondary : 'transparent'}`,
    borderRadius: '6px',
    marginBottom: '8px',
    cursor: 'pointer',
    transition: 'all 150ms ease',
    minHeight: isMobile ? '44px' : 'auto', // Touch-friendly minimum height
    display: 'flex',
    alignItems: 'center',
  });

  const tokenHeaderStyles: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    gap: '16px', // Space between name and price
    marginBottom: '4px',
  };

  const symbolStyles: React.CSSProperties = {
    fontSize: '14px',
    fontWeight: 600,
    color: theme.text.primary,
    fontFamily: 'Inter, system-ui, sans-serif',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };

  const tokenNameContainerStyles: React.CSSProperties = {
    flex: 1,
    minWidth: 0, // Allow flex shrinking
    overflow: 'hidden',
  };

  const tokenNameStyles: React.CSSProperties = {
    fontSize: '11px',
    color: theme.text.tertiary,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };

  const priceContainerStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    minWidth: '90px', // Ensure consistent width for prices
    textAlign: 'right',
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

  // For mobile, use bottom drawer with FAB
  if (isMobile) {
    return (
      <>
        {/* Mobile backdrop - only show when drawer is open */}
        {isMobileDrawerOpen && <div style={getBackdropStyles(true)} onClick={onMobileDrawerToggle} />}
        
        <div style={containerStyles}>
        <div style={headerStyles}>
          {/* Mobile drawer handle */}
          <div style={{
            position: 'absolute',
            top: '8px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '40px',
            height: '4px',
            background: theme.border.primary,
            borderRadius: '2px',
            marginBottom: '12px',
          }} />
          
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px',
          }}>
            <div style={titleStyles}>Tokens</div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {onDashboardClick && (
                <button
                  onClick={onDashboardClick}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 12px',
                    background: 'transparent',
                    border: `1px solid ${theme.border.primary}`,
                    borderRadius: '6px',
                    color: theme.text.secondary,
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 500,
                    transition: 'all 150ms ease',
                    minHeight: '44px',
                    minWidth: '44px',
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                  aria-label="Open Dashboard"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  {!isMobile && <span>Dashboard</span>}
                </button>
              )}
              {onMobileDrawerToggle && (
                <button
                  onClick={onMobileDrawerToggle}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: theme.text.primary,
                    cursor: 'pointer',
                    padding: '8px',
                    borderRadius: '4px',
                    minWidth: '44px',
                    minHeight: '44px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <X size={20} />
                </button>
              )}
            </div>
          </div>
          
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
                zIndex: Z_INDEX.drawer,
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
            <div style={{ 
              flex: 1,                              // ✅ Fill available space
              display: 'flex',                       // ✅ Flexbox for centering
              alignItems: 'center',                  // ✅ Vertical center
              justifyContent: 'center',              // ✅ Horizontal center
              padding: '40px 20px',
              textAlign: 'center',
              color: theme.text.tertiary,
              fontSize: '14px',
              background: theme.background.primary,  // ✅ Extend gray background
            }}>
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
                  <div style={tokenNameContainerStyles}>
                    <div style={symbolStyles}>{token.symbol}</div>
                    <div style={tokenNameStyles}>
                      {token.name}
                    </div>
                  </div>
                  <div style={priceContainerStyles}>
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
      </>
    );
  }

  // For desktop, use resizing sidebar (not overlay)
  const sidebarStyles: React.CSSProperties = {
    width: isDrawerOpen ? '280px' : '0px',
    minWidth: isDrawerOpen ? '280px' : '0px',
    maxWidth: isDrawerOpen ? '280px' : '0px',
    overflow: 'hidden',
    transition: 'all 300ms ease-in-out',
    background: theme.surface.primary,
    borderRight: isDrawerOpen ? `1px solid ${theme.border.primary}` : 'none',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',      // ✅ KEEP: Fill parent height
    position: 'relative', // Not fixed
    flexShrink: 0
  };


  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',  // ✅ ADD: Vertical layout for proper height flow
      height: '100%',            // ✅ Fill parent (mainContentStyles) height
      position: 'relative',      // ✅ Positioning context
      flexShrink: 0,            // ✅ Don't shrink in flex parent
      overflow: 'hidden',       // ✅ ADD: Contain children properly
      minHeight: '100%',        // ✅ ADD: Ensure minimum height
    }}>
      {/* Toggle Button - Always visible, positioned outside sidebar */}
      <button
        style={{
          position: 'fixed',
          left: isDrawerOpen ? '258px' : '0px', // 280px - 22px when open, 0px when closed
          top: '50%',
          transform: 'translateY(-50%)',
          width: '44px',
          height: '44px',
          background: theme.surface.secondary,
          border: `1px solid ${theme.border.primary}`,
          borderRadius: '50%',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: theme.text.primary,
          transition: 'all 300ms ease-in-out',
          zIndex: 1000,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
          minHeight: '44px',
          minWidth: '44px',
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent'
        }}
        onClick={toggleDrawer}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = theme.surface.tertiary;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = theme.surface.secondary;
        }}
        onTouchStart={(e) => {
          e.currentTarget.style.transform = 'translateY(-50%) scale(0.95)';
        }}
        onTouchEnd={(e) => {
          e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
        }}
        aria-label={isDrawerOpen ? 'Close token list' : 'Open token list'}
        title={isDrawerOpen ? 'Close token list' : 'Open token list'}
      >
        {isDrawerOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>

      <div style={sidebarStyles}>

      {/* Sidebar Content */}
      <div style={{
        width: '280px',
        minWidth: '280px',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden'
      }}>
        <div style={headerStyles}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px',
        }}>
          <div style={titleStyles}>Tokens</div>
          {onDashboardClick && (
            <button
              onClick={onDashboardClick}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 12px',
                background: 'transparent',
                border: `1px solid ${theme.border.primary}`,
                borderRadius: '6px',
                color: theme.text.secondary,
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 500,
                transition: 'all 150ms ease',
                minHeight: '44px',
                minWidth: '44px',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
              }}
              aria-label="Open Dashboard"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </button>
          )}
        </div>
        
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
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      if (onCategoryChange) {
                        onCategoryChange(cat.id);
                      }
                      setShowDropdown(false);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={`Select ${cat.label} category`}
                  style={{
                    padding: '12px',
                    cursor: 'pointer',
                    borderBottom: `1px solid ${theme.border.primary}`,
                    background: category === cat.id ? theme.surface.secondary : 'transparent',
                    transition: 'background 150ms ease',
                    minHeight: '44px', // Ensure touch target compliance
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center'
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
          <div style={{ 
            flex: 1,                              // ✅ Fill available space
            display: 'flex',                       // ✅ Flexbox for centering
            alignItems: 'center',                  // ✅ Vertical center
            justifyContent: 'center',              // ✅ Horizontal center
            padding: '40px 20px',
            textAlign: 'center',
            color: theme.text.tertiary,
            fontSize: '14px',
            background: theme.background.primary,  // ✅ Extend gray background
          }}>
            No tokens found
          </div>
        ) : (
                filteredTokens.map((token) => {
                  const tokenWithRealtime = getTokenWithRealtimeData(token);
                  return (
                    <div
                      key={token.address}
                      style={tokenItemStyles(selectedToken?.address === token.address)}
                      onClick={() => onSelectToken(tokenWithRealtime)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onSelectToken(tokenWithRealtime);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      aria-label={`Select ${token.name} (${token.symbol}) token`}
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
                <div style={tokenNameContainerStyles}>
                  <div style={symbolStyles}>{token.symbol}</div>
                  <div style={tokenNameStyles}>
                    {token.name}
                  </div>
                </div>
                <div style={priceContainerStyles}>
                  <div style={priceStyles}>{formatPrice(tokenWithRealtime)}</div>
                  <div style={changeStyles(tokenWithRealtime.priceChange24h)}>
                    {tokenWithRealtime.priceChange24h >= 0 ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {formatChange(tokenWithRealtime.priceChange24h)}
                    {tokenWithRealtime.lastUpdate && (
                      <span style={{ 
                        fontSize: '10px', 
                        color: theme.text.tertiary,
                        marginLeft: '4px'
                      }}>
                        🔴
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })
        )}
      </div>
    </div>  {/* Close inner 280px container */}
    </div>  {/* Close outer sidebar */}
    </div>
  );
};

export default TokenList;

