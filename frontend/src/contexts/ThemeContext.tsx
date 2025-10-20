import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Theme, darkTheme, lightTheme } from '../styles/themes';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    // Check localStorage for saved theme preference
    const saved = localStorage.getItem('eaili5-theme');
    return saved === 'light' ? lightTheme : darkTheme;
  });

  useEffect(() => {
    // Save theme preference
    localStorage.setItem('eaili5-theme', theme.name);
    
    // Apply theme to document root
    document.documentElement.style.setProperty('--bg-primary', theme.background.primary);
    document.documentElement.style.setProperty('--bg-secondary', theme.background.secondary);
    document.documentElement.style.setProperty('--bg-tertiary', theme.background.tertiary);
    
    document.documentElement.style.setProperty('--surface-primary', theme.surface.primary);
    document.documentElement.style.setProperty('--surface-secondary', theme.surface.secondary);
    document.documentElement.style.setProperty('--surface-tertiary', theme.surface.tertiary);
    
    document.documentElement.style.setProperty('--border-primary', theme.border.primary);
    document.documentElement.style.setProperty('--border-secondary', theme.border.secondary);
    
    document.documentElement.style.setProperty('--text-primary', theme.text.primary);
    document.documentElement.style.setProperty('--text-secondary', theme.text.secondary);
    document.documentElement.style.setProperty('--text-tertiary', theme.text.tertiary);
    
    document.documentElement.style.setProperty('--accent-blue', theme.accent.blue);
    document.documentElement.style.setProperty('--accent-green', theme.accent.green);
    document.documentElement.style.setProperty('--accent-red', theme.accent.red);
    document.documentElement.style.setProperty('--accent-orange', theme.accent.orange);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev.name === 'dark' ? lightTheme : darkTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

