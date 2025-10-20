import React from 'react';
import './App.css';
import { ThemeProvider } from './contexts/ThemeContext';
import { NavigationProvider } from './contexts/NavigationContext';
import { SessionProvider } from './contexts/SessionContext';
import ProfessionalDashboard from './components/ProfessionalDashboard';

function App() {
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