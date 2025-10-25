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
    farcaster?: boolean;
  };
  last_updated: string;
  token_address: string;
  token_symbol?: string;
}

interface EnhancedSentimentData {
  sentiment_metrics: {
    overall_score: number;
    total_volume: number;
    confidence: number;
    platform_scores: {
      coingecko: number;
      news: number;
      reddit: number;
      farcaster: number;
    };
  };
  platform_breakdown: {
    coingecko: {
      available: boolean;
      engagement_score: number;
      trending_rank: number;
    };
    news: {
      available: boolean;
      sentiment: number;
      mentions: number;
    };
    reddit: {
      available: boolean;
      sentiment: number;
      posts: number;
      engagement: number;
    };
    farcaster: {
      available: boolean;
      sentiment: number;
      casts: number;
      engagement: number;
    };
  };
  anomalies: Array<{
    type: string;
    severity: string;
    description: string;
    timestamp: string;
  }>;
  data_sources: {
    coingecko: boolean;
    news: boolean;
    reddit: boolean;
    farcaster: boolean;
  };
  last_updated: string;
  token_address: string;
  token_symbol?: string;
}

interface TimelineData {
  token_address: string;
  time_series: Array<{
    timestamp: string;
    sentiment_score: number;
    social_volume: number;
    platforms: {
      reddit: { score: number; volume: number };
      farcaster: { score: number; volume: number };
      news: { score: number; volume: number };
    };
  }>;
  period_hours: number;
  generated_at: string;
}

interface TokenSentimentProps {
  tokenAddress: string;
  tokenSymbol?: string;
}

const TokenSentiment: React.FC<TokenSentimentProps> = ({ tokenAddress, tokenSymbol }) => {
  const { theme } = useTheme();
  const [sentimentData, setSentimentData] = useState<SentimentData | null>(null);
  const [enhancedSentimentData, setEnhancedSentimentData] = useState<EnhancedSentimentData | null>(null);
  const [timelineData, setTimelineData] = useState<TimelineData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'narrative'>('overview');

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

  const fetchEnhancedSentimentData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/tokens/${tokenAddress}/social-sentiment`
      );
      const data = await response.json();
      
      if (data.status === 'success') {
        setEnhancedSentimentData(data.sentiment_analysis);
      } else {
        setError(data.error || 'Failed to fetch enhanced sentiment data');
      }
    } catch (err) {
      setError('Failed to fetch enhanced sentiment data');
      console.error('Error fetching enhanced sentiment data:', err);
    } finally {
      setLoading(false);
    }
  }, [tokenAddress]);

  const fetchTimelineData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/tokens/${tokenAddress}/sentiment-timeline`
      );
      const data = await response.json();
      
      if (data.status === 'success') {
        setTimelineData(data.timeline);
      } else {
        setError(data.error || 'Failed to fetch timeline data');
      }
    } catch (err) {
      setError('Failed to fetch timeline data');
      console.error('Error fetching timeline data:', err);
    } finally {
      setLoading(false);
    }
  }, [tokenAddress]);

  useEffect(() => {
    if (tokenAddress) {
      fetchSentimentData();
      fetchEnhancedSentimentData();
      fetchTimelineData();
    }
  }, [tokenAddress, fetchSentimentData, fetchEnhancedSentimentData, fetchTimelineData]);

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

  // Always show full interface - use placeholder data when no sentiment data available
  const displayData = sentimentData || {
    sentiment_score: 0,
    social_volume: 0,
    trending_rank: 0,
    mentions_24h: 0,
    sentiment_breakdown: {
      positive: 0,
      neutral: 0,
      negative: 0,
    },
    data_sources: {
      coingecko: false,
      news: false,
      reddit: false,
      farcaster: false,
    },
    last_updated: new Date().toISOString(),
    token_address: tokenAddress,
    token_symbol: tokenSymbol,
  };

  const { sentiment_score, social_volume, trending_rank, mentions_24h, sentiment_breakdown, data_sources } = displayData;

  return (
    <div style={containerStyles}>
      <div style={headerStyles}>
        <div style={titleStyles}>
          <Activity className="w-5 h-5" />
          Social Sentiment Analysis
          {!sentimentData && (
            <span style={{ 
              fontSize: '12px', 
              color: theme.text.tertiary, 
              fontWeight: 400,
              marginLeft: '8px' 
            }}>
              (No data)
            </span>
          )}
        </div>
        <ProBadge variant={sentiment_score > 0 ? 'bullish' : sentiment_score < 0 ? 'bearish' : 'neutral'}>
          {getSentimentLabel(sentiment_score)}
        </ProBadge>
      </div>

      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '20px',
        borderBottom: `1px solid ${theme.border.primary}`
      }}>
        {['overview', 'timeline', 'narrative'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as 'overview' | 'timeline' | 'narrative')}
            style={{
              padding: '8px 16px',
              border: 'none',
              background: activeTab === tab ? theme.accent.blue : 'transparent',
              color: activeTab === tab ? theme.text.inverted : theme.text.primary,
              borderRadius: '6px 6px 0 0',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              textTransform: 'capitalize'
            }}
          >
            {tab}
          </button>
        ))}
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
