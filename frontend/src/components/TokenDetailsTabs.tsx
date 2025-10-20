import React, { useState } from 'react';
import { TrendingUp, BarChart3, BookOpen, Globe, Star, Info } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { ProButton } from './pro';
import { Token } from '../hooks/useTokenData';

interface TokenDetailsTabsProps {
  token: Token | null;
  onTabChange?: (tab: string) => void;
}

type TabType = 'overview' | 'chart' | 'details' | 'social' | 'news' | 'learning';

const TokenDetailsTabs: React.FC<TokenDetailsTabsProps> = ({ token, onTabChange }) => {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  const tabs = [
    {
      id: 'overview' as TabType,
      label: 'Overview',
      icon: <Info className="w-4 h-4" />,
      description: 'Basic token information'
    },
    {
      id: 'chart' as TabType,
      label: 'Chart',
      icon: <TrendingUp className="w-4 h-4" />,
      description: 'Price charts and technical analysis'
    },
    {
      id: 'details' as TabType,
      label: 'Details',
      icon: <BarChart3 className="w-4 h-4" />,
      description: 'Market data and metrics'
    },
    {
      id: 'social' as TabType,
      label: 'Social',
      icon: <Globe className="w-4 h-4" />,
      description: 'Community and social sentiment'
    },
    {
      id: 'news' as TabType,
      label: 'News',
      icon: <Star className="w-4 h-4" />,
      description: 'Latest news and updates'
    },
    {
      id: 'learning' as TabType,
      label: 'Learn',
      icon: <BookOpen className="w-4 h-4" />,
      description: 'Educational content about this token'
    }
  ];

  const handleTabClick = (tab: TabType) => {
    setActiveTab(tab);
    onTabChange?.(tab);
  };

  const containerStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    background: theme.surface.primary,
  };

  const headerStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    borderBottom: `1px solid ${theme.border.primary}`,
    background: theme.surface.secondary,
  };

  const tokenInfoStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  };

  const tokenNameStyles: React.CSSProperties = {
    fontSize: '18px',
    fontWeight: 600,
    color: theme.text.primary,
    fontFamily: 'Inter, system-ui, sans-serif',
  };

  const priceStyles: React.CSSProperties = {
    fontSize: '16px',
    fontWeight: 500,
    color: theme.text.primary,
    fontFamily: 'JetBrains Mono, monospace',
  };

  const tabsContainerStyles: React.CSSProperties = {
    display: 'flex',
    gap: '4px',
    overflowX: 'auto',
    padding: '12px 20px',
    borderBottom: `1px solid ${theme.border.primary}`,
    background: theme.surface.primary,
  };

  const tabButtonStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 12px',
    borderRadius: '8px',
    border: 'none',
    background: 'transparent',
    color: theme.text.secondary,
    cursor: 'pointer',
    transition: 'all 150ms ease',
    whiteSpace: 'nowrap',
    fontSize: '13px',
    fontWeight: 500,
    fontFamily: 'Inter, system-ui, sans-serif',
  };

  const activeTabStyles: React.CSSProperties = {
    background: theme.accent.blue,
    color: theme.surface.primary,
  };

  const contentStyles: React.CSSProperties = {
    flex: 1,
    padding: '20px',
    overflowY: 'auto',
  };

  const formatPrice = (token: Token | null) => {
    if (!token) return '$0.00';
    
    if (token.priceFormatted) {
      return `$${token.priceFormatted}`;
    }
    
    const price = token.price;
    if (price === 0) return '$0.00';
    if (price < 0.000001) return `$${price.toFixed(8)}`;
    if (price < 0.01) return `$${price.toFixed(6)}`;
    if (price < 1) return `$${price.toFixed(4)}`;
    return `$${price.toFixed(2)}`;
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div style={{ textAlign: 'center', color: theme.text.tertiary }}>
            <Info className="w-12 h-12 mx-auto mb-4" style={{ color: theme.text.tertiary }} />
            <p>Overview content will be displayed here</p>
            <p style={{ fontSize: '14px', marginTop: '8px' }}>
              Basic token information, market cap, volume, and key metrics
            </p>
          </div>
        );
      
      case 'chart':
        return (
          <div style={{ textAlign: 'center', color: theme.text.tertiary }}>
            <TrendingUp className="w-12 h-12 mx-auto mb-4" style={{ color: theme.text.tertiary }} />
            <p>Chart content will be displayed here</p>
            <p style={{ fontSize: '14px', marginTop: '8px' }}>
              Interactive price charts with technical indicators
            </p>
          </div>
        );
      
      case 'details':
        return (
          <div style={{ textAlign: 'center', color: theme.text.tertiary }}>
            <BarChart3 className="w-12 h-12 mx-auto mb-4" style={{ color: theme.text.tertiary }} />
            <p>Details content will be displayed here</p>
            <p style={{ fontSize: '14px', marginTop: '8px' }}>
              Comprehensive market data, metrics, and analysis
            </p>
          </div>
        );
      
      case 'social':
        return (
          <div style={{ textAlign: 'center', color: theme.text.tertiary }}>
            <Globe className="w-12 h-12 mx-auto mb-4" style={{ color: theme.text.tertiary }} />
            <p>Social content will be displayed here</p>
            <p style={{ fontSize: '14px', marginTop: '8px' }}>
              Community sentiment, social media mentions, and discussions
            </p>
          </div>
        );
      
      case 'news':
        return (
          <div style={{ textAlign: 'center', color: theme.text.tertiary }}>
            <Star className="w-12 h-12 mx-auto mb-4" style={{ color: theme.text.tertiary }} />
            <p>News content will be displayed here</p>
            <p style={{ fontSize: '14px', marginTop: '8px' }}>
              Latest news, updates, and announcements about this token
            </p>
          </div>
        );
      
      case 'learning':
        return (
          <div style={{ textAlign: 'center', color: theme.text.tertiary }}>
            <BookOpen className="w-12 h-12 mx-auto mb-4" style={{ color: theme.text.tertiary }} />
            <p>Learning content will be displayed here</p>
            <p style={{ fontSize: '14px', marginTop: '8px' }}>
              Educational content to help you understand this token
            </p>
          </div>
        );
      
      default:
        return null;
    }
  };

  if (!token) {
    return (
      <div style={containerStyles}>
        <div style={contentStyles}>
          <div style={{ textAlign: 'center', color: theme.text.tertiary }}>
            <Info className="w-12 h-12 mx-auto mb-4" style={{ color: theme.text.tertiary }} />
            <p>Select a token to view detailed information</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyles}>
      <div style={headerStyles}>
        <div style={tokenInfoStyles}>
          <div style={tokenNameStyles}>{token.symbol}</div>
          <div style={priceStyles}>{formatPrice(token)}</div>
          <div style={{
            fontSize: '14px',
            color: token.priceChange24h >= 0 ? theme.accent.green : theme.accent.red,
            fontFamily: 'JetBrains Mono, monospace',
          }}>
            {token.priceChange24h >= 0 ? '+' : ''}{token.priceChange24h.toFixed(2)}%
          </div>
        </div>
      </div>

      <div style={tabsContainerStyles}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            style={{
              ...tabButtonStyles,
              ...(activeTab === tab.id ? activeTabStyles : {}),
            }}
            onClick={() => handleTabClick(tab.id)}
            onMouseEnter={(e) => {
              if (activeTab !== tab.id) {
                e.currentTarget.style.background = theme.surface.tertiary;
                e.currentTarget.style.color = theme.text.primary;
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== tab.id) {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = theme.text.secondary;
              }
            }}
            title={tab.description}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div style={contentStyles}>
        {renderTabContent()}
      </div>
    </div>
  );
};

export default TokenDetailsTabs;
