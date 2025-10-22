import React, { useState, useEffect } from 'react';
import { Brain, Loader2, X } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface AgentActivity {
  agent: string;
  message: string;
  timestamp: number;
  status: 'active' | 'completed' | 'error';
}

interface AgentActivityPanelProps {
  activities: AgentActivity[];
  isVisible: boolean;
  onClose?: () => void;
}

const AgentActivityPanel: React.FC<AgentActivityPanelProps> = ({ 
  activities, 
  isVisible, 
  onClose 
}) => {
  const { theme } = useTheme();
  const [displayedActivities, setDisplayedActivities] = useState<AgentActivity[]>([]);

  useEffect(() => {
    if (activities.length > 0) {
      setDisplayedActivities(prev => {
        const newActivities = activities.filter(
          activity => !prev.some(prevActivity => 
            prevActivity.agent === activity.agent && 
            prevActivity.timestamp === activity.timestamp
          )
        );
        return [...prev, ...newActivities].slice(-10); // Keep last 10 activities
      });
    }
  }, [activities]);

  const getAgentDisplayName = (agent: string): string => {
    const names: { [key: string]: string } = {
      coordinator: 'Coordinator',
      educator: 'Educator',
      research: 'Research',
      portfolio: 'Portfolio',
      trading_strategy: 'Trading Strategy',
      web_search: 'Web Search',
    };
    return names[agent] || agent;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Loader2 className="w-3 h-3 animate-spin" />;
      case 'completed':
        return <div className="w-3 h-3 rounded-full bg-green-500" />;
      case 'error':
        return <div className="w-3 h-3 rounded-full bg-red-500" />;
      default:
        return <Loader2 className="w-3 h-3 animate-spin" />;
    }
  };


  const containerStyles: React.CSSProperties = {
    position: 'fixed',
    top: '20px',
    right: '20px',
    width: '320px',
    maxHeight: '400px',
    background: theme.surface.primary,
    border: `1px solid ${theme.border.primary}`,
    borderRadius: '12px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
    zIndex: 1000,
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? 'translateX(0)' : 'translateX(100%)',
    transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
    overflow: 'hidden',
  };

  const headerStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    borderBottom: `1px solid ${theme.border.primary}`,
    background: theme.surface.secondary,
  };

  const titleStyles: React.CSSProperties = {
    fontSize: '16px',
    fontWeight: 600,
    color: theme.text.primary,
    fontFamily: 'Inter, system-ui, sans-serif',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  };

  const closeButtonStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '24px',
    height: '24px',
    borderRadius: '6px',
    background: 'transparent',
    border: 'none',
    color: theme.text.secondary,
    cursor: 'pointer',
    transition: 'all 150ms ease',
  };

  const activitiesContainerStyles: React.CSSProperties = {
    maxHeight: '300px',
    overflowY: 'auto',
    padding: '8px',
  };

  const activityItemStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '8px 12px',
    marginBottom: '4px',
    background: theme.surface.secondary,
    border: `1px solid ${theme.border.primary}`,
    borderRadius: '8px',
    transition: 'all 200ms ease',
  };

  const agentNameStyles: React.CSSProperties = {
    fontSize: '13px',
    fontWeight: 500,
    color: theme.text.primary,
    fontFamily: 'Inter, system-ui, sans-serif',
    minWidth: '80px',
  };

  const messageStyles: React.CSSProperties = {
    fontSize: '12px',
    color: theme.text.secondary,
    fontFamily: 'Inter, system-ui, sans-serif',
    flex: 1,
    lineHeight: '1.4',
  };

  const timestampStyles: React.CSSProperties = {
    fontSize: '10px',
    color: theme.text.tertiary,
    fontFamily: 'JetBrains Mono, monospace',
    minWidth: '40px',
    textAlign: 'right',
  };

  if (!isVisible) return null;

  return (
    <div style={containerStyles}>
      <div style={headerStyles}>
        <div style={titleStyles}>
          <Brain className="w-4 h-4" />
          Agent Activity
        </div>
        {onClose && (
          <button
            style={closeButtonStyles}
            onClick={onClose}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = theme.surface.tertiary;
              e.currentTarget.style.color = theme.text.primary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = theme.text.secondary;
            }}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      
      <div style={activitiesContainerStyles}>
        {displayedActivities.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '20px',
            color: theme.text.tertiary,
            fontSize: '14px',
            fontFamily: 'Inter, system-ui, sans-serif',
          }}>
            No agent activity yet
          </div>
        ) : (
          displayedActivities.map((activity, index) => (
            <div key={`${activity.agent}-${activity.timestamp}-${index}`} style={activityItemStyles}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {getStatusIcon(activity.status)}
                <div style={agentNameStyles}>
                  {getAgentDisplayName(activity.agent)}
                </div>
              </div>
              <div style={messageStyles}>
                {activity.message}
              </div>
              <div style={timestampStyles}>
                {new Date(activity.timestamp).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AgentActivityPanel;
