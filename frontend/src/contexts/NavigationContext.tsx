import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Token } from '../hooks/useTokenData';

type ViewMode = 'welcome' | 'token' | 'learn' | 'portfolio';

interface NavigationState {
  currentView: ViewMode;
  selectedToken: Token | null;
  setView: (view: ViewMode) => void;
  selectToken: (token: Token | null) => void;
  goHome: () => void;
}

const NavigationContext = createContext<NavigationState | undefined>(undefined);

interface NavigationProviderProps {
  children: ReactNode;
}

export const NavigationProvider: React.FC<NavigationProviderProps> = ({ children }) => {
  const [currentView, setCurrentView] = useState<ViewMode>('welcome');
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);

  const setView = (view: ViewMode) => {
    setCurrentView(view);
  };

  const selectToken = (token: Token | null) => {
    setSelectedToken(token);
    if (token) {
      setCurrentView('token');
    }
  };

  const goHome = () => {
    setCurrentView('welcome');
    setSelectedToken(null);
  };

  const value: NavigationState = {
    currentView,
    selectedToken,
    setView,
    selectToken,
    goHome,
  };

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = (): NavigationState => {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};
