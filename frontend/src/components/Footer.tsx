import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useMobile } from '../hooks/useMobile';
import PlatformStats from './PlatformStats';

const Footer: React.FC = () => {
  const { theme } = useTheme();
  const isMobile = useMobile();

  const footerStyles: React.CSSProperties = {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    height: '32px',
    background: theme.surface.primary,
    borderTop: `1px solid ${theme.border.primary}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 16px',
    fontSize: '10px',
    fontFamily: 'Inter, system-ui, sans-serif',
    color: theme.text.secondary,
    zIndex: 1000, // Ensure footer is above all content
    // Mobile-specific safe area support
    ...(isMobile && {
      zIndex: 1070,
      paddingBottom: 'max(8px, env(safe-area-inset-bottom))',
      height: 'calc(32px + max(8px, env(safe-area-inset-bottom)))',
    }),
  };

  const leftSectionStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  };

  const rightSectionStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '10px',
    color: theme.text.tertiary,
  };

  const linkStyles: React.CSSProperties = {
    color: theme.text.secondary,
    textDecoration: 'none',
    transition: 'color 150ms ease',
  };

  const linkHoverStyles: React.CSSProperties = {
    color: theme.accent.blue,
  };

  return (
    <div style={footerStyles}>
      {/* Left Section - Platform Stats */}
      <div style={leftSectionStyles}>
        <PlatformStats compact={true} />
      </div>

      {/* Right Section - Contact Info */}
      <div style={rightSectionStyles}>
        <span>Built by</span>
        <a
          href="https://base.app/profile/stefo0"
          target="_blank"
          rel="noopener noreferrer"
          style={linkStyles}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = theme.accent.blue;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = theme.text.secondary;
          }}
        >
          stefo0.base.eth
        </a>
        <span>·</span>
        <a
          href="https://base.org/builder-track"
          target="_blank"
          rel="noopener noreferrer"
          style={linkStyles}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = theme.accent.blue;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = theme.text.secondary;
          }}
        >
          Base Builder Track
        </a>
      </div>
    </div>
  );
};

export default Footer;
