import React, { useEffect } from 'react';
import { sdk } from '@farcaster/miniapp-sdk';
import './App.css';
import { ThemeProvider } from './contexts/ThemeContext';
import { NavigationProvider } from './contexts/NavigationContext';
import { SessionProvider } from './contexts/SessionContext';
import ProfessionalDashboard from './components/ProfessionalDashboard';

function App() {
  // Call sdk.actions.ready() immediately when App mounts (per Base docs)
  useEffect(() => {
    sdk.actions.ready();
  }, []);

  return (
    <ThemeProvider>
      <SessionProvider>
        <NavigationProvider>
          <ProfessionalDashboard />
        </NavigationProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}

export default App;