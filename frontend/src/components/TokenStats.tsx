import React from 'react';
import { TrendingUp, TrendingDown, Users, Droplets, Shield, DollarSign, BarChart3, AlertCircle } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { ProCard } from './pro';
import { Token } from '../hooks/useTokenData';

interface TokenStatsProps {
  token: Token | null;
}

const TokenStats: React.FC<TokenStatsProps> = ({ token }) => {
  const { theme } = useTheme();

  if (!token) {
    return null;
  }

  const formatNumber = (num: number, formatted?: string, decimals: number = 2): string => {
    if (formatted) return `$${formatted}`;
    if (num >= 1000000000) return `$${(num / 1000000000).toFixed(decimals)}B`;
    if (num >= 1000000) return `$${(num / 1000000).toFixed(decimals)}M`;
    if (num >= 1000) return `$${(num / 1000).toFixed(decimals)}K`;
    return `$${num.toFixed(decimals)}`;
  };

  const formatCount = (num: number, formatted?: string): string => {
    if (formatted) return formatted;
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(2)}K`;
    return num.toString();
  };

  const getSafetyColor = (score: number): string => {
    if (score >= 80) return theme.accent.green;
    if (score >= 60) return theme.accent.blue;
    if (score >= 40) return theme.accent.orange;
    return theme.accent.red;
  };

  const stats = [
    {
      icon: DollarSign,
      label: 'Price',
      value: formatNumber(token.price, token.priceFormatted, 6),
      subValue: token.priceChange24h !== undefined ? (
        <span style={{ 
          color: token.priceChange24h >= 0 ? theme.accent.green : theme.accent.red,
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          {token.priceChange24h >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {token.priceChange24h.toFixed(2)}%
        </span>
      ) : null,
      tooltip: 'Current token price and 24h change'
    },
    {
      icon: BarChart3,
      label: 'Volume 24h',
      value: formatNumber(token.volume24h, token.volumeFormatted),
      subValue: null,
      tooltip: 'Total trading volume in the last 24 hours'
    },
    {
      icon: DollarSign,
      label: 'Market Cap',
      value: formatNumber(token.marketCap, token.marketCapFormatted),
      subValue: null,
      tooltip: 'Total market capitalization'
    },
    {
      icon: Droplets,
      label: 'Liquidity',
      value: formatNumber(token.liquidity, token.liquidityFormatted),
      subValue: token.liquidity > 1000000 ? 
        <span style={{ color: theme.accent.green, fontSize: '10px' }}>High</span> : 
        token.liquidity > 100000 ?
        <span style={{ color: theme.accent.blue, fontSize: '10px' }}>Medium</span> :
        <span style={{ color: theme.accent.orange, fontSize: '10px' }}>Low</span>,
      tooltip: 'Available liquidity in pools - higher is better for trading'
    },
    {
      icon: Users,
      label: 'Holders',
      value: formatCount(token.holders, token.holdersFormatted),
      subValue: token.holders > 10000 ?
        <span style={{ color: theme.accent.green, fontSize: '10px' }}>Wide</span> :
        token.holders > 1000 ?
        <span style={{ color: theme.accent.blue, fontSize: '10px' }}>Moderate</span> :
        <span style={{ color: theme.accent.orange, fontSize: '10px' }}>Limited</span>,
      tooltip: 'Number of unique holders - more holders typically means better distribution'
    },
    {
      icon: Shield,
      label: 'Safety Score',
      value: `${token.safetyScore}/100`,
      subValue: (
        <div style={{
          width: '100%',
          height: '4px',
          background: theme.surface.secondary,
          borderRadius: '2px',
          overflow: 'hidden',
          marginTop: '4px'
        }}>
          <div style={{
            width: `${token.safetyScore}%`,
            height: '100%',
            background: getSafetyColor(token.safetyScore),
            transition: 'width 0.3s ease'
          }} />
        </div>
      ),
      tooltip: 'Algorithmic risk assessment based on liquidity, holders, and volume'
    },
  ];

  const containerStyles: React.CSSProperties = {
    marginTop: '16px',
  };

  const gridStyles: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '12px',
  };

  const statCardStyles: React.CSSProperties = {
    padding: '12px',
    background: theme.surface.secondary,
    border: `1px solid ${theme.border.primary}`,
    borderRadius: '8px',
    transition: 'all 0.2s ease',
    cursor: 'help',
  };

  const statCardHoverStyles: React.CSSProperties = {
    ...statCardStyles,
    borderColor: theme.accent.blue,
    background: `${theme.accent.blue}08`,
  };

  const iconContainerStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px',
  };

  const labelStyles: React.CSSProperties = {
    fontSize: '11px',
    color: theme.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    fontFamily: 'Inter, system-ui, sans-serif',
    fontWeight: 600,
  };

  const valueStyles: React.CSSProperties = {
    fontSize: '18px',
    fontWeight: 700,
    color: theme.text.primary,
    fontFamily: 'JetBrains Mono, monospace',
    marginBottom: '4px',
  };

  const subValueStyles: React.CSSProperties = {
    fontSize: '12px',
    color: theme.text.secondary,
    fontFamily: 'Inter, system-ui, sans-serif',
  };

  const StatCard: React.FC<{ stat: typeof stats[0]; index: number }> = ({ stat, index }) => {
    const [isHovered, setIsHovered] = React.useState(false);
    const IconComponent = stat.icon;

    return (
      <div
        key={index}
        style={isHovered ? statCardHoverStyles : statCardStyles}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        title={stat.tooltip}
      >
        <div style={iconContainerStyles}>
          <IconComponent 
            size={14} 
            style={{ 
              color: theme.text.secondary,
              flexShrink: 0
            }} 
          />
          <div style={labelStyles}>{stat.label}</div>
        </div>
        <div style={valueStyles}>{stat.value}</div>
        {stat.subValue && (
          <div style={subValueStyles}>{stat.subValue}</div>
        )}
      </div>
    );
  };

  return (
    <div style={containerStyles}>
      <div style={gridStyles}>
        {stats.map((stat, index) => (
          <StatCard key={index} stat={stat} index={index} />
        ))}
      </div>

      {/* Warning for low safety score */}
      {token.safetyScore < 60 && (
        <ProCard 
          padding="sm"
          style={{
            marginTop: '12px',
            background: `${theme.accent.orange}10`,
            border: `1px solid ${theme.accent.orange}40`,
          }}
        >
          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
            <AlertCircle 
              size={16} 
              style={{ 
                color: theme.accent.orange, 
                flexShrink: 0,
                marginTop: '2px'
              }} 
            />
            <div style={{ fontSize: '12px', color: theme.text.primary, lineHeight: '1.5' }}>
              This token has a safety score below 60. I've analyzed the metrics and found potential risks. 
              Consider the low liquidity of {formatNumber(token.liquidity)} and holder count of {formatCount(token.holders)} before trading.
            </div>
          </div>
        </ProCard>
      )}
    </div>
  );
};

export default TokenStats;

