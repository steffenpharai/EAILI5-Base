import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

interface ProInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  onKeyPress?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  icon?: React.ReactNode;
}

const ProInput: React.FC<ProInputProps> = ({
  value,
  onChange,
  placeholder = '',
  disabled = false,
  className = '',
  onKeyPress,
  icon,
}) => {
  const { theme } = useTheme();

  const containerStyles: React.CSSProperties = {
    position: 'relative',
    width: '100%',
  };

  const inputStyles: React.CSSProperties = {
    width: '100%',
    padding: icon ? '8px 12px 8px 36px' : '8px 12px',
    background: theme.surface.secondary,
    border: `1px solid ${theme.border.primary}`,
    borderRadius: '6px',
    color: theme.text.primary,
    fontSize: '14px',
    fontFamily: 'Inter, system-ui, sans-serif',
    transition: 'all 150ms ease',
    outline: 'none',
  };

  const iconStyles: React.CSSProperties = {
    position: 'absolute',
    left: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: theme.text.tertiary,
    pointerEvents: 'none',
  };

  return (
    <div style={containerStyles}>
      {icon && <div style={iconStyles}>{icon}</div>}
      <input
        type="text"
        style={inputStyles}
        className={`pro-input ${className}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyPress={onKeyPress}
        placeholder={placeholder}
        disabled={disabled}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = theme.accent.blue;
          e.currentTarget.style.background = theme.surface.primary;
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = theme.border.primary;
          e.currentTarget.style.background = theme.surface.secondary;
        }}
      />
    </div>
  );
};

export default ProInput;

