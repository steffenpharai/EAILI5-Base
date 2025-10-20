import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

interface ProCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  style?: React.CSSProperties;
}

const ProCard: React.FC<ProCardProps> = ({ 
  children, 
  className = '',
  onClick,
  padding = 'md',
  style
}) => {
  const { theme } = useTheme();

  const paddingStyles = {
    none: '0',
    sm: '12px',
    md: '16px',
    lg: '24px',
  };

  const cardStyles: React.CSSProperties = {
    background: theme.surface.primary,
    border: `1px solid ${theme.border.primary}`,
    borderRadius: '8px',
    padding: paddingStyles[padding],
    cursor: onClick ? 'pointer' : 'default',
    transition: 'all 150ms ease',
    ...style, // Merge custom styles
  };

  return (
    <div 
      style={cardStyles}
      className={`pro-card ${className}`}
      onClick={onClick}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.borderColor = theme.border.secondary;
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.borderColor = theme.border.primary;
          e.currentTarget.style.boxShadow = 'none';
        }
      }}
    >
      {children}
    </div>
  );
};

export default ProCard;

