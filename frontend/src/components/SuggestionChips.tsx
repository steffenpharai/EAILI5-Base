import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

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

  if (!suggestions || suggestions.length === 0) {
    return null;
  }

  const chipStyles: React.CSSProperties = {
    background: theme.surface.tertiary,
    border: `1px solid ${theme.border.primary}`,
    borderRadius: '20px',
    padding: '8px 16px',
    fontSize: '14px',
    color: theme.text.secondary,
    cursor: 'pointer',
    transition: 'all 150ms ease',
    display: 'inline-block',
    margin: '4px',
    maxWidth: '100%',
    wordWrap: 'break-word',
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
        gap: '8px',
        marginTop: '16px',
        marginBottom: '16px',
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
