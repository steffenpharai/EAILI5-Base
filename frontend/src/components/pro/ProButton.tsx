import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

interface ProButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
}

const ProButton: React.FC<ProButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
}) => {
  const { theme } = useTheme();

  const sizeStyles = {
    sm: {
      padding: '6px 12px',
      fontSize: '13px',
    },
    md: {
      padding: '8px 16px',
      fontSize: '14px',
    },
    lg: {
      padding: '10px 20px',
      fontSize: '16px',
    },
  };

  const variantStyles = {
    primary: {
      background: theme.accent.blue,
      color: '#FFFFFF',
      border: `1px solid ${theme.accent.blue}`,
      hoverBackground: theme.accent.blue + 'DD',
    },
    secondary: {
      background: theme.surface.secondary,
      color: theme.text.primary,
      border: `1px solid ${theme.border.primary}`,
      hoverBackground: theme.surface.tertiary,
    },
    outline: {
      background: 'transparent',
      color: theme.text.primary,
      border: `1px solid ${theme.border.secondary}`,
      hoverBackground: theme.surface.secondary,
    },
    ghost: {
      background: 'transparent',
      color: theme.text.secondary,
      border: '1px solid transparent',
      hoverBackground: theme.surface.secondary,
    },
  };

  const buttonStyles: React.CSSProperties = {
    ...sizeStyles[size],
    ...variantStyles[variant],
    borderRadius: '6px',
    fontWeight: 500,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    transition: 'all 150ms ease',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    fontFamily: 'Inter, system-ui, sans-serif',
  };

  return (
    <button
      style={buttonStyles}
      className={`pro-button ${className}`}
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.background = variantStyles[variant].hoverBackground;
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.currentTarget.style.background = variantStyles[variant].background;
        }
      }}
    >
      {children}
    </button>
  );
};

export default ProButton;

