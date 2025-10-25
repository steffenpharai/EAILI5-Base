import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

interface ProButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const ProButton: React.FC<ProButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
  style = {},
}) => {
  const { theme } = useTheme();

  const sizeStyles = {
    sm: {
      padding: '11px 16px', // Ensures 44px minimum height
      fontSize: '13px',
      minHeight: '44px',
      minWidth: '44px',
    },
    md: {
      padding: '13px 20px', // Ensures 44px+ height
      fontSize: '14px',
      minHeight: '44px',
    },
    lg: {
      padding: '15px 24px',
      fontSize: '16px',
      minHeight: '48px',
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
      background: theme.surface.secondary,
      color: theme.text.primary,
      border: `1px solid ${theme.border.primary}`,
      hoverBackground: theme.surface.tertiary,
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
    // Enhanced touch feedback
    touchAction: 'manipulation',
    WebkitTapHighlightColor: 'transparent',
    userSelect: 'none',
    // Ensure minimum touch target
    minHeight: '44px',
    minWidth: '44px',
    // Merge with custom style prop
    ...style,
  };

  return (
    <button
      style={buttonStyles}
      className={`pro-button ${className}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={typeof children === 'string' ? children : 'Button'}
      tabIndex={disabled ? -1 : 0}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && !disabled && onClick) {
          e.preventDefault();
          onClick();
        }
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.background = variantStyles[variant].hoverBackground;
          e.currentTarget.style.transform = 'translateY(-1px)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.currentTarget.style.background = variantStyles[variant].background;
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
        }
      }}
      onTouchStart={(e) => {
        if (!disabled) {
          e.currentTarget.style.transform = 'scale(0.95)';
          e.currentTarget.style.opacity = '0.8';
        }
      }}
      onTouchEnd={(e) => {
        if (!disabled) {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.opacity = '1';
        }
      }}
      onMouseDown={(e) => {
        if (!disabled) {
          e.currentTarget.style.transform = 'scale(0.95)';
        }
      }}
      onMouseUp={(e) => {
        if (!disabled) {
          e.currentTarget.style.transform = 'scale(1)';
        }
      }}
    >
      {children}
    </button>
  );
};

export default ProButton;

