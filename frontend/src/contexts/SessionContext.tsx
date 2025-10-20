import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { sessionManager } from '../utils/sessionManager';

interface SessionContextType {
  sessionToken: string;
  isSessionReady: boolean;
  userId: string;
  refreshSession: () => Promise<void>;
  clearSession: () => void;
}

const SessionContext = createContext<SessionContextType>({
  sessionToken: '',
  isSessionReady: false,
  userId: 'anonymous',
  refreshSession: async () => {},
  clearSession: () => {},
});

interface SessionProviderProps {
  children: ReactNode;
}

export const SessionProvider: React.FC<SessionProviderProps> = ({ children }) => {
  const [sessionToken, setSessionToken] = useState<string>('');
  const [isSessionReady, setIsSessionReady] = useState<boolean>(false);
  const [userId, setUserId] = useState<string>('anonymous');

  const initializeSession = async () => {
    try {
      console.log('SessionContext: Initializing global session...');
      const token = await sessionManager.getOrCreateSession('anonymous');
      console.log('SessionContext: Global session created:', token);
      setSessionToken(token);
      setUserId('anonymous');
      setIsSessionReady(true);
    } catch (error) {
      console.error('SessionContext: Failed to initialize session:', error);
      setIsSessionReady(false);
    }
  };

  const refreshSession = async () => {
    try {
      console.log('SessionContext: Refreshing session...');
      setIsSessionReady(false);
      const token = await sessionManager.getOrCreateSession('anonymous');
      console.log('SessionContext: Session refreshed:', token);
      setSessionToken(token);
      setIsSessionReady(true);
    } catch (error) {
      console.error('SessionContext: Failed to refresh session:', error);
      setIsSessionReady(false);
    }
  };

  const clearSession = () => {
    console.log('SessionContext: Clearing session...');
    sessionManager.clearLocalSession();
    setSessionToken('');
    setIsSessionReady(false);
    setUserId('anonymous');
  };

  useEffect(() => {
    initializeSession();
  }, []);

  const value: SessionContextType = {
    sessionToken,
    isSessionReady,
    userId,
    refreshSession,
    clearSession,
  };

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = (): SessionContextType => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};
