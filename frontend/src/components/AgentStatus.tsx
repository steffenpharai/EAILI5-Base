import React, { useEffect, useState } from 'react';
import { Brain, Search, BookOpen, TrendingUp, Globe, Loader2 } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface AgentStatusProps {
  agent: string;
  message: string;
}

const AgentStatus: React.FC<AgentStatusProps> = ({ agent, message }) => {
  const { theme } = useTheme();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    return () => setIsVisible(false);
  }, [agent, message]);

  const agentIcons: { [key: string]: React.ReactNode } = {
    coordinator: <Brain className="w-4 h-4" />,
    educator: <BookOpen className="w-4 h-4" />,
    research: <TrendingUp className="w-4 h-4" />,
    portfolio: <TrendingUp className="w-4 h-4" />,
    trading_strategy: <TrendingUp className="w-4 h-4" />,
    web_search: <Globe className="w-4 h-4" />,
  };

  const agentColors: { [key: string]: string } = {
    coordinator: theme.accent.blue,
    educator: theme.accent.green,
    research: theme.accent.blue,
    portfolio: theme.accent.orange,
    trading_strategy: theme.accent.blue,
    web_search: theme.accent.blue,
  };

  const icon = agentIcons[agent] || <Loader2 className="w-4 h-4 animate-spin" />;
  const color = agentColors[agent] || theme.accent.blue;

  const containerStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    background: theme.surface.secondary,
    border: `1px solid ${theme.border.primary}`,
    borderRadius: '8px',
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? 'translateY(0)' : 'translateY(-10px)',
    transition: 'all 250ms cubic-bezier(0.4, 0, 0.2, 1)',
  };

  const iconContainerStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: color,
    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
  };

  const textStyles: React.CSSProperties = {
    fontSize: '13px',
    color: theme.text.secondary,
    fontFamily: 'Inter, system-ui, sans-serif',
  };

  return (
    <div style={containerStyles}>
      <div style={iconContainerStyles}>
        {icon}
      </div>
      <span style={textStyles}>{message}</span>
    </div>
  );
};

export default AgentStatus;

