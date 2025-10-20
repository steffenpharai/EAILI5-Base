import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Globe, 
  Star, 
  Shield, 
  Activity,
  BarChart3,
  ExternalLink,
  Copy,
  Check
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { ProButton, ProCard } from './pro';
import { Token } from '../hooks/useTokenData';

interface EnhancedTokenInfoProps {
  token: Token | null;
}

interface EnhancedTokenData {
  id: string;
  symbol: string;
  name: string;
  description: string;
  image: string;
  market_cap_rank: number;
  coingecko_score: number;
  liquidity_score: number;
  public_interest_score: number;
  market_cap: number;
  total_volume: number;
  current_price: number;
  price_change_24h: number;
  ath: number;
  ath_change_percentage: number;
  atl: number;
  atl_change_percentage: number;
  circulating_supply: number;
  total_supply: number;
  max_supply: number;
  categories: string[];
  links: {
    homepage: string[];
    blockchain_site: string[];
    official_forum_url: string[];
    subreddit_url: string;
    twitter_screen_name: string;
    facebook_username: string;
    bitcointalk_thread_identifier: string;
    telegram_channel_identifier: string;
    slack_channel: string;
    github: string[];
  };
  sentiment_votes_up_percentage: number;
  sentiment_votes_down_percentage: number;
  watchlist_portfolio_users: number;
}

const EnhancedTokenInfo: React.FC<EnhancedTokenInfoProps> = ({ token }) => {
  const { theme } = useTheme();
  const [enhancedData, setEnhancedData] = useState<EnhancedTokenData | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    if (token?.address) {
      fetchEnhancedData(token.address);
    }
  }, [token]);

  const fetchEnhancedData = async (tokenAddress: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/tokens/${tokenAddress}/enhanced`);
      const data = await response.json();
      
      if (data.status === 'success' && data.details) {
        setEnhancedData(data.details);
      } else {
        console.error('Failed to fetch enhanced token data:', data.error);
      }
    } catch (error) {
      console.error('Error fetching enhanced token data:', error);
    } finally {
      setLoading(false);
    }
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

  const formatNumber = (num: number, decimals: number = 2): string => {
    if (num === 0) return '0';
    if (num < 0.000001) return num.toFixed(8);
    if (num < 0.01) return num.toFixed(6);
    if (num < 1) return num.toFixed(4);
    if (num < 1000) return num.toFixed(decimals);
    if (num < 1000000) return `${(num / 1000).toFixed(decimals)}K`;
    if (num < 1000000000) return `${(num / 1000000).toFixed(decimals)}M`;
    return `${(num / 1000000000).toFixed(decimals)}B`;
  };

  const formatPercentage = (num: number): string => {
    return `${num >= 0 ? '+' : ''}${num.toFixed(2)}%`;
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return theme.accent.green;
    if (score >= 60) return theme.accent.orange;
    return theme.accent.red;
  };

  const getScoreLabel = (score: number): string => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Poor';
  };

  if (!token) {
    return (
      <div style={{
        textAlign: 'center',
        color: theme.text.tertiary,
        padding: '40px 20px',
      }}>
        <BarChart3 className="w-12 h-12 mx-auto mb-4" style={{ color: theme.text.tertiary }} />
        <p>Select a token to view enhanced information</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{
        textAlign: 'center',
        color: theme.text.secondary,
        padding: '40px 20px',
      }}>
        <Activity className="w-8 h-8 mx-auto mb-4 animate-pulse" style={{ color: theme.accent.blue }} />
        <p>Loading enhanced token data...</p>
      </div>
    );
  }

  const containerStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    padding: '20px',
    background: theme.surface.primary,
  };

  const sectionStyles: React.CSSProperties = {
    background: theme.surface.secondary,
    borderRadius: '12px',
    padding: '20px',
    border: `1px solid ${theme.border.primary}`,
  };

  const sectionTitleStyles: React.CSSProperties = {
    fontSize: '18px',
    fontWeight: 600,
    color: theme.text.primary,
    fontFamily: 'Inter, system-ui, sans-serif',
    marginBottom: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  };

  const metricRowStyles: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
    borderBottom: `1px solid ${theme.border.primary}`,
  };

  const metricLabelStyles: React.CSSProperties = {
    fontSize: '14px',
    color: theme.text.secondary,
    fontFamily: 'Inter, system-ui, sans-serif',
  };

  const metricValueStyles: React.CSSProperties = {
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
      {/* Token Overview */}
      <div style={sectionStyles}>
        <h3 style={sectionTitleStyles}>
          <Star className="w-5 h-5" />
          Token Overview
        </h3>
        
        {enhancedData && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
            {enhancedData.image && (
              <img 
                src={enhancedData.image} 
                alt={enhancedData.name}
                style={{ width: '48px', height: '48px', borderRadius: '8px' }}
              />
            )}
            <div>
              <h4 style={{ fontSize: '20px', fontWeight: 600, color: theme.text.primary, margin: 0 }}>
                {enhancedData.name}
              </h4>
              <p style={{ fontSize: '14px', color: theme.text.secondary, margin: '4px 0 0 0' }}>
                {enhancedData.symbol.toUpperCase()} • Rank #{enhancedData.market_cap_rank || 'N/A'}
              </p>
            </div>
          </div>
        )}

        {enhancedData?.description && (
          <div style={{ marginBottom: '16px' }}>
            <p style={{ 
              fontSize: '14px', 
              color: theme.text.secondary, 
              lineHeight: '1.6',
              margin: 0 
            }}>
              {enhancedData.description.substring(0, 200)}
              {enhancedData.description.length > 200 && '...'}
            </p>
          </div>
        )}

        <div style={metricRowStyles}>
          <span style={metricLabelStyles}>Address</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={metricValueStyles}>
              {token.address.substring(0, 6)}...{token.address.substring(token.address.length - 4)}
            </span>
            <button
              style={copyButtonStyles}
              onClick={() => copyToClipboard(token.address, 'address')}
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

      {/* Market Data */}
      <div style={sectionStyles}>
        <h3 style={sectionTitleStyles}>
          <TrendingUp className="w-5 h-5" />
          Market Data
        </h3>
        
        <div style={metricRowStyles}>
          <span style={metricLabelStyles}>Price</span>
          <span style={metricValueStyles}>
            ${enhancedData?.current_price ? formatNumber(enhancedData.current_price) : formatNumber(token.price)}
          </span>
        </div>
        
        <div style={metricRowStyles}>
          <span style={metricLabelStyles}>24h Change</span>
          <span style={{
            ...metricValueStyles,
            color: (enhancedData?.price_change_24h ?? token.priceChange24h) >= 0 ? theme.accent.green : theme.accent.red
          }}>
            {formatPercentage(enhancedData?.price_change_24h ?? token.priceChange24h)}
          </span>
        </div>
        
        <div style={metricRowStyles}>
          <span style={metricLabelStyles}>Market Cap</span>
          <span style={metricValueStyles}>
            ${enhancedData?.market_cap ? formatNumber(enhancedData.market_cap) : formatNumber(token.marketCap)}
          </span>
        </div>
        
        <div style={metricRowStyles}>
          <span style={metricLabelStyles}>Volume (24h)</span>
          <span style={metricValueStyles}>
            ${enhancedData?.total_volume ? formatNumber(enhancedData.total_volume) : formatNumber(token.volume24h)}
          </span>
        </div>
        
        <div style={metricRowStyles}>
          <span style={metricLabelStyles}>All-Time High</span>
          <span style={metricValueStyles}>
            ${enhancedData?.ath ? formatNumber(enhancedData.ath) : 'N/A'}
            {enhancedData?.ath_change_percentage && (
              <span style={{ 
                fontSize: '12px', 
                color: theme.text.tertiary,
                marginLeft: '8px'
              }}>
                ({formatPercentage(enhancedData.ath_change_percentage)})
              </span>
            )}
          </span>
        </div>
        
        <div style={metricRowStyles}>
          <span style={metricLabelStyles}>All-Time Low</span>
          <span style={metricValueStyles}>
            ${enhancedData?.atl ? formatNumber(enhancedData.atl) : 'N/A'}
            {enhancedData?.atl_change_percentage && (
              <span style={{ 
                fontSize: '12px', 
                color: theme.text.tertiary,
                marginLeft: '8px'
              }}>
                ({formatPercentage(enhancedData.atl_change_percentage)})
              </span>
            )}
          </span>
        </div>
      </div>

      {/* Supply Information */}
      <div style={sectionStyles}>
        <h3 style={sectionTitleStyles}>
          <Activity className="w-5 h-5" />
          Supply Information
        </h3>
        
        <div style={metricRowStyles}>
          <span style={metricLabelStyles}>Circulating Supply</span>
          <span style={metricValueStyles}>
            {enhancedData?.circulating_supply ? formatNumber(enhancedData.circulating_supply) : 'N/A'}
          </span>
        </div>
        
        <div style={metricRowStyles}>
          <span style={metricLabelStyles}>Total Supply</span>
          <span style={metricValueStyles}>
            {enhancedData?.total_supply ? formatNumber(enhancedData.total_supply) : 'N/A'}
          </span>
        </div>
        
        <div style={metricRowStyles}>
          <span style={metricLabelStyles}>Max Supply</span>
          <span style={metricValueStyles}>
            {enhancedData?.max_supply ? formatNumber(enhancedData.max_supply) : 'N/A'}
          </span>
        </div>
      </div>

      {/* Scores & Ratings */}
      {enhancedData && (
        <div style={sectionStyles}>
          <h3 style={sectionTitleStyles}>
            <Shield className="w-5 h-5" />
            Scores & Ratings
          </h3>
          
          <div style={metricRowStyles}>
            <span style={metricLabelStyles}>CoinGecko Score</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                ...metricValueStyles,
                color: getScoreColor(enhancedData.coingecko_score)
              }}>
                {enhancedData.coingecko_score}/100
              </span>
              <span style={{ 
                fontSize: '12px', 
                color: getScoreColor(enhancedData.coingecko_score)
              }}>
                {getScoreLabel(enhancedData.coingecko_score)}
              </span>
            </div>
          </div>
          
          <div style={metricRowStyles}>
            <span style={metricLabelStyles}>Liquidity Score</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                ...metricValueStyles,
                color: getScoreColor(enhancedData.liquidity_score)
              }}>
                {enhancedData.liquidity_score}/100
              </span>
              <span style={{ 
                fontSize: '12px', 
                color: getScoreColor(enhancedData.liquidity_score)
              }}>
                {getScoreLabel(enhancedData.liquidity_score)}
              </span>
            </div>
          </div>
          
          <div style={metricRowStyles}>
            <span style={metricLabelStyles}>Public Interest</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                ...metricValueStyles,
                color: getScoreColor(enhancedData.public_interest_score)
              }}>
                {enhancedData.public_interest_score}/100
              </span>
              <span style={{ 
                fontSize: '12px', 
                color: getScoreColor(enhancedData.public_interest_score)
              }}>
                {getScoreLabel(enhancedData.public_interest_score)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Community & Links */}
      {enhancedData?.links && (
        <div style={sectionStyles}>
          <h3 style={sectionTitleStyles}>
            <Globe className="w-5 h-5" />
            Community & Links
          </h3>
          
          {enhancedData.links.homepage && enhancedData.links.homepage.length > 0 && (
            <div style={metricRowStyles}>
              <span style={metricLabelStyles}>Website</span>
              <a 
                href={enhancedData.links.homepage[0]} 
                target="_blank" 
                rel="noopener noreferrer"
                style={{
                  ...metricValueStyles,
                  color: theme.accent.blue,
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                Visit <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
          
          {enhancedData.links.twitter_screen_name && (
            <div style={metricRowStyles}>
              <span style={metricLabelStyles}>Twitter</span>
              <a 
                href={`https://twitter.com/${enhancedData.links.twitter_screen_name}`}
                target="_blank" 
                rel="noopener noreferrer"
                style={{
                  ...metricValueStyles,
                  color: theme.accent.blue,
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                @{enhancedData.links.twitter_screen_name} <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
          
          {enhancedData.links.subreddit_url && (
            <div style={metricRowStyles}>
              <span style={metricLabelStyles}>Reddit</span>
              <a 
                href={enhancedData.links.subreddit_url}
                target="_blank" 
                rel="noopener noreferrer"
                style={{
                  ...metricValueStyles,
                  color: theme.accent.blue,
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                r/{enhancedData.links.subreddit_url.split('/').pop()} <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
        </div>
      )}

      {/* Categories */}
      {enhancedData?.categories && enhancedData.categories.length > 0 && (
        <div style={sectionStyles}>
          <h3 style={sectionTitleStyles}>
            <BarChart3 className="w-5 h-5" />
            Categories
          </h3>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {enhancedData.categories.map((category, index) => (
              <span
                key={index}
                style={{
                  padding: '4px 8px',
                  borderRadius: '6px',
                  background: theme.surface.tertiary,
                  color: theme.text.secondary,
                  fontSize: '12px',
                  fontFamily: 'Inter, system-ui, sans-serif',
                }}
              >
                {category}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedTokenInfo;
