import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

interface ProBadgeProps {
  children: React.ReactNode;
  variant?: 'bullish' | 'bearish' | 'neutral' | 'info';
  className?: string;
}

const ProBadge: React.FC<ProBadgeProps> = ({
  children,
  variant = 'neutral',
  className = '',
}) => {
  const { theme } = useTheme();

  const variantStyles = {
    bullish: {
      background: theme.accent.green + '20',
      color: theme.accent.green,
      border: `1px solid ${theme.accent.green}40`,
    },
    bearish: {
      background: theme.accent.red + '20',
      color: theme.accent.red,
      border: `1px solid ${theme.accent.red}40`,
    },
    neutral: {
      background: theme.surface.tertiary,
      color: theme.text.secondary,
      border: `1px solid ${theme.border.primary}`,
    },
    info: {
      background: theme.accent.blue + '20',
      color: theme.accent.blue,
      border: `1px solid ${theme.accent.blue}40`,
    },
  };

  const badgeStyles: React.CSSProperties = {
    ...variantStyles[variant],
    padding: '4px 10px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 500,
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontFamily: 'Inter, system-ui, sans-serif',
  };

  return (
    <span style={badgeStyles} className={`pro-badge ${className}`}>
      {children}
    </span>
  );
};

export default ProBadge;

