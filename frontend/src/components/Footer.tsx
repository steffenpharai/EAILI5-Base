import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useMobile } from '../hooks/useMobile';
import { Z_INDEX } from '../utils/zIndex';
import PlatformStats from './PlatformStats';

const Footer: React.FC = () => {
  const { theme } = useTheme();
  const isMobile = useMobile();

  const footerStyles: React.CSSProperties = {
    flexShrink: 0,  // ✅ Prevent footer from shrinking
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: isMobile ? '24px' : '32px',
    background: theme.surface.primary,
    borderTop: `1px solid ${theme.border.primary}`,
    padding: isMobile ? '4px 12px' : '8px 16px',
    fontSize: isMobile ? '9px' : '10px',
    fontFamily: 'Inter, system-ui, sans-serif',
    color: theme.text.secondary,
    zIndex: Z_INDEX.footer,
    // Mobile-specific safe area support
    ...(isMobile && {
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
    gap: isMobile ? '4px' : '8px',
    fontSize: isMobile ? '8px' : '10px',
    color: theme.text.tertiary,
  };

  const linkStyles: React.CSSProperties = {
    color: theme.text.secondary,
    textDecoration: 'none',
    transition: 'color 150ms ease',
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
          href="https://x.com/SteffenPharai"
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
          X
        </a>
      </div>
    </div>
  );
};

export default Footer;
