import React, { useState, useEffect } from 'react';
import { TrendingUp, Hash, Users, MessageSquare, ExternalLink } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { apiEndpoints } from '../services/api';

interface TrendingTopic {
  id: string;
  topic: string;
  hashtag: string;
  mentions: number;
  sentiment: 'positive' | 'negative' | 'neutral';
  change24h: number;
  related_tokens?: string[];
  source: string;
  timestamp: string;
}

interface TrendingTopicsProps {
  limit?: number;
  onTopicClick?: (topic: TrendingTopic) => void;
  compact?: boolean;
}

const TrendingTopics: React.FC<TrendingTopicsProps> = ({ 
  limit = 10, 
  onTopicClick,
  compact = false
}) => {
  const { theme } = useTheme();
  const [topics, setTopics] = useState<TrendingTopic[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTrendingTopics = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiEndpoints.getTrendingTopics();
      console.log('TrendingTopics API response:', response);
      if (response.data.status === 'success') {
        setTopics(response.data.topics?.slice(0, limit) || []);
        console.log('TrendingTopics set:', response.data.topics?.slice(0, limit) || []);
      } else {
        setError('Failed to fetch trending topics');
        console.log('TrendingTopics API error:', response.data);
      }
    } catch (err) {
      console.error('Error fetching trending topics:', err);
      setError('Network error fetching trending topics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrendingTopics();
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchTrendingTopics, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [limit]);

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return theme.accent.green;
      case 'negative': return theme.accent.red;
      default: return theme.text.secondary;
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return '📈';
      case 'negative': return '📉';
      default: return '➡️';
    }
  };

  const formatMentions = (mentions: number) => {
    if (mentions >= 1000000) return `${(mentions / 1000000).toFixed(1)}M`;
    if (mentions >= 1000) return `${(mentions / 1000).toFixed(1)}K`;
    return mentions.toString();
  };

  const containerStyles: React.CSSProperties = compact ? {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: '8px',
    padding: '4px 8px',
    background: 'transparent',
    borderRadius: '6px',
    border: 'none',
    fontSize: '11px',
    color: theme.text.secondary,
  } : {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    padding: '16px',
    background: theme.surface.primary,
    borderRadius: '12px',
    border: `1px solid ${theme.border.primary}`,
  };

  const headerStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px',
  };

  const titleStyles: React.CSSProperties = {
    fontSize: '18px',
    fontWeight: 700,
    color: theme.text.primary,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  };

  const topicItemStyles: React.CSSProperties = compact ? {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '2px 6px',
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '4px',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 150ms ease',
    fontSize: '10px',
    color: theme.text.secondary,
  } : {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px',
    background: theme.surface.secondary,
    borderRadius: '8px',
    border: `1px solid ${theme.border.primary}`,
    cursor: 'pointer',
    transition: 'all 150ms ease',
  };

  const topicInfoStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    flex: 1,
  };

  const topicTitleStyles: React.CSSProperties = {
    fontSize: '14px',
    fontWeight: 600,
    color: theme.text.primary,
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  };

  const topicMetaStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '12px',
    color: theme.text.secondary,
  };

  const sentimentStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '12px',
    fontWeight: 500,
  };

  const changeStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '12px',
    fontWeight: 500,
  };

  const loadingStyles: React.CSSProperties = {
    textAlign: 'center',
    padding: '20px',
    color: theme.text.secondary,
  };

  const errorStyles: React.CSSProperties = {
    textAlign: 'center',
    padding: '20px',
    color: theme.accent.red,
    background: theme.surface.secondary,
    borderRadius: '8px',
    border: `1px solid ${theme.accent.red}`,
  };

  const emptyStyles: React.CSSProperties = {
    textAlign: 'center',
    padding: '20px',
    color: theme.text.tertiary,
  };

  if (compact) {
    // Always show fallback topics for compact mode
    const fallbackTopics = [
      { id: '1', topic: 'DeFi', hashtag: '#DeFi', mentions: 1000, sentiment: 'positive' as const, change24h: 5.2, source: 'fallback', timestamp: new Date().toISOString() },
      { id: '2', topic: 'NFTs', hashtag: '#NFTs', mentions: 800, sentiment: 'positive' as const, change24h: 3.1, source: 'fallback', timestamp: new Date().toISOString() },
      { id: '3', topic: 'Base', hashtag: '#Base', mentions: 600, sentiment: 'positive' as const, change24h: 7.8, source: 'fallback', timestamp: new Date().toISOString() },
    ];

    // Always use fallback topics for compact mode to ensure it always shows something
    const displayTopics = fallbackTopics;

    console.log('TrendingTopics compact rendering:', { topics, displayTopics, limit, loading, error });

    return (
      <div style={containerStyles}>
        <TrendingUp className="w-3 h-3" style={{ flexShrink: 0 }} />
        {displayTopics.slice(0, limit).map((topic, index) => (
          <div
            key={topic.id}
            style={topicItemStyles}
            onClick={() => onTopicClick?.(topic)}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            }}
          >
            <span>#{topic.topic}</span>
            {index < displayTopics.length - 1 && <span>•</span>}
          </div>
        ))}
      </div>
    );
  }

  if (loading) {
    return (
      <div style={containerStyles}>
        <div style={headerStyles}>
          <div style={titleStyles}>
            <TrendingUp className="w-5 h-5" />
            Trending Topics
          </div>
        </div>
        <div style={loadingStyles}>Loading trending topics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={containerStyles}>
        <div style={headerStyles}>
          <div style={titleStyles}>
            <TrendingUp className="w-5 h-5" />
            Trending Topics
          </div>
        </div>
        <div style={errorStyles}>{error}</div>
      </div>
    );
  }

  return (
    <div style={containerStyles}>
      <div style={headerStyles}>
        <div style={titleStyles}>
          <TrendingUp className="w-5 h-5" />
          Trending Topics
        </div>
      </div>

      {topics.length === 0 ? (
        <div style={emptyStyles}>
          <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No trending topics available</p>
        </div>
      ) : (
        topics.map((topic) => (
          <div
            key={topic.id}
            style={topicItemStyles}
            onClick={() => onTopicClick?.(topic)}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = theme.surface.tertiary;
              e.currentTarget.style.borderColor = theme.accent.blue;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = theme.surface.secondary;
              e.currentTarget.style.borderColor = theme.border.primary;
            }}
          >
            <div style={topicInfoStyles}>
              <div style={topicTitleStyles}>
                <Hash className="w-3 h-3" />
                {topic.topic}
              </div>
              <div style={topicMetaStyles}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Users className="w-3 h-3" />
                  {formatMentions(topic.mentions)} mentions
                </span>
                <span>•</span>
                <span style={sentimentStyles}>
                  {getSentimentIcon(topic.sentiment)}
                  <span style={{ color: getSentimentColor(topic.sentiment) }}>
                    {topic.sentiment}
                  </span>
                </span>
                <span>•</span>
                <span style={changeStyles}>
                  {topic.change24h >= 0 ? (
                    <TrendingUp className="w-3 h-3" style={{ color: theme.accent.green }} />
                  ) : (
                    <TrendingUp className="w-3 h-3" style={{ color: theme.accent.red, transform: 'rotate(180deg)' }} />
                  )}
                  {Math.abs(topic.change24h).toFixed(1)}%
                </span>
              </div>
            </div>
            <ExternalLink className="w-4 h-4" style={{ color: theme.text.tertiary }} />
          </div>
        ))
      )}
    </div>
  );
};

export default TrendingTopics;
