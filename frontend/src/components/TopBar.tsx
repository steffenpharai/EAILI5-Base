import React, { useState } from 'react';
import { Sun, Moon, Settings, Home, BookOpen, Wallet, Brain, Menu, X, TrendingUp } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigation } from '../contexts/NavigationContext';
import { ProButton } from './pro';
import { CompactWalletButton } from './WalletButton';
import { getNetworkIndicator } from '../utils/minikit';

interface TopBarProps {
  portfolioBalance?: number;
  onMobileTokenListToggle?: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ portfolioBalance = 100.00, onMobileTokenListToggle }) => {
  const { theme, toggleTheme } = useTheme();
  const { currentView, setView, goHome } = useNavigation();
  const networkIndicator = getNetworkIndicator();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const topBarStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 20px',
    paddingTop: 'max(12px, env(safe-area-inset-top))',
    paddingLeft: 'max(20px, env(safe-area-inset-left))',
    paddingRight: 'max(20px, env(safe-area-inset-right))',
    background: theme.surface.primary,
    borderBottom: `1px solid ${theme.border.primary}`,
    minHeight: '56px',
    position: 'relative',
  };

  const logoStyles: React.CSSProperties = {
    fontSize: 'clamp(16px, 4vw, 18px)',
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
    zIndex: 1000,
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
            <Brain className="w-5 h-5" />
            EAILI5
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
          
          {/* Mobile Token List Toggle Button */}
          {window.innerWidth < 768 && onMobileTokenListToggle && (
            <button
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '44px',
                height: '44px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: theme.text.primary,
                marginLeft: '8px',
              }}
              onClick={onMobileTokenListToggle}
              title="Toggle Token List"
            >
              <TrendingUp size={20} />
            </button>
          )}
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

