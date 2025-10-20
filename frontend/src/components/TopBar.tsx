import React from 'react';
import { Sun, Moon, Settings, Home, BookOpen, Wallet, Brain } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigation } from '../contexts/NavigationContext';
import { ProButton } from './pro';
import { CompactWalletButton } from './WalletButton';
import { getNetworkIndicator } from '../utils/minikit';

interface TopBarProps {
  portfolioBalance?: number;
}

const TopBar: React.FC<TopBarProps> = ({ portfolioBalance = 100.00 }) => {
  const { theme, toggleTheme } = useTheme();
  const { currentView, setView, goHome } = useNavigation();
  const networkIndicator = getNetworkIndicator();

  const topBarStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 20px',
    background: theme.surface.primary,
    borderBottom: `1px solid ${theme.border.primary}`,
    height: '56px',
  };

  const logoStyles: React.CSSProperties = {
    fontSize: '18px',
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

  const rightSectionStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  };

  const portfolioStyles: React.CSSProperties = {
    fontSize: '14px',
    color: theme.text.secondary,
    fontFamily: 'JetBrains Mono, monospace',
  };

  const balanceStyles: React.CSSProperties = {
    fontWeight: 600,
    color: theme.text.primary,
  };

  return (
    <div style={topBarStyles}>
      {/* Logo and Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        <div style={logoStyles} onClick={goHome}>
          <Brain className="w-5 h-5" />
          EAILI5
        </div>
        
        <div style={navButtonsStyles}>
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
      </div>

      <div style={rightSectionStyles}>
        <div style={portfolioStyles}>
          Portfolio: <span style={balanceStyles}>${portfolioBalance.toFixed(2)}</span>
        </div>

        <div style={{
          fontSize: '12px',
          color: theme.text.secondary,
          fontFamily: 'JetBrains Mono, monospace',
          padding: '4px 8px',
          background: theme.surface.secondary,
          borderRadius: '4px',
          border: `1px solid ${theme.border.primary}`
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
  );
};

export default TopBar;

