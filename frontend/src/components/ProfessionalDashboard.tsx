import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigation } from '../contexts/NavigationContext';
import { useTokenData, Token } from '../hooks/useTokenData';
import TopBar from './TopBar';
import TokenList from './TokenList';
import WelcomeLanding from './WelcomeLanding';
import TokenAnalysisView from './TokenAnalysisView';
import LearningView from './LearningView';
import PortfolioView from './PortfolioView';

const ProfessionalDashboard: React.FC = () => {
  const { theme } = useTheme();
  const { currentView, selectedToken, selectToken } = useNavigation();
  const [category, setCategory] = useState('top15');
  const { tokens, loading, refetch } = useTokenData(category);
  
  const handleCategoryChange = (newCategory: string) => {
    setCategory(newCategory);
    refetch(newCategory);
  };

  const handleTokenSelect = (token: Token) => {
    selectToken(token);
  };

  const dashboardStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    width: '100vw',
    background: theme.background.primary,
    overflow: 'hidden',
  };

  const mainContentStyles: React.CSSProperties = {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
  };

  const dynamicMainAreaStyles: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  };

  return (
    <div style={dashboardStyles}>
      {/* Top Navigation Bar */}
      <TopBar portfolioBalance={100.00} />

      {/* Main Content Area */}
      <div style={mainContentStyles}>
        {/* Always visible token sidebar */}
        <TokenList
          tokens={tokens}
          selectedToken={selectedToken}
          onSelectToken={handleTokenSelect}
          loading={loading}
          category={category}
          onCategoryChange={handleCategoryChange}
        />
        
        {/* Dynamic main area based on currentView */}
        <div style={dynamicMainAreaStyles}>
          {currentView === 'welcome' && <WelcomeLanding />}
          {currentView === 'token' && <TokenAnalysisView token={selectedToken} />}
          {currentView === 'learn' && <LearningView />}
          {currentView === 'portfolio' && <PortfolioView />}
        </div>
      </div>
    </div>
  );
};

export default ProfessionalDashboard;

