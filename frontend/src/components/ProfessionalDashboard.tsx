import React, { useState } from 'react';
import { useNavigation } from '../contexts/NavigationContext';
import { useSession } from '../contexts/SessionContext';
import { useTheme } from '../contexts/ThemeContext';
import { useMobile } from '../hooks/useMobile';
import { useTokenData, Token } from '../hooks/useTokenData';
import TopBar from './TopBar';
import TokenList from './TokenList';
import MobileTokenFAB from './MobileTokenFAB';
import WelcomeLanding from './WelcomeLanding';
import TokenAnalysisView from './TokenAnalysisView';
import LearningView from './LearningView';
import PortfolioView from './PortfolioView';
import FeedbackBar from './FeedbackBar';
import Footer from './Footer';

const ProfessionalDashboard: React.FC = () => {
  const { currentView, selectedToken, selectToken, setView } = useNavigation();
  const { sessionToken, isSessionReady } = useSession();
  const { theme } = useTheme();
  const isMobile = useMobile();
  const [category, setCategory] = useState('top15');
  const { tokens, loading, refetch } = useTokenData(category);
  const [lastAIMessageId, setLastAIMessageId] = useState<string | undefined>();
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  
  const handleCategoryChange = (newCategory: string) => {
    setCategory(newCategory);
    refetch(newCategory);
  };

  const handleTokenSelect = (token: Token) => {
    selectToken(token);
  };

  const handleDashboardClick = () => {
    selectToken(null); // Clear selected token
    setView('token'); // Navigate to token view
    // This will trigger token-optional mode in TokenAnalysisView
  };

  const dashboardStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh', // Changed from minHeight to exact height
    width: '100%',
    background: theme.background.primary,
    overflow: 'hidden', // Prevent any scrolling
  };

  const mainContentStyles: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    flexDirection: isMobile ? 'column' : 'row',
    overflow: 'hidden',
    minHeight: 0,
  };

  const dynamicMainAreaStyles: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    minHeight: 0,
    paddingBottom: 0, // ✅ Explicit no bottom padding
    marginBottom: 0, // ✅ Explicit no bottom margin
  };

  return (
    <div style={dashboardStyles}>
      {/* Top Navigation Bar */}
      <TopBar 
        portfolioBalance={100.00} 
        onMobileTokenListToggle={() => setIsMobileDrawerOpen(!isMobileDrawerOpen)}
      />

      {/* Feedback Bar - always visible, but only functional with valid session */}
      <FeedbackBar
        messageId={lastAIMessageId}
        sessionId={isSessionReady && sessionToken ? sessionToken : undefined}
        onSupportSent={(transactionHash) => {
          // Keep feedback bar visible after submission
        }}
      />

      {/* Main Content Area */}
      <div style={mainContentStyles}>
        {/* TokenList is now a fixed drawer - no wrapper needed */}
      <TokenList
        tokens={tokens}
        selectedToken={selectedToken}
        onSelectToken={handleTokenSelect}
        loading={loading}
        category={category}
        onCategoryChange={handleCategoryChange}
        isMobileDrawerOpen={isMobileDrawerOpen}
        onMobileDrawerToggle={() => setIsMobileDrawerOpen(!isMobileDrawerOpen)}
        onDashboardClick={handleDashboardClick}
      />
        
        {/* Dynamic main area based on currentView */}
        <div style={dynamicMainAreaStyles}>
          {currentView === 'welcome' && (
            <WelcomeLanding 
              onAIMessageGenerated={(messageId: string) => setLastAIMessageId(messageId)}
            />
          )}
          {currentView === 'token' && (
            <TokenAnalysisView 
              token={selectedToken} 
              onAIMessageGenerated={(messageId: string) => setLastAIMessageId(messageId)}
            />
          )}
          {currentView === 'learn' && <LearningView />}
          {currentView === 'portfolio' && <PortfolioView />}
        </div>

      </div>

      {/* Mobile Token FAB - Only render on mobile */}
      {isMobile && (
        <MobileTokenFAB
          isDrawerOpen={isMobileDrawerOpen}
          onToggle={() => setIsMobileDrawerOpen(!isMobileDrawerOpen)}
          tokenCount={tokens.length}
          hasNewTokens={false} // TODO: Implement new token detection
        />
      )}

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default ProfessionalDashboard;

