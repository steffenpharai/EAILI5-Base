import React, { useEffect, useState, useCallback } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { TrendingUp, TrendingDown, Users, MessageCircle, Activity, AlertTriangle, Brain, BarChart3 } from 'lucide-react';
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
  };
  ai_narrative?: string;  // ADD THIS
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

interface EnhancedTokenSentimentProps {
  tokenAddress: string;
  tokenSymbol?: string;
}

const EnhancedTokenSentiment: React.FC<EnhancedTokenSentimentProps> = ({ tokenAddress, tokenSymbol }) => {
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
        setEnhancedSentimentData({
          ...data.sentiment_analysis,
          ai_narrative: data.ai_narrative
        });
      } else {
        // Show actual error from backend
        setError(data.error || 'Failed to fetch enhanced sentiment data');
      }
    } catch (err: any) { // Explicitly type err as any
      setError(`Network error: ${err.message}`);
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
    if (score < -0.3) return 'Very Bearish';
    if (score < -0.1) return 'Bearish';
    return 'Neutral';
  };

  const formatNumber = (num: number) => {
    if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
    return num.toString();
  };

  if (loading && !sentimentData) {
    return (
      <div style={{
        background: theme.surface.primary,
        border: `1px solid ${theme.border.primary}`,
        borderRadius: '12px',
        padding: '20px',
        marginTop: '16px',
        textAlign: 'center',
        color: theme.text.secondary
      }}>
        Loading social sentiment analysis...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        background: theme.surface.primary,
        border: `1px solid ${theme.border.primary}`,
        borderRadius: '12px',
        padding: '20px',
        marginTop: '16px',
        color: theme.accent.red
      }}>
        Error: {error}
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
  };

  const gaugeInnerStyles: React.CSSProperties = {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    background: theme.surface.primary,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const metricsGridStyles: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
    gap: '12px',
    marginBottom: '20px',
  };

  const metricCardStyles: React.CSSProperties = {
    background: theme.surface.secondary,
    border: `1px solid ${theme.border.primary}`,
    borderRadius: '8px',
    padding: '12px',
    textAlign: 'center',
  };

  const breakdownStyles: React.CSSProperties = {
    display: 'flex',
    gap: '8px',
    marginBottom: '20px',
  };

  const breakdownItemStyles: React.CSSProperties = {
    flex: 1,
    padding: '8px 12px',
    borderRadius: '6px',
    textAlign: 'center',
    fontSize: '12px',
  };

  const dataSourcesStyles: React.CSSProperties = {
    fontSize: '12px',
    color: theme.text.secondary,
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
  };

  const tabContentWrapperStyles: React.CSSProperties = {
    minHeight: '400px',
    transition: 'opacity 200ms ease-in-out',
  };

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
        {[
          { key: 'overview', label: 'Overview', icon: Activity },
          { key: 'timeline', label: 'Timeline', icon: BarChart3 },
          { key: 'narrative', label: 'AI Reasoning', icon: Brain }
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as 'overview' | 'timeline' | 'narrative')}
            style={{
              padding: '8px 16px',
              border: 'none',
              background: activeTab === key ? theme.accent.blue : 'transparent',
              color: activeTab === key ? theme.text.inverted : theme.text.primary,
              borderRadius: '6px 6px 0 0',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div style={tabContentWrapperStyles}>
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
                Mentions (24h)
              </div>
              <div style={{ fontSize: '16px', fontWeight: 600, color: theme.accent.blue }}>
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
            {data_sources.farcaster && <span style={{ color: theme.accent.purple }}>✓ Farcaster</span>}
            {!data_sources.coingecko && !data_sources.news && !data_sources.reddit && !data_sources.farcaster && (
              <span style={{ color: theme.text.tertiary }}>No data available</span>
            )}
          </div>
        </div>
      )}

      {activeTab === 'timeline' && (
        <div style={tabContentWrapperStyles}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: theme.text.primary, marginBottom: '16px' }}>
            Sentiment Timeline
          </h3>
          {timelineData && timelineData.time_series && timelineData.time_series.length > 0 ? (
            <div>
              <div style={{ fontSize: '14px', color: theme.text.secondary, marginBottom: '12px' }}>
                Last {timelineData.period_hours} hours • {timelineData.time_series.length} data points
              </div>
              
              {/* SVG Chart */}
              <div style={{
                background: theme.surface.secondary,
                borderRadius: '8px',
                padding: '20px',
                border: `1px solid ${theme.border.primary}`,
                position: 'relative'
              }}>
                <svg width="100%" height="250" viewBox="0 0 800 250" preserveAspectRatio="xMidYMid meet">
                  {/* Grid lines */}
                  <line x1="0" y1="125" x2="800" y2="125" stroke={theme.border.primary} strokeWidth="2" opacity="0.5" />
                  {[50, 100, 150, 200].map(y => (
                    <line key={y} x1="0" y1={y} x2="800" y2={y} stroke={theme.border.primary} strokeWidth="1" opacity="0.2" />
                  ))}
                  
                  {/* Zero line label */}
                  <text x="5" y="120" fill={theme.text.tertiary} fontSize="10">0</text>
                  
                  {/* Sentiment line */}
                  <polyline
                    points={timelineData.time_series.map((point, i) => {
                      const x = (i / Math.max(timelineData.time_series.length - 1, 1)) * 780 + 10;
                      const y = 125 - (point.sentiment_score * 100);
                      return `${x},${Math.max(10, Math.min(240, y))}`;
                    }).join(' ')}
                    fill="none"
                    stroke={theme.accent.blue}
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                  
                  {/* Data points */}
                  {timelineData.time_series.map((point, i) => {
                    const x = (i / Math.max(timelineData.time_series.length - 1, 1)) * 780 + 10;
                    const y = Math.max(10, Math.min(240, 125 - (point.sentiment_score * 100)));
                    const color = point.sentiment_score > 0 ? theme.accent.green : 
                                 point.sentiment_score < 0 ? theme.accent.red : 
                                 theme.text.secondary;
                    return (
                      <circle
                        key={i}
                        cx={x}
                        cy={y}
                        r="3"
                        fill={color}
                        stroke={theme.surface.primary}
                        strokeWidth="2"
                      />
                    );
                  })}
                </svg>
                
                {/* Legend */}
                <div style={{
                  marginTop: '12px',
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '16px',
                  fontSize: '11px',
                  color: theme.text.tertiary
                }}>
                  <span><span style={{ color: theme.accent.green }}>●</span> Positive</span>
                  <span><span style={{ color: theme.text.secondary }}>●</span> Neutral</span>
                  <span><span style={{ color: theme.accent.red }}>●</span> Negative</span>
                </div>
              </div>
            </div>
          ) : (
            <div style={{
              color: theme.text.secondary,
              textAlign: 'center',
              padding: '40px',
              background: theme.surface.secondary,
              borderRadius: '8px',
              border: `1px solid ${theme.border.primary}`
            }}>
              {loading ? 'Loading timeline data...' : 'No timeline data available'}
            </div>
          )}
        </div>
      )}

      {activeTab === 'narrative' && (
        <div style={tabContentWrapperStyles}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: theme.text.primary, marginBottom: '16px' }}>
            AI Reasoning Engine
          </h3>
          {error ? (
            <div style={{
              color: theme.accent.red,
              background: `${theme.accent.red}20`,
              padding: '16px',
              borderRadius: '8px',
              border: `1px solid ${theme.accent.red}`,
              marginBottom: '16px'
            }}>
              <strong>Error:</strong> {error}
            </div>
          ) : enhancedSentimentData ? (
            <div>
              {/* AI Narrative */}
              <div style={{
                background: theme.surface.secondary,
                borderRadius: '8px',
                padding: '16px',
                border: `1px solid ${theme.border.primary}`,
                marginBottom: '16px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '12px'
                }}>
                  <Brain className="w-5 h-5" style={{ color: theme.accent.blue }} />
                  <h4 style={{ fontSize: '14px', fontWeight: 600, color: theme.text.primary }}>
                    EAILI5 Analysis
                  </h4>
                </div>
                
                <div style={{
                  fontSize: '14px',
                  color: theme.text.primary,
                  lineHeight: '1.7',
                  padding: '14px',
                  background: `${theme.accent.blue}15`,
                  borderRadius: '6px',
                  borderLeft: `3px solid ${theme.accent.blue}`
                }}>
                  {enhancedSentimentData.ai_narrative || 'Generating AI narrative...'}
                </div>
              </div>

              {/* Anomalies */}
              {enhancedSentimentData.anomalies.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <h4 style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: theme.accent.orange,
                    marginBottom: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <AlertTriangle className="w-4 h-4" />
                    Detected Anomalies
                  </h4>
                  {enhancedSentimentData.anomalies.map((anomaly, index) => (
                    <div key={index} style={{
                      background: `${theme.accent.orange}20`,
                      border: `1px solid ${theme.accent.orange}`,
                      borderRadius: '6px',
                      padding: '12px',
                      marginBottom: '8px'
                    }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: theme.accent.orange }}>
                        {anomaly.type} ({anomaly.severity})
                      </div>
                      <div style={{ fontSize: '12px', color: theme.text.secondary, marginTop: '4px' }}>
                        {anomaly.description}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Metrics Summary */}
              <div style={{
                background: theme.surface.secondary,
                borderRadius: '8px',
                padding: '16px',
                border: `1px solid ${theme.border.primary}`
              }}>
                <h4 style={{ fontSize: '14px', fontWeight: 600, color: theme.text.primary, marginBottom: '12px' }}>
                  Sentiment Metrics
                </h4>
                
                <div style={{ display: 'grid', gap: '8px' }}>
                  <div style={{ fontSize: '13px', color: theme.text.primary }}>
                    <strong>Overall Score:</strong>{' '}
                    <span style={{
                      color: enhancedSentimentData.sentiment_metrics.overall_score > 0 ? theme.accent.green : theme.accent.red
                    }}>
                      {enhancedSentimentData.sentiment_metrics.overall_score.toFixed(3)}
                    </span>
                  </div>
                  <div style={{ fontSize: '13px', color: theme.text.primary }}>
                    <strong>Confidence:</strong> {(enhancedSentimentData.sentiment_metrics.confidence * 100).toFixed(0)}%
                  </div>
                  <div style={{ fontSize: '13px', color: theme.text.primary }}>
                    <strong>Total Volume:</strong> {formatNumber(enhancedSentimentData.sentiment_metrics.total_volume)}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ color: theme.text.secondary, textAlign: 'center', padding: '20px' }}>
              Loading AI narrative...
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EnhancedTokenSentiment;
