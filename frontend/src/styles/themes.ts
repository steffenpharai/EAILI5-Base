/**
 * Professional Theme System for EAILI5 Trading Dashboard
 * Jupiter Exchange-inspired color schemes
 */

export interface Theme {
  name: 'dark' | 'light';
  background: {
    primary: string;
    secondary: string;
    tertiary: string;
  };
  surface: {
    primary: string;
    secondary: string;
    tertiary: string;
  };
  border: {
    primary: string;
    secondary: string;
  };
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
    inverted: string;
  };
  accent: {
    blue: string;
    green: string;
    red: string;
    orange: string;
    purple: string;
    gold: string;
  };
}

export const darkTheme: Theme = {
  name: 'dark',
  background: {
    primary: '#13141B',
    secondary: '#1C1E26',
    tertiary: '#252932',
  },
  surface: {
    primary: '#1C1E26',
    secondary: '#252932',
    tertiary: '#2E3341',
  },
  border: {
    primary: '#2A2D3A',
    secondary: '#363944',
  },
  text: {
    primary: '#E2E4E9',
    secondary: '#9CA3B4',
    tertiary: '#6B7280',
    inverted: '#FFFFFF',
  },
  accent: {
    blue: '#3B82F6',
    green: '#10B981',
    red: '#EF4444',
    orange: '#F59E0B',
    purple: '#8B5CF6',
    gold: '#F59E0B',
  },
};

export const lightTheme: Theme = {
  name: 'light',
  background: {
    primary: '#FFFFFF',
    secondary: '#F8F9FA',
    tertiary: '#F1F3F5',
  },
  surface: {
    primary: '#FFFFFF',
    secondary: '#F8F9FA',
    tertiary: '#E9ECEF',
  },
  border: {
    primary: '#E5E7EB',
    secondary: '#D1D5DB',
  },
  text: {
    primary: '#1F2937',
    secondary: '#6B7280',
    tertiary: '#9CA3AF',
    inverted: '#FFFFFF',
  },
  accent: {
    blue: '#2563EB',
    green: '#059669',
    red: '#DC2626',
    orange: '#D97706',
    purple: '#7C3AED',
    gold: '#D97706',
  },
};

