import React, { useState } from 'react';
import { Sun, Moon, Settings, Home, BookOpen, Wallet, Menu, X } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigation } from '../contexts/NavigationContext';
import { useMobile } from '../hooks/useMobile';
import { ProButton } from './pro';
import { CompactWalletButton } from './WalletButton';
import { getNetworkIndicator } from '../utils/minikit';
import { Z_INDEX } from '../utils/zIndex';

interface TopBarProps {
  portfolioBalance?: number;
  onMobileTokenListToggle?: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ portfolioBalance = 100.00, onMobileTokenListToggle }) => {
  const { theme, toggleTheme } = useTheme();
  const { currentView, setView, goHome } = useNavigation();
  const isMobile = useMobile();
  const networkIndicator = getNetworkIndicator();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const topBarStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: isMobile ? '6px 12px' : '12px 20px',
    background: theme.surface.primary,
    borderBottom: `1px solid ${theme.border.primary}`,
    minHeight: isMobile ? '44px' : '56px',
    position: 'relative',  // ✅ Use relative, not fixed
    zIndex: Z_INDEX.topBar,
    flexShrink: 0,  // ✅ Prevent shrinking
    // Safe area insets
    paddingTop: isMobile ? 'max(6px, env(safe-area-inset-top))' : 'max(12px, env(safe-area-inset-top))',
    paddingLeft: isMobile ? 'max(12px, env(safe-area-inset-left))' : 'max(20px, env(safe-area-inset-left))',
    paddingRight: isMobile ? 'max(12px, env(safe-area-inset-right))' : 'max(20px, env(safe-area-inset-right))',
  };

  const logoStyles: React.CSSProperties = {
    fontSize: isMobile ? '14px' : 'clamp(16px, 4vw, 18px)',
    fontWeight: 600,
    color: theme.text.primary,
    fontFamily: 'Inter, system-ui, sans-serif',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
  };

  const navButtonsStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  };

  const mobileNavStyles: React.CSSProperties = {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    background: theme.surface.primary,
    borderBottom: `1px solid ${theme.border.primary}`,
    padding: '16px 20px',
    display: isMobileMenuOpen ? 'flex' : 'none',
    flexDirection: 'column',
    gap: '12px',
    zIndex: Z_INDEX.mobileMenu, // Below TopBar but above other elements
  };

  const rightSectionStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 'clamp(8px, 2vw, 16px)',
  };

  const portfolioStyles: React.CSSProperties = {
    fontSize: 'clamp(12px, 3vw, 14px)',
    color: theme.text.secondary,
    fontFamily: 'JetBrains Mono, monospace',
    display: window.innerWidth < 640 ? 'none' : 'block',
  };

  const balanceStyles: React.CSSProperties = {
    fontWeight: 600,
    color: theme.text.primary,
  };

  return (
    <>
      <div style={topBarStyles}>
        {/* Logo and Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(12px, 3vw, 24px)' }}>
          <div style={logoStyles} onClick={goHome}>
            <img 
              src="/EAILI5.png" 
              alt="EAILI5" 
              style={{
                height: isMobile ? '24px' : '32px',
                width: 'auto',
                cursor: 'pointer',
                filter: theme.name === 'dark' ? 'invert(1) brightness(1.2) contrast(1.1)' : 'none',
                transition: 'filter 0.2s ease',
                transform: 'scale(1.5)',
                transformOrigin: 'center'
              }}
            />
          </div>
          
          {/* Desktop Navigation */}
          <div style={{...navButtonsStyles, display: window.innerWidth < 768 ? 'none' : 'flex'}}>
            <ProButton
              variant={currentView === 'welcome' ? 'primary' : 'ghost'}
              size="sm"
              onClick={goHome}
              className="flex items-center gap-2"
            >
              <Home className="w-4 h-4" />
              Home
            </ProButton>
            
            <ProButton
              variant={currentView === 'learn' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setView('learn')}
              className="flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4" />
              Learn
            </ProButton>
            
            <ProButton
              variant={currentView === 'portfolio' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setView('portfolio')}
              className="flex items-center gap-2"
            >
              <Wallet className="w-4 h-4" />
              Portfolio
            </ProButton>
          </div>

          {/* Mobile Menu Button */}
          <button
            style={{
              display: window.innerWidth < 768 ? 'flex' : 'none',
              alignItems: 'center',
              justifyContent: 'center',
              width: '44px',
              height: '44px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: theme.text.primary,
            }}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          
          {/* Mobile Token List Toggle Button - REMOVED: Now using FAB */}
        </div>

        <div style={rightSectionStyles}>
          <div style={portfolioStyles}>
            Portfolio: <span style={balanceStyles}>${portfolioBalance.toFixed(2)}</span>
          </div>

          <div style={{
            fontSize: 'clamp(10px, 2.5vw, 12px)',
            color: theme.text.secondary,
            fontFamily: 'JetBrains Mono, monospace',
            padding: '4px 8px',
            background: theme.surface.secondary,
            borderRadius: '4px',
            border: `1px solid ${theme.border.primary}`,
            display: window.innerWidth < 480 ? 'none' : 'block',
          }}>
            {networkIndicator}
          </div>

          {/* Wallet Connection with Basenames (Base Batches requirement) */}
          <CompactWalletButton />

          <ProButton
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
          >
            {theme.name === 'dark' ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </ProButton>

          <ProButton
            variant="ghost"
            size="sm"
          >
            <Settings className="w-4 h-4" />
          </ProButton>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      <div style={mobileNavStyles}>
        <ProButton
          variant={currentView === 'welcome' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => {
            goHome();
            setIsMobileMenuOpen(false);
          }}
          className="flex items-center gap-2 w-full justify-start"
        >
          <Home className="w-4 h-4" />
          Home
        </ProButton>
        
        <ProButton
          variant={currentView === 'learn' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => {
            setView('learn');
            setIsMobileMenuOpen(false);
          }}
          className="flex items-center gap-2 w-full justify-start"
        >
          <BookOpen className="w-4 h-4" />
          Learn
        </ProButton>
        
        <ProButton
          variant={currentView === 'portfolio' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => {
            setView('portfolio');
            setIsMobileMenuOpen(false);
          }}
          className="flex items-center gap-2 w-full justify-start"
        >
          <Wallet className="w-4 h-4" />
          Portfolio
        </ProButton>
      </div>
    </>
  );
};

export default TopBar;

