import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { X } from 'lucide-react';

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
  const [isFocused, setIsFocused] = useState(false);

  const containerStyles: React.CSSProperties = {
    position: 'relative',
    width: '100%',
  };

  const inputStyles: React.CSSProperties = {
    width: '100%',
    padding: icon ? '12px 16px 12px 40px' : '12px 16px', // Touch-friendly padding
    background: isFocused ? theme.surface.primary : theme.surface.secondary,
    border: `1px solid ${isFocused ? theme.accent.blue : theme.border.primary}`,
    borderRadius: '6px',
    color: theme.text.primary,
    fontSize: '16px', // Always 16px to prevent iOS zoom
    fontFamily: 'Inter, system-ui, sans-serif',
    transition: 'all 150ms ease',
    outline: 'none',
    minHeight: '44px', // Minimum touch target
    // Enhanced mobile support
    touchAction: 'manipulation',
    WebkitTapHighlightColor: 'transparent',
    // Auto-resize for textarea-like behavior
    resize: 'none',
    overflow: 'hidden',
  };

  const iconStyles: React.CSSProperties = {
    position: 'absolute',
    left: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: theme.text.tertiary,
    pointerEvents: 'none',
  };

  const clearButtonStyles: React.CSSProperties = {
    position: 'absolute',
    right: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'transparent',
    border: 'none',
    color: theme.text.tertiary,
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '4px',
    minHeight: '32px',
    minWidth: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 150ms ease',
    touchAction: 'manipulation',
    WebkitTapHighlightColor: 'transparent',
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
          setIsFocused(true);
          e.currentTarget.style.transform = 'scale(1.02)';
          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
        }}
        onBlur={(e) => {
          setIsFocused(false);
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = 'none';
        }}
        onTouchStart={(e) => {
          e.currentTarget.style.transform = 'scale(1.02)';
        }}
        onTouchEnd={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
        }}
      />
      {/* Clear button when text is present */}
      {value && !disabled && (
        <button
          style={clearButtonStyles}
          onClick={() => onChange('')}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = theme.surface.tertiary;
            e.currentTarget.style.color = theme.text.primary;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = theme.text.tertiary;
          }}
          onTouchStart={(e) => {
            e.currentTarget.style.transform = 'translateY(-50%) scale(0.9)';
            e.currentTarget.style.opacity = '0.8';
          }}
          onTouchEnd={(e) => {
            e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
            e.currentTarget.style.opacity = '1';
          }}
          aria-label="Clear input"
          title="Clear input"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
};

export default ProInput;

