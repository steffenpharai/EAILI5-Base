import React, { useState } from 'react';
import { useNavigation } from '../contexts/NavigationContext';
import { useSession } from '../contexts/SessionContext';
import { useMobile } from '../hooks/useMobile';
import { useTokenData, Token } from '../hooks/useTokenData';
import TopBar from './TopBar';
import TokenList from './TokenList';
import WelcomeLanding from './WelcomeLanding';
import TokenAnalysisView from './TokenAnalysisView';
import LearningView from './LearningView';
import PortfolioView from './PortfolioView';
import FeedbackBar from './FeedbackBar';
import Footer from './Footer';

const ProfessionalDashboard: React.FC = () => {
  const { currentView, selectedToken, selectToken, setView } = useNavigation();
  const { sessionToken, isSessionReady } = useSession();
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
    height: '100vh',
    width: '100vw',
    background: 'transparent',
    overflow: 'hidden',
    position: 'fixed',
    top: 0,
    left: 0,
    margin: '0',
    padding: '0',
  };

  const mainContentStyles: React.CSSProperties = {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
    flexDirection: isMobile ? 'column' : 'row',
    height: isMobile ? 'calc(100vh - 172px)' : 'calc(100vh - 152px)', // Account for TopBar + FeedbackBar + Footer + extra spacing
    gap: 0,
    margin: 0,
    padding: 0,
    // Enhanced mobile layout with safe areas
    ...(isMobile && {
      paddingTop: 'env(safe-area-inset-top)',
      paddingBottom: 'env(safe-area-inset-bottom)',
      paddingLeft: 'env(safe-area-inset-left)',
      paddingRight: 'env(safe-area-inset-right)',
    }),
  };

  const dynamicMainAreaStyles: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'auto',
    padding: '0',
    margin: '0',
    width: '100%',
    height: '100%',
    background: 'transparent',
    gap: 0,
    // Enhanced mobile layout with proper z-index management
    ...(isMobile && {
      position: 'relative',
      zIndex: 1,
      // Ensure content doesn't get hidden behind overlays
      paddingBottom: '80px', // Space for AI Insights panel
    }),
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
          console.log('Support transaction sent:', transactionHash);
          // Keep feedback bar visible after submission
        }}
      />

      {/* Footer */}
      <Footer />

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
    </div>
  );
};

export default ProfessionalDashboard;

