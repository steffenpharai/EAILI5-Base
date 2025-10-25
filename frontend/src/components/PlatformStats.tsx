import React, { useState, useEffect } from 'react';
import { Users, MessageSquare, TrendingUp, Zap, ChevronDown } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useMobile } from '../hooks/useMobile';

interface PlatformStatsProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
  compact?: boolean;
}

interface StatsData {
  activeLearners: number;
  aiInteractions: number;
  portfolioSimulations: number;
  baseTransactions: number;
}

const PlatformStats: React.FC<PlatformStatsProps> = ({ isCollapsed = false, onToggle, compact = false }) => {
  const { theme } = useTheme();
  const [stats, setStats] = useState<StatsData>({
    activeLearners: 0,
    aiInteractions: 0,
    portfolioSimulations: 0,
    baseTransactions: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Try to fetch real AI interactions data
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/analytics/overview`);
      if (response.ok) {
        const data = await response.json();
        if (data.status === 'success') {
          setStats({
            activeLearners: 0, // Accumulating data
            aiInteractions: data.overview?.total_ai_interactions || 0, // Real data
            portfolioSimulations: 0, // Accumulating data
            baseTransactions: 0, // Accumulating data
          });
        }
      }
    } catch (error) {
      console.error('Error fetching AI interactions:', error);
      // Use fallback - show AI interactions as accumulating if no data
      setStats({
        activeLearners: 0, // Accumulating data
        aiInteractions: 0, // Will show "Accumulating Data" if no real data
        portfolioSimulations: 0, // Accumulating data
        baseTransactions: 0, // Accumulating data
      });
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number, isComingSoon: boolean = false, label: string): string => {
    if (isComingSoon) {
      return 'Coming Soon';
    }
    if (num === 0) {
      // Show feature status instead of "Coming Soon"
      if (label === 'AI Research' || label === 'Live DEX Data') {
        return '✓'; // Show checkmark for available features
      }
      return '⟳'; // Show loading symbol for other features
    }
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const statsConfig = [
    {
      icon: MessageSquare,
      label: 'AI Research',
      value: stats.aiInteractions,
      color: theme.accent.blue,
      description: 'Multi-agent analysis',
      isComingSoon: false, // This one shows real data
    },
    {
      icon: TrendingUp,
      label: 'Live DEX Data',
      value: 0,
      color: theme.accent.green,
      description: 'Real-time token prices',
      isComingSoon: false,
    },
    {
      icon: Zap,
      label: 'Portfolio Sim',
      value: 0,
      color: theme.accent.purple,
      description: 'Risk-free trading',
      isComingSoon: false,
    },
    {
      icon: Users,
      label: 'Base Integration',
      value: 0,
      color: theme.accent.orange,
      description: 'L2 blockchain ready',
      isComingSoon: false,
    },
  ];

  const containerStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginTop: '24px',
    width: '100%',
    maxWidth: '600px',
  };

  const headerStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '8px',
    textAlign: 'center',
    position: 'relative',
    gap: '4px',
  };

  const titleStyles: React.CSSProperties = {
    fontSize: '16px',
    fontWeight: 600,
    color: theme.text.primary,
    margin: 0,
    fontFamily: 'Inter, system-ui, sans-serif',
    textAlign: 'center',
  };

  const subtitleStyles: React.CSSProperties = {
    fontSize: '12px',
    color: theme.text.secondary,
    fontWeight: 400,
    margin: 0,
    fontFamily: 'Inter, system-ui, sans-serif',
    textAlign: 'center',
  };

  const toggleButtonStyles: React.CSSProperties = {
    background: 'transparent',
    border: 'none',
    color: theme.text.secondary,
    cursor: 'pointer',
    padding: '2px',
    borderRadius: '4px',
    fontSize: '12px',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const gridStyles: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: window.innerWidth < 768 ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
    gap: '8px',
    opacity: isCollapsed ? 0 : 1,
    maxHeight: isCollapsed ? 0 : '120px',
    overflow: 'hidden',
    transition: 'all 0.3s ease',
  };

  const cardStyles: React.CSSProperties = {
    background: theme.surface.primary,
    border: `1px solid ${theme.border.primary}`,
    borderRadius: '6px',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
    transition: 'all 0.2s ease',
    cursor: 'pointer',
    minHeight: '80px',
  };

  const iconStyles = (color: string): React.CSSProperties => ({
    width: '18px',
    height: '18px',
    color: color,
    marginBottom: '6px',
  });

  const valueStyles: React.CSSProperties = {
    fontSize: '16px',
    fontWeight: 600,
    color: theme.text.primary,
    marginBottom: '2px',
    fontFamily: 'Inter, system-ui, sans-serif',
  };

  const comingSoonStyles: React.CSSProperties = {
    fontSize: '12px',
    fontWeight: 500,
    color: theme.text.secondary,
    marginBottom: '2px',
    fontStyle: 'italic',
    fontFamily: 'Inter, system-ui, sans-serif',
  };

  const labelStyles: React.CSSProperties = {
    fontSize: '10px',
    color: theme.text.secondary,
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    fontFamily: 'Inter, system-ui, sans-serif',
  };

  const descriptionStyles: React.CSSProperties = {
    fontSize: '9px',
    color: theme.text.tertiary,
    fontWeight: 400,
    textAlign: 'center',
    lineHeight: 1.2,
    marginTop: '1px',
    fontFamily: 'Inter, system-ui, sans-serif',
  };

  if (loading) {
    return (
      <div style={containerStyles}>
        <div style={headerStyles}>
          <h3 style={titleStyles}>Platform Stats</h3>
        </div>
        <div style={{ ...gridStyles, opacity: 1 }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={cardStyles}>
              <div style={{ width: '24px', height: '24px', background: theme.surface.tertiary, borderRadius: '4px', marginBottom: '8px' }} />
              <div style={{ width: '60px', height: '24px', background: theme.surface.tertiary, borderRadius: '4px', marginBottom: '4px' }} />
              <div style={{ width: '80px', height: '12px', background: theme.surface.tertiary, borderRadius: '4px' }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Compact mode for footer
  if (compact) {
    const compactStats = [
      { icon: '👥', value: stats.activeLearners, label: 'Learners' },
      { icon: '💬', value: stats.aiInteractions, label: 'AI Chats' },
      { icon: '📊', value: stats.portfolioSimulations, label: 'Sims' },
      { icon: '⛓️', value: stats.baseTransactions, label: 'Txns' },
    ];

    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        fontSize: '11px',
        fontFamily: 'JetBrains Mono, monospace',
        color: theme.text.secondary,
      }}>
        {compactStats.map((stat, index) => (
          <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>{stat.icon}</span>
            <span style={{ fontWeight: 600, color: theme.text.primary }}>
              {formatNumber(stat.value, false, stat.label)}
            </span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={containerStyles}>
      <div style={headerStyles}>
        <h3 style={titleStyles}>Powerful AI Orchestration</h3>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <p style={subtitleStyles}>Multi-agent intelligence delivering real-time crypto insights</p>
        </div>
      </div>
      <div style={{
        ...gridStyles,
        opacity: 1,
        maxHeight: 'none',
        overflow: 'visible'
      }}>
        {statsConfig.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <div
              key={index}
              style={cardStyles}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
              }}
            >
              <IconComponent style={iconStyles(stat.color)} />
              <div style={stat.isComingSoon ? comingSoonStyles : valueStyles}>
                {formatNumber(stat.value, stat.isComingSoon, stat.label)}
              </div>
              <div style={labelStyles}>{stat.label}</div>
              {stat.description && (
                <div style={descriptionStyles}>{stat.description}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PlatformStats;
