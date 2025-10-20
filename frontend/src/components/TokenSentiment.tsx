import React, { useEffect, useState, useCallback } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { TrendingUp, TrendingDown, Users, MessageCircle, Activity, AlertTriangle } from 'lucide-react';
import { ProBadge } from './pro';

interface SentimentData {
  sentiment_score: number;
  social_volume: number;
  trending_rank: number;
  mentions_24h: number;
  sentiment_breakdown: {
    positive: number;
    neutral: number;
    negative: number;
  };
  data_sources: {
    coingecko: boolean;
    news: boolean;
    reddit: boolean;
  };
  last_updated: string;
  token_address: string;
  token_symbol?: string;
}

interface TokenSentimentProps {
  tokenAddress: string;
  tokenSymbol?: string;
}

const TokenSentiment: React.FC<TokenSentimentProps> = ({ tokenAddress, tokenSymbol }) => {
  const { theme } = useTheme();
  const [sentimentData, setSentimentData] = useState<SentimentData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSentimentData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/tokens/${tokenAddress}/sentiment`
      );
      const data = await response.json();
      
      if (data.status === 'success') {
        setSentimentData(data.sentiment);
      } else {
        setError(data.error || 'Failed to fetch sentiment data');
      }
    } catch (err) {
      setError('Network error fetching sentiment data');
      console.error('Error fetching sentiment data:', err);
    } finally {
      setLoading(false);
    }
  }, [tokenAddress]);

  useEffect(() => {
    if (tokenAddress) {
      fetchSentimentData();
    }
  }, [tokenAddress, fetchSentimentData]);

  const getSentimentColor = (score: number) => {
    if (score > 0.2) return theme.accent.green;
    if (score < -0.2) return theme.accent.red;
    return theme.accent.orange;
  };

  const getSentimentLabel = (score: number) => {
    if (score > 0.3) return 'Very Bullish';
    if (score > 0.1) return 'Bullish';
    if (score > -0.1) return 'Neutral';
    if (score > -0.3) return 'Bearish';
    return 'Very Bearish';
  };

  const formatNumber = (num: number) => {
    if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
    return num.toString();
  };

  const containerStyles: React.CSSProperties = {
    background: theme.surface.primary,
    border: `1px solid ${theme.border.primary}`,
    borderRadius: '12px',
    padding: '20px',
    marginTop: '16px',
  };

  const headerStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '20px',
  };

  const titleStyles: React.CSSProperties = {
    fontSize: '18px',
    fontWeight: 600,
    color: theme.text.primary,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  };

  const sentimentGaugeStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '20px',
  };

  const gaugeContainerStyles: React.CSSProperties = {
    position: 'relative',
    width: '80px',
    height: '80px',
  };

  const gaugeStyles: React.CSSProperties = {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    background: `conic-gradient(from 0deg, ${theme.accent.red} 0deg, ${theme.accent.orange} 90deg, ${theme.accent.green} 180deg)`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  };

  const gaugeInnerStyles: React.CSSProperties = {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    background: theme.surface.primary,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
  };

  const metricsGridStyles: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
    gap: '16px',
    marginBottom: '20px',
  };

  const metricCardStyles: React.CSSProperties = {
    background: theme.surface.tertiary,
    border: `1px solid ${theme.border.primary}`,
    borderRadius: '8px',
    padding: '12px',
    textAlign: 'center',
  };

  const breakdownStyles: React.CSSProperties = {
    display: 'flex',
    gap: '12px',
    marginBottom: '16px',
  };

  const breakdownItemStyles: React.CSSProperties = {
    flex: 1,
    textAlign: 'center',
    padding: '8px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 500,
  };

  const dataSourcesStyles: React.CSSProperties = {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    fontSize: '12px',
    color: theme.text.secondary,
  };

  if (loading) {
    return (
      <div style={containerStyles}>
        <div style={{ textAlign: 'center', color: theme.text.secondary }}>
          <Activity className="w-6 h-6 animate-pulse mx-auto mb-2" />
          Analyzing social sentiment...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={containerStyles}>
        <div style={{ textAlign: 'center', color: theme.accent.red }}>
          <AlertTriangle className="w-6 h-6 mx-auto mb-2" />
          <div>Failed to load sentiment data</div>
          <button
            onClick={fetchSentimentData}
            style={{
              marginTop: '8px',
              padding: '4px 12px',
              background: theme.accent.blue,
              color: theme.text.inverted,
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!sentimentData) {
    return (
      <div style={containerStyles}>
        <div style={{ textAlign: 'center', color: theme.text.secondary }}>
          <MessageCircle className="w-6 h-6 mx-auto mb-2" />
          <div>No sentiment data available</div>
        </div>
      </div>
    );
  }

  const { sentiment_score, social_volume, trending_rank, mentions_24h, sentiment_breakdown, data_sources } = sentimentData;

  return (
    <div style={containerStyles}>
      <div style={headerStyles}>
        <div style={titleStyles}>
          <Activity className="w-5 h-5" />
          Social Sentiment
        </div>
        <ProBadge variant={sentiment_score > 0 ? 'bullish' : sentiment_score < 0 ? 'bearish' : 'neutral'}>
          {getSentimentLabel(sentiment_score)}
        </ProBadge>
      </div>

      <div style={sentimentGaugeStyles}>
        <div style={gaugeContainerStyles}>
          <div style={gaugeStyles}>
            <div style={gaugeInnerStyles}>
              <div style={{ 
                fontSize: '16px', 
                fontWeight: 600, 
                color: getSentimentColor(sentiment_score) 
              }}>
                {sentiment_score > 0 ? '+' : ''}{sentiment_score.toFixed(2)}
              </div>
              <div style={{ fontSize: '10px', color: theme.text.secondary }}>
                Score
              </div>
            </div>
          </div>
        </div>
        
        <div style={{ flex: 1 }}>
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '14px', fontWeight: 500, color: theme.text.primary, marginBottom: '4px' }}>
              Social Volume
            </div>
            <div style={{ fontSize: '20px', fontWeight: 600, color: theme.accent.blue }}>
              {formatNumber(social_volume)}
            </div>
          </div>
          
          {trending_rank > 0 && (
            <div>
              <div style={{ fontSize: '14px', fontWeight: 500, color: theme.text.primary, marginBottom: '4px' }}>
                Trending Rank
              </div>
              <div style={{ fontSize: '16px', fontWeight: 600, color: theme.accent.orange }}>
                #{trending_rank}
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={metricsGridStyles}>
        <div style={metricCardStyles}>
          <Users className="w-4 h-4 mx-auto mb-2" style={{ color: theme.accent.blue }} />
          <div style={{ fontSize: '12px', color: theme.text.secondary, marginBottom: '4px' }}>
            Mentions 24h
          </div>
          <div style={{ fontSize: '16px', fontWeight: 600, color: theme.text.primary }}>
            {formatNumber(mentions_24h)}
          </div>
        </div>
        
        <div style={metricCardStyles}>
          <TrendingUp className="w-4 h-4 mx-auto mb-2" style={{ color: theme.accent.green }} />
          <div style={{ fontSize: '12px', color: theme.text.secondary, marginBottom: '4px' }}>
            Positive
          </div>
          <div style={{ fontSize: '16px', fontWeight: 600, color: theme.accent.green }}>
            {(sentiment_breakdown.positive * 100).toFixed(0)}%
          </div>
        </div>
        
        <div style={metricCardStyles}>
          <TrendingDown className="w-4 h-4 mx-auto mb-2" style={{ color: theme.accent.red }} />
          <div style={{ fontSize: '12px', color: theme.text.secondary, marginBottom: '4px' }}>
            Negative
          </div>
          <div style={{ fontSize: '16px', fontWeight: 600, color: theme.accent.red }}>
            {(sentiment_breakdown.negative * 100).toFixed(0)}%
          </div>
        </div>
      </div>

      <div style={breakdownStyles}>
        <div style={{
          ...breakdownItemStyles,
          background: `${theme.accent.green}20`,
          color: theme.accent.green,
        }}>
          <div style={{ fontWeight: 600 }}>Positive</div>
          <div>{(sentiment_breakdown.positive * 100).toFixed(0)}%</div>
        </div>
        
        <div style={{
          ...breakdownItemStyles,
          background: `${theme.accent.orange}20`,
          color: theme.accent.orange,
        }}>
          <div style={{ fontWeight: 600 }}>Neutral</div>
          <div>{(sentiment_breakdown.neutral * 100).toFixed(0)}%</div>
        </div>
        
        <div style={{
          ...breakdownItemStyles,
          background: `${theme.accent.red}20`,
          color: theme.accent.red,
        }}>
          <div style={{ fontWeight: 600 }}>Negative</div>
          <div>{(sentiment_breakdown.negative * 100).toFixed(0)}%</div>
        </div>
      </div>

      <div style={dataSourcesStyles}>
        <span>Data sources:</span>
        {data_sources.coingecko && <span style={{ color: theme.accent.green }}>✓ CoinGecko</span>}
        {data_sources.news && <span style={{ color: theme.accent.blue }}>✓ News</span>}
        {data_sources.reddit && <span style={{ color: theme.accent.orange }}>✓ Reddit</span>}
        {!data_sources.coingecko && !data_sources.news && !data_sources.reddit && (
          <span style={{ color: theme.text.tertiary }}>No data available</span>
        )}
      </div>
    </div>
  );
};

export default TokenSentiment;
