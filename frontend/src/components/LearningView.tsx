import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigation } from '../contexts/NavigationContext';
import { useAccount } from 'wagmi';
import LearningDashboard from './LearningDashboard';

const LearningView: React.FC = () => {
  const { theme } = useTheme();
  const { goHome } = useNavigation();
  const { address } = useAccount();

  const containerStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    background: theme.background.primary,
    overflow: 'hidden',
  };

  const headerStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    padding: '20px',
    borderBottom: `1px solid ${theme.border.primary}`,
    background: theme.surface.primary,
  };

  const backButtonStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'transparent',
    border: `1px solid ${theme.border.primary}`,
    borderRadius: '8px',
    padding: '8px 16px',
    color: theme.text.secondary,
    cursor: 'pointer',
    transition: 'all 150ms ease',
    marginRight: '20px',
  };

  const contentStyles: React.CSSProperties = {
    flex: 1,
    overflow: 'auto',
    padding: '20px',
  };

  return (
    <div style={containerStyles}>
      {/* Header */}
      <div style={headerStyles}>
        <button style={backButtonStyles} onClick={goHome}>
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>
        <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: theme.text.primary }}>
          Learning Dashboard
        </h1>
      </div>

      {/* Learning Content */}
      <div style={contentStyles}>
        <LearningDashboard userId={address || 'anonymous'} />
      </div>
    </div>
  );
};

export default LearningView;
