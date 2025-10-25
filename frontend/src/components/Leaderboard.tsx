import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Award, Users, TrendingUp, Star } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { apiEndpoints } from '../services/api';

interface LeaderboardEntry {
  rank: number;
  user_id: string;
  username?: string;
  avatar?: string;
  total_xp: number;
  level: number;
  achievements_count: number;
  lessons_completed: number;
  streak_days: number;
  badges: string[];
  change_24h?: number;
}

interface LeaderboardProps {
  limit?: number;
  timeRange?: 'daily' | 'weekly' | 'monthly' | 'all';
  onUserClick?: (user: LeaderboardEntry) => void;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ 
  limit = 10, 
  timeRange = 'all',
  onUserClick 
}) => {
  const { theme } = useTheme();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiEndpoints.getLeaderboard();
      if (response.data.status === 'success') {
        setEntries(response.data.leaderboard?.slice(0, limit) || []);
      } else {
        setError('Failed to fetch leaderboard');
      }
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      setError('Network error fetching leaderboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
    
    // Refresh every 10 minutes
    const interval = setInterval(fetchLeaderboard, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [limit, timeRange]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Trophy className="w-5 h-5" style={{ color: '#FFD700' }} />;
      case 2: return <Medal className="w-5 h-5" style={{ color: '#C0C0C0' }} />;
      case 3: return <Award className="w-5 h-5" style={{ color: '#CD7F32' }} />;
      default: return <span style={{ 
        fontSize: '14px', 
        fontWeight: 600, 
        color: theme.text.secondary,
        minWidth: '20px',
        textAlign: 'center'
      }}>#{rank}</span>;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return '#FFD700';
      case 2: return '#C0C0C0';
      case 3: return '#CD7F32';
      default: return theme.text.secondary;
    }
  };

  const formatXP = (xp: number) => {
    if (xp >= 1000000) return `${(xp / 1000000).toFixed(1)}M`;
    if (xp >= 1000) return `${(xp / 1000).toFixed(1)}K`;
    return xp.toString();
  };

  const containerStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
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

  const entryStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    background: theme.surface.secondary,
    borderRadius: '8px',
    border: `1px solid ${theme.border.primary}`,
    cursor: 'pointer',
    transition: 'all 150ms ease',
  };

  const rankStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '32px',
    height: '32px',
  };

  const userInfoStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flex: 1,
  };

  const avatarStyles: React.CSSProperties = {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: theme.accent.blue,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: '12px',
    fontWeight: 600,
  };

  const userDetailsStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  };

  const usernameStyles: React.CSSProperties = {
    fontSize: '14px',
    fontWeight: 600,
    color: theme.text.primary,
  };

  const statsStyles: React.CSSProperties = {
    fontSize: '12px',
    color: theme.text.secondary,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  };

  const xpStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '2px',
  };

  const xpValueStyles: React.CSSProperties = {
    fontSize: '14px',
    fontWeight: 600,
    color: theme.text.primary,
  };

  const levelStyles: React.CSSProperties = {
    fontSize: '12px',
    color: theme.text.secondary,
  };

  const changeStyles: React.CSSProperties = {
    fontSize: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '2px',
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

  if (loading) {
    return (
      <div style={containerStyles}>
        <div style={headerStyles}>
          <div style={titleStyles}>
            <Trophy className="w-5 h-5" />
            Leaderboard
          </div>
        </div>
        <div style={loadingStyles}>Loading leaderboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={containerStyles}>
        <div style={headerStyles}>
          <div style={titleStyles}>
            <Trophy className="w-5 h-5" />
            Leaderboard
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
          <Trophy className="w-5 h-5" />
          Leaderboard
        </div>
      </div>

      {entries.length === 0 ? (
        <div style={emptyStyles}>
          <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No leaderboard data available</p>
        </div>
      ) : (
        entries.map((entry) => (
          <div
            key={entry.user_id}
            style={entryStyles}
            onClick={() => onUserClick?.(entry)}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = theme.surface.tertiary;
              e.currentTarget.style.borderColor = theme.accent.blue;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = theme.surface.secondary;
              e.currentTarget.style.borderColor = theme.border.primary;
            }}
          >
            <div style={rankStyles}>
              {getRankIcon(entry.rank)}
            </div>
            
            <div style={userInfoStyles}>
              <div style={avatarStyles}>
                {entry.avatar ? (
                  <img 
                    src={entry.avatar} 
                    alt={entry.username || 'User'} 
                    style={{ width: '100%', height: '100%', borderRadius: '50%' }}
                  />
                ) : (
                  (entry.username || entry.user_id.slice(0, 2)).toUpperCase()
                )}
              </div>
              
              <div style={userDetailsStyles}>
                <div style={usernameStyles}>
                  {entry.username || `${entry.user_id.slice(0, 6)}...${entry.user_id.slice(-4)}`}
                </div>
                <div style={statsStyles}>
                  <span>Level {entry.level}</span>
                  <span>•</span>
                  <span>{entry.lessons_completed} lessons</span>
                  <span>•</span>
                  <span>{entry.streak_days} day streak</span>
                </div>
              </div>
            </div>
            
            <div style={xpStyles}>
              <div style={xpValueStyles}>
                {formatXP(entry.total_xp)} XP
              </div>
              <div style={levelStyles}>
                {entry.achievements_count} achievements
              </div>
              {entry.change_24h !== undefined && (
                <div style={{
                  ...changeStyles,
                  color: entry.change_24h >= 0 ? theme.accent.green : theme.accent.red
                }}>
                  {entry.change_24h >= 0 ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingUp className="w-3 h-3" style={{ transform: 'rotate(180deg)' }} />
                  )}
                  {Math.abs(entry.change_24h)}
                </div>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default Leaderboard;
