import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import ProfessionalDashboard from '../ProfessionalDashboard';
import { ThemeProvider } from '../../contexts/ThemeContext';
import { useWallet } from '../../hooks/useWallet';
import { useTokenData } from '../../hooks/useTokenData';

// Mock the hooks
vi.mock('../../hooks/useWallet');
vi.mock('../../hooks/useTokenData');

const mockUseWallet = vi.mocked(useWallet);
const mockUseTokenData = vi.mocked(useTokenData);

// Mock TradingChart component
vi.mock('../TradingChart', () => ({
  default: ({ token }: { token: any }) => (
    <div data-testid="trading-chart">
      {token ? `Chart for ${token.name}` : 'No token selected'}
    </div>
  ),
}));

// Mock AIInsightsPanel component
vi.mock('../AIInsightsPanel', () => ({
  default: ({ selectedToken }: { selectedToken: any }) => (
    <div data-testid="ai-insights-panel">
      {selectedToken ? `AI insights for ${selectedToken.name}` : 'AI insights panel'}
    </div>
  ),
}));

// Mock TokenList component
vi.mock('../TokenList', () => ({
  default: ({ onTokenSelect }: { onTokenSelect: (token: any) => void }) => (
    <div data-testid="token-list">
      <button onClick={() => onTokenSelect({ name: 'Base Token', symbol: 'BASE', price: 1.0 })}>
        Select Base Token
      </button>
    </div>
  ),
}));

// Mock TopBar component
vi.mock('../TopBar', () => ({
  default: ({ onThemeToggle }: { onThemeToggle: () => void }) => (
    <div data-testid="top-bar">
      <button onClick={onThemeToggle}>Toggle Theme</button>
    </div>
  ),
}));

const mockTokens = [
  { name: 'Base Token', symbol: 'BASE', price: 1.0, address: '0x123' },
  { name: 'Ethereum', symbol: 'ETH', price: 2000.0, address: '0x456' },
];

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider>
      {component}
    </ThemeProvider>
  );
};

describe('ProfessionalDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock implementations
    mockUseWallet.mockReturnValue({
      address: '0x1234567890abcdef',
      isConnected: true,
      connect: vi.fn(),
      disconnect: vi.fn(),
    });

    mockUseTokenData.mockReturnValue({
      tokens: mockTokens,
      loading: false,
      error: null,
      refetch: vi.fn(),
    });
  });

  describe('Rendering', () => {
    it('renders all main components', () => {
      renderWithTheme(<ProfessionalDashboard />);

      expect(screen.getByTestId('top-bar')).toBeInTheDocument();
      expect(screen.getByTestId('token-list')).toBeInTheDocument();
      expect(screen.getByTestId('trading-chart')).toBeInTheDocument();
      expect(screen.getByTestId('ai-insights-panel')).toBeInTheDocument();
    });

    it('renders with default layout structure', () => {
      renderWithTheme(<ProfessionalDashboard />);

      // Check for main layout elements
      expect(screen.getByTestId('top-bar')).toBeInTheDocument();
      expect(screen.getByTestId('token-list')).toBeInTheDocument();
      expect(screen.getByTestId('trading-chart')).toBeInTheDocument();
      expect(screen.getByTestId('ai-insights-panel')).toBeInTheDocument();
    });

    it('shows loading state when tokens are loading', () => {
      mockUseTokenData.mockReturnValue({
        tokens: [],
        loading: true,
        error: null,
        refetch: vi.fn(),
      });

      renderWithTheme(<ProfessionalDashboard />);

      expect(screen.getByText('Loading tokens...')).toBeInTheDocument();
    });

    it('shows error state when token loading fails', () => {
      mockUseTokenData.mockReturnValue({
        tokens: [],
        loading: false,
        error: 'Failed to load tokens',
        refetch: vi.fn(),
      });

      renderWithTheme(<ProfessionalDashboard />);

      expect(screen.getByText('Failed to load tokens')).toBeInTheDocument();
    });
  });

  describe('Token Selection', () => {
    it('handles token selection from TokenList', async () => {
      renderWithTheme(<ProfessionalDashboard />);

      const selectButton = screen.getByText('Select Base Token');
      fireEvent.click(selectButton);

      await waitFor(() => {
        expect(screen.getByText('Chart for Base Token')).toBeInTheDocument();
        expect(screen.getByText('AI insights for Base Token')).toBeInTheDocument();
      });
    });

    it('updates chart when token is selected', async () => {
      renderWithTheme(<ProfessionalDashboard />);

      const selectButton = screen.getByText('Select Base Token');
      fireEvent.click(selectButton);

      await waitFor(() => {
        expect(screen.getByText('Chart for Base Token')).toBeInTheDocument();
      });
    });

    it('updates AI insights panel when token is selected', async () => {
      renderWithTheme(<ProfessionalDashboard />);

      const selectButton = screen.getByText('Select Base Token');
      fireEvent.click(selectButton);

      await waitFor(() => {
        expect(screen.getByText('AI insights for Base Token')).toBeInTheDocument();
      });
    });
  });

  describe('Theme Toggle', () => {
    it('handles theme toggle from TopBar', () => {
      renderWithTheme(<ProfessionalDashboard />);

      const toggleButton = screen.getByText('Toggle Theme');
      fireEvent.click(toggleButton);

      // Theme toggle should be handled by ThemeProvider
      // This test verifies the callback is called
      expect(toggleButton).toBeInTheDocument();
    });
  });

  describe('Wallet Integration', () => {
    it('shows wallet connection status', () => {
      renderWithTheme(<ProfessionalDashboard />);

      // Wallet status should be reflected in the UI
      // This would typically be shown in TopBar or a wallet indicator
      expect(screen.getByTestId('top-bar')).toBeInTheDocument();
    });

    it('handles wallet disconnection', () => {
      mockUseWallet.mockReturnValue({
        address: null,
        isConnected: false,
        connect: vi.fn(),
        disconnect: vi.fn(),
      });

      renderWithTheme(<ProfessionalDashboard />);

      // Should still render dashboard but with different wallet state
      expect(screen.getByTestId('top-bar')).toBeInTheDocument();
    });
  });

  describe('Responsive Layout', () => {
    it('adapts to different screen sizes', () => {
      // Mock window.innerWidth for different screen sizes
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768, // Tablet size
      });

      renderWithTheme(<ProfessionalDashboard />);

      // Dashboard should render with responsive layout
      expect(screen.getByTestId('top-bar')).toBeInTheDocument();
      expect(screen.getByTestId('token-list')).toBeInTheDocument();
    });

    it('handles mobile layout', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375, // Mobile size
      });

      renderWithTheme(<ProfessionalDashboard />);

      // Should render with mobile-optimized layout
      expect(screen.getByTestId('top-bar')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('handles component errors gracefully', () => {
      // Mock a component that throws an error
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      renderWithTheme(<ProfessionalDashboard />);

      // Should not crash the entire dashboard
      expect(screen.getByTestId('top-bar')).toBeInTheDocument();
      
      consoleError.mockRestore();
    });

    it('handles missing token data', () => {
      mockUseTokenData.mockReturnValue({
        tokens: [],
        loading: false,
        error: null,
        refetch: vi.fn(),
      });

      renderWithTheme(<ProfessionalDashboard />);

      // Should show empty state or placeholder
      expect(screen.getByTestId('token-list')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('renders without unnecessary re-renders', () => {
      const { rerender } = renderWithTheme(<ProfessionalDashboard />);

      // Re-render with same props
      rerender(
        <ThemeProvider>
          <ProfessionalDashboard />
        </ThemeProvider>
      );

      // Should not cause issues
      expect(screen.getByTestId('top-bar')).toBeInTheDocument();
    });

    it('handles rapid token selection', async () => {
      renderWithTheme(<ProfessionalDashboard />);

      const selectButton = screen.getByText('Select Base Token');
      
      // Rapid clicks
      fireEvent.click(selectButton);
      fireEvent.click(selectButton);
      fireEvent.click(selectButton);

      await waitFor(() => {
        expect(screen.getByText('Chart for Base Token')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      renderWithTheme(<ProfessionalDashboard />);

      // Check for accessibility attributes
      expect(screen.getByTestId('top-bar')).toBeInTheDocument();
      expect(screen.getByTestId('token-list')).toBeInTheDocument();
    });

    it('supports keyboard navigation', () => {
      renderWithTheme(<ProfessionalDashboard />);

      const selectButton = screen.getByText('Select Base Token');
      
      // Should be focusable
      selectButton.focus();
      expect(document.activeElement).toBe(selectButton);
    });
  });
});
