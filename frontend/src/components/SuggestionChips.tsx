import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useMobile } from '../hooks/useMobile';

interface SuggestionChipsProps {
  suggestions: string[];
  onSuggestionClick: (suggestion: string) => void;
  className?: string;
}

const SuggestionChips: React.FC<SuggestionChipsProps> = ({ 
  suggestions, 
  onSuggestionClick, 
  className = '' 
}) => {
  const { theme } = useTheme();
  const isMobile = useMobile();

  if (!suggestions || suggestions.length === 0) {
    return null;
  }

  const chipStyles: React.CSSProperties = {
    background: theme.surface.tertiary,
    border: `1px solid ${theme.border.primary}`,
    borderRadius: isMobile ? '16px' : '20px',
    padding: isMobile ? '6px 12px' : '8px 16px',
    fontSize: isMobile ? '12px' : '14px',
    color: theme.text.secondary,
    cursor: 'pointer',
    transition: 'all 150ms ease',
    display: 'inline-block',
    margin: '4px',
    maxWidth: '100%',
    wordWrap: 'break-word',
    minHeight: isMobile ? '32px' : 'auto',  // Ensure touch target
  };

  const hoverStyles: React.CSSProperties = {
    background: theme.accent.blue,
    color: theme.text.inverted,
    borderColor: theme.accent.blue,
    transform: 'translateY(-1px)',
    boxShadow: `0 2px 8px ${theme.accent.blue}20`,
  };

  return (
    <div 
      className={`suggestion-chips ${className}`}
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: isMobile ? '6px' : '8px',
        marginTop: isMobile ? '10px' : '16px',
        marginBottom: 0, // Remove bottom margin to prevent footer jumping
        padding: '0 4px',
      }}
    >
      {suggestions.map((suggestion, index) => (
        <button
          key={index}
          style={chipStyles}
          onClick={() => onSuggestionClick(suggestion)}
          onMouseEnter={(e) => {
            Object.assign(e.currentTarget.style, hoverStyles);
          }}
          onMouseLeave={(e) => {
            Object.assign(e.currentTarget.style, chipStyles);
          }}
          title={suggestion}
        >
          {suggestion}
        </button>
      ))}
    </div>
  );
};

export default SuggestionChips;
