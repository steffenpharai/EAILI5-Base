import React, { useState } from 'react';
import { ArrowLeft, TrendingUp, TrendingDown, DollarSign, PieChart, Plus, Minus } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigation } from '../contexts/NavigationContext';
import { ProButton, ProBadge } from './pro';

interface PortfolioHolding {
  id: string;
  symbol: string;
  name: string;
  amount: number;
  price: number;
  value: number;
  change24h: number;
}

const PortfolioView: React.FC = () => {
  const { theme } = useTheme();
  const { goHome } = useNavigation();
  const [holdings] = useState<PortfolioHolding[]>([]);
  const [totalValue] = useState(100.00);
  const [totalChange] = useState(0.00);

  const containerStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    background: theme.background.primary,
    overflow: 'hidden',
  };

  const headerStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    padding: '20px',
    borderBottom: `1px solid ${theme.border.primary}`,
    background: theme.surface.primary,
  };

  const backButtonStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'transparent',
    border: `1px solid ${theme.border.primary}`,
    borderRadius: '8px',
    padding: '8px 16px',
    color: theme.text.secondary,
    cursor: 'pointer',
    transition: 'all 150ms ease',
    marginRight: '20px',
  };

  const contentStyles: React.CSSProperties = {
    flex: 1,
    overflow: 'auto',
    padding: '20px',
  };

  const portfolioHeaderStyles: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '32px',
    padding: '24px',
    background: theme.surface.secondary,
    borderRadius: '12px',
    border: `1px solid ${theme.border.primary}`,
  };

  const balanceStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  };

  const balanceValueStyles: React.CSSProperties = {
    fontSize: '36px',
    fontWeight: 800,
    color: theme.text.primary,
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  };

  const changeStyles: React.CSSProperties = {
    fontSize: '16px',
    color: totalChange >= 0 ? theme.accent.green : theme.accent.red,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  };

  const statsGridStyles: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '32px',
  };

  const statCardStyles: React.CSSProperties = {
    background: theme.surface.secondary,
    border: `1px solid ${theme.border.primary}`,
    borderRadius: '12px',
    padding: '20px',
  };

  const holdingsSectionStyles: React.CSSProperties = {
    marginBottom: '32px',
  };

  const sectionTitleStyles: React.CSSProperties = {
    fontSize: '20px',
    fontWeight: 700,
    color: theme.text.primary,
    marginBottom: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  };

  const holdingsListStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  };

  const holdingCardStyles: React.CSSProperties = {
    background: theme.surface.secondary,
    border: `1px solid ${theme.border.primary}`,
    borderRadius: '8px',
    padding: '16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  };

  const holdingInfoStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  };

  const holdingSymbolStyles: React.CSSProperties = {
    fontSize: '16px',
    fontWeight: 600,
    color: theme.text.primary,
  };

  const holdingNameStyles: React.CSSProperties = {
    fontSize: '14px',
    color: theme.text.secondary,
  };

  const holdingValueStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '4px',
  };

  const emptyStateStyles: React.CSSProperties = {
    textAlign: 'center',
    padding: '40px',
    color: theme.text.tertiary,
  };

  const actionButtonsStyles: React.CSSProperties = {
    display: 'flex',
    gap: '12px',
    marginTop: '20px',
  };

  return (
    <div style={containerStyles}>
      {/* Header */}
      <div style={headerStyles}>
        <button style={backButtonStyles} onClick={goHome}>
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>
        <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: theme.text.primary }}>
          Portfolio Simulator
        </h1>
      </div>

      {/* Content */}
      <div style={contentStyles}>
        {/* Portfolio Header */}
        <div style={portfolioHeaderStyles}>
          <div style={balanceStyles}>
            <div style={balanceValueStyles}>
              <DollarSign className="w-8 h-8" />
              ${totalValue.toFixed(2)}
            </div>
            <div style={changeStyles}>
              {totalChange >= 0 ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              {totalChange >= 0 ? '+' : ''}{totalChange.toFixed(2)}% (24h)
            </div>
          </div>
          <ProBadge variant={totalChange >= 0 ? 'bullish' : 'bearish'}>
            {totalChange >= 0 ? 'Gaining' : 'Losing'}
          </ProBadge>
        </div>

        {/* Stats Grid */}
        <div style={statsGridStyles}>
          <div style={statCardStyles}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <DollarSign className="w-5 h-5" style={{ color: theme.accent.blue }} />
              <span style={{ fontSize: '14px', color: theme.text.secondary }}>Total Value</span>
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: theme.text.primary }}>
              ${totalValue.toFixed(2)}
            </div>
          </div>

          <div style={statCardStyles}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <TrendingUp className="w-5 h-5" style={{ color: theme.accent.green }} />
              <span style={{ fontSize: '14px', color: theme.text.secondary }}>Best Performer</span>
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: theme.text.primary }}>
              {holdings.length > 0 ? holdings[0]?.symbol || 'N/A' : 'N/A'}
            </div>
          </div>

          <div style={statCardStyles}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <PieChart className="w-5 h-5" style={{ color: theme.accent.orange }} />
              <span style={{ fontSize: '14px', color: theme.text.secondary }}>Holdings</span>
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: theme.text.primary }}>
              {holdings.length}
            </div>
          </div>

          <div style={statCardStyles}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <TrendingDown className="w-5 h-5" style={{ color: theme.accent.red }} />
              <span style={{ fontSize: '14px', color: theme.text.secondary }}>Worst Performer</span>
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: theme.text.primary }}>
              {holdings.length > 1 ? holdings[holdings.length - 1]?.symbol || 'N/A' : 'N/A'}
            </div>
          </div>
        </div>

        {/* Holdings Section */}
        <div style={holdingsSectionStyles}>
          <h2 style={sectionTitleStyles}>
            <PieChart className="w-6 h-6" />
            Your Holdings
          </h2>

          {holdings.length === 0 ? (
            <div style={emptyStateStyles}>
              <PieChart className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h3 style={{ fontSize: '18px', marginBottom: '8px', color: theme.text.secondary }}>
                No holdings yet
              </h3>
              <p style={{ fontSize: '14px', marginBottom: '20px' }}>
                Start by exploring tokens and making simulated trades
              </p>
              <div style={actionButtonsStyles}>
                <ProButton variant="primary" size="lg">
                  <Plus className="w-4 h-4" />
                  Make First Trade
                </ProButton>
                <ProButton variant="secondary" size="lg">
                  Explore Tokens
                </ProButton>
              </div>
            </div>
          ) : (
            <div style={holdingsListStyles}>
              {holdings.map((holding) => (
                <div key={holding.id} style={holdingCardStyles}>
                  <div style={holdingInfoStyles}>
                    <div style={holdingSymbolStyles}>{holding.symbol}</div>
                    <div style={holdingNameStyles}>{holding.name}</div>
                  </div>
                  <div style={holdingValueStyles}>
                    <div style={{ fontSize: '16px', fontWeight: 600, color: theme.text.primary }}>
                      ${holding.value.toFixed(2)}
                    </div>
                    <div style={{ 
                      fontSize: '14px', 
                      color: holding.change24h >= 0 ? theme.accent.green : theme.accent.red,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      {holding.change24h >= 0 ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      {holding.change24h >= 0 ? '+' : ''}{holding.change24h.toFixed(2)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div style={{ marginTop: '32px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: theme.text.primary, marginBottom: '16px' }}>
            Quick Actions
          </h3>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <ProButton variant="primary" size="lg">
              <Plus className="w-4 h-4" />
              Buy Token
            </ProButton>
            <ProButton variant="secondary" size="lg">
              <Minus className="w-4 h-4" />
              Sell Token
            </ProButton>
            <ProButton variant="outline" size="lg">
              <PieChart className="w-4 h-4" />
              Rebalance
            </ProButton>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortfolioView;
