import React, { useState, useEffect } from 'react';
import { X, TrendingUp } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useMobile } from '../hooks/useMobile';
import { Z_INDEX } from '../utils/zIndex';

interface MobileTokenFABProps {
  isDrawerOpen: boolean;
  onToggle: () => void;
  tokenCount: number;
  hasNewTokens?: boolean;
}

const MobileTokenFAB: React.FC<MobileTokenFABProps> = ({
  isDrawerOpen,
  onToggle,
  tokenCount,
  hasNewTokens = false
}) => {
  const { theme } = useTheme();
  const isMobile = useMobile();
  const [, setHasAnimated] = useState(false);
  const [showPulse, setShowPulse] = useState(false);

  // Show pulse animation on first visit
  useEffect(() => {
    const hasSeenFAB = localStorage.getItem('eaili5_fab_seen');
    if (!hasSeenFAB && isMobile) {
      setShowPulse(true);
      setTimeout(() => setShowPulse(false), 3000);
      localStorage.setItem('eaili5_fab_seen', 'true');
    }
  }, [isMobile]);

  if (!isMobile) return null;

  const fabStyles: React.CSSProperties = {
    position: 'fixed',
    top: '50%', // ✅ Center vertically
    left: '16px', // Keep left positioning
    transform: 'translateY(-50%)', // ✅ Center vertically
    zIndex: Z_INDEX.fab,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '48px',
    height: '48px',
    background: theme.accent.blue,
    borderRadius: '50%',
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    touchAction: 'manipulation',
    WebkitTapHighlightColor: 'transparent',
    animation: showPulse ? 'mobile-fab-pulse 2s ease-in-out' : 'none',
  };

  const badgeStyles: React.CSSProperties = {
    position: 'absolute',
    top: '-4px',
    right: '-4px',
    background: theme.accent.green,
    color: theme.text.inverted,
    fontSize: '10px',
    fontWeight: 600,
    padding: '2px 6px',
    borderRadius: '10px',
    minWidth: '20px',
    textAlign: 'center',
    border: `2px solid ${theme.surface.primary}`,
    fontFamily: 'JetBrains Mono, monospace',
  };

  const handleClick = () => {
    onToggle();
    setHasAnimated(true);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLButtonElement>) => {
    e.currentTarget.style.transform = 'translateX(-50%) scale(0.95)';
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLButtonElement>) => {
    e.currentTarget.style.transform = 'translateX(-50%) scale(1)';
  };

  return (
    <>
      {/* CSS Animation */}
      <style>
        {`
          @keyframes mobile-fab-pulse {
            0%, 100% { 
              transform: translateX(-50%) scale(1);
              box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
            }
            50% { 
              transform: translateX(-50%) scale(1.1);
              box-shadow: 0 6px 20px rgba(59, 130, 246, 0.5);
            }
          }
        `}
      </style>
      
      <button
        style={fabStyles}
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        aria-label={isDrawerOpen ? 'Close token list' : 'Open token list'}
        title={isDrawerOpen ? 'Close token list' : 'Open token list'}
      >
        {isDrawerOpen ? (
          <X className="w-6 h-6" style={{ color: theme.text.inverted }} />
        ) : (
          <TrendingUp className="w-6 h-6" style={{ color: theme.text.inverted }} />
        )}
        
        {/* Token count badge */}
        {!isDrawerOpen && tokenCount > 0 && (
          <div style={badgeStyles}>
            {tokenCount}
          </div>
        )}
        
        {/* New tokens indicator */}
        {!isDrawerOpen && hasNewTokens && (
          <div style={{
            position: 'absolute',
            top: '-2px',
            left: '-2px',
            width: '8px',
            height: '8px',
            background: theme.accent.orange,
            borderRadius: '50%',
            border: `2px solid ${theme.surface.primary}`,
          }} />
        )}
      </button>
    </>
  );
};

export default MobileTokenFAB;
