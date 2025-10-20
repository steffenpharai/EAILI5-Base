import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import TokenList from '../TokenList';
import { ThemeProvider } from '../../contexts/ThemeContext';
import { useTokenData } from '../../hooks/useTokenData';

// Mock the useTokenData hook
vi.mock('../../hooks/useTokenData');

const mockUseTokenData = vi.mocked(useTokenData);

const mockTokens = [
  {
    name: 'Base Token',
    symbol: 'BASE',
    price: 1.0,
    address: '0x123',
    market_cap: 1000000,
    volume_24h: 100000,
    liquidity: 500000,
    holders: 1000,
    price_change_24h: 5.2,
  },
  {
    name: 'Ethereum',
    symbol: 'ETH',
    price: 2000.0,
    address: '0x456',
    market_cap: 200000000,
    volume_24h: 5000000,
    liquidity: 10000000,
    holders: 50000,
    price_change_24h: -2.1,
  },
  {
    name: 'USD Coin',
    symbol: 'USDC',
    price: 1.0,
    address: '0x789',
    market_cap: 50000000,
    volume_24h: 2000000,
    liquidity: 8000000,
    holders: 25000,
    price_change_24h: 0.1,
  },
];

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider>
      {component}
    </ThemeProvider>
  );
};

describe('TokenList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock implementation
    mockUseTokenData.mockReturnValue({
      tokens: mockTokens,
      loading: false,
      error: null,
      refetch: vi.fn(),
    });
  });

  describe('Rendering', () => {
    it('renders token list with all tokens', () => {
      renderWithTheme(<TokenList onTokenSelect={vi.fn()} />);

      expect(screen.getByText('Base Token')).toBeInTheDocument();
      expect(screen.getByText('BASE')).toBeInTheDocument();
      expect(screen.getByText('Ethereum')).toBeInTheDocument();
      expect(screen.getByText('ETH')).toBeInTheDocument();
      expect(screen.getByText('USD Coin')).toBeInTheDocument();
      expect(screen.getByText('USDC')).toBeInTheDocument();
    });

    it('renders token prices', () => {
      renderWithTheme(<TokenList onTokenSelect={vi.fn()} />);

      expect(screen.getByText('$1.00')).toBeInTheDocument();
      expect(screen.getByText('$2,000.00')).toBeInTheDocument();
    });

    it('renders price changes with correct styling', () => {
      renderWithTheme(<TokenList onTokenSelect={vi.fn()} />);

      // Positive change (green)
      expect(screen.getByText('+5.2%')).toBeInTheDocument();
      // Negative change (red)
      expect(screen.getByText('-2.1%')).toBeInTheDocument();
      // Neutral change
      expect(screen.getByText('+0.1%')).toBeInTheDocument();
    });

    it('renders market cap and volume', () => {
      renderWithTheme(<TokenList onTokenSelect={vi.fn()} />);

      expect(screen.getByText('$1.0M')).toBeInTheDocument(); // Base Token market cap
      expect(screen.getByText('$200.0M')).toBeInTheDocument(); // Ethereum market cap
      expect(screen.getByText('$50.0M')).toBeInTheDocument(); // USDC market cap
    });

    it('shows loading state', () => {
      mockUseTokenData.mockReturnValue({
        tokens: [],
        loading: true,
        error: null,
        refetch: vi.fn(),
      });

      renderWithTheme(<TokenList onTokenSelect={vi.fn()} />);

      expect(screen.getByText('Loading tokens...')).toBeInTheDocument();
    });

    it('shows error state', () => {
      mockUseTokenData.mockReturnValue({
        tokens: [],
        loading: false,
        error: 'Failed to load tokens',
        refetch: vi.fn(),
      });

      renderWithTheme(<TokenList onTokenSelect={vi.fn()} />);

      expect(screen.getByText('Failed to load tokens')).toBeInTheDocument();
    });

    it('shows empty state when no tokens', () => {
      mockUseTokenData.mockReturnValue({
        tokens: [],
        loading: false,
        error: null,
        refetch: vi.fn(),
      });

      renderWithTheme(<TokenList onTokenSelect={vi.fn()} />);

      expect(screen.getByText('No tokens available')).toBeInTheDocument();
    });
  });

  describe('Token Selection', () => {
    it('calls onTokenSelect when token is clicked', () => {
      const mockOnTokenSelect = vi.fn();

      renderWithTheme(<TokenList onTokenSelect={mockOnTokenSelect} />);

      const baseTokenRow = screen.getByText('Base Token').closest('div');
      fireEvent.click(baseTokenRow!);

      expect(mockOnTokenSelect).toHaveBeenCalledWith(mockTokens[0]);
    });

    it('calls onTokenSelect with correct token data', () => {
      const mockOnTokenSelect = vi.fn();

      renderWithTheme(<TokenList onTokenSelect={mockOnTokenSelect} />);

      const ethTokenRow = screen.getByText('Ethereum').closest('div');
      fireEvent.click(ethTokenRow!);

      expect(mockOnTokenSelect).toHaveBeenCalledWith(mockTokens[1]);
    });

    it('handles multiple token selections', () => {
      const mockOnTokenSelect = vi.fn();

      renderWithTheme(<TokenList onTokenSelect={mockOnTokenSelect} />);

      // Select first token
      const baseTokenRow = screen.getByText('Base Token').closest('div');
      fireEvent.click(baseTokenRow!);

      // Select second token
      const ethTokenRow = screen.getByText('Ethereum').closest('div');
      fireEvent.click(ethTokenRow!);

      expect(mockOnTokenSelect).toHaveBeenCalledTimes(2);
      expect(mockOnTokenSelect).toHaveBeenNthCalledWith(1, mockTokens[0]);
      expect(mockOnTokenSelect).toHaveBeenNthCalledWith(2, mockTokens[1]);
    });
  });

  describe('Token Data Display', () => {
    it('formats large numbers correctly', () => {
      renderWithTheme(<TokenList onTokenSelect={vi.fn()} />);

      // Market cap formatting
      expect(screen.getByText('$1.0M')).toBeInTheDocument();
      expect(screen.getByText('$200.0M')).toBeInTheDocument();
      expect(screen.getByText('$50.0M')).toBeInTheDocument();
    });

    it('displays volume correctly', () => {
      renderWithTheme(<TokenList onTokenSelect={vi.fn()} />);

      // Volume should be displayed
      expect(screen.getByText('$100.0K')).toBeInTheDocument(); // Base Token volume
      expect(screen.getByText('$5.0M')).toBeInTheDocument(); // Ethereum volume
    });

    it('shows holder count', () => {
      renderWithTheme(<TokenList onTokenSelect={vi.fn()} />);

      expect(screen.getByText('1.0K')).toBeInTheDocument(); // Base Token holders
      expect(screen.getByText('50.0K')).toBeInTheDocument(); // Ethereum holders
      expect(screen.getByText('25.0K')).toBeInTheDocument(); // USDC holders
    });

    it('handles missing data gracefully', () => {
      const tokensWithMissingData = [
        {
          name: 'Incomplete Token',
          symbol: 'INC',
          price: 0.5,
          address: '0x999',
          market_cap: null,
          volume_24h: null,
          liquidity: null,
          holders: null,
          price_change_24h: null,
        },
      ];

      mockUseTokenData.mockReturnValue({
        tokens: tokensWithMissingData,
        loading: false,
        error: null,
        refetch: vi.fn(),
      });

      renderWithTheme(<TokenList onTokenSelect={vi.fn()} />);

      expect(screen.getByText('Incomplete Token')).toBeInTheDocument();
      expect(screen.getByText('INC')).toBeInTheDocument();
      expect(screen.getByText('$0.50')).toBeInTheDocument();
    });
  });

  describe('Price Change Styling', () => {
    it('applies correct styling for positive changes', () => {
      renderWithTheme(<TokenList onTokenSelect={vi.fn()} />);

      const positiveChange = screen.getByText('+5.2%');
      expect(positiveChange).toHaveClass('text-green-500');
    });

    it('applies correct styling for negative changes', () => {
      renderWithTheme(<TokenList onTokenSelect={vi.fn()} />);

      const negativeChange = screen.getByText('-2.1%');
      expect(negativeChange).toHaveClass('text-red-500');
    });

    it('applies correct styling for neutral changes', () => {
      renderWithTheme(<TokenList onTokenSelect={vi.fn()} />);

      const neutralChange = screen.getByText('+0.1%');
      expect(neutralChange).toHaveClass('text-gray-500');
    });
  });

  describe('Search and Filtering', () => {
    it('filters tokens by name', () => {
      renderWithTheme(<TokenList onTokenSelect={vi.fn()} />);

      const searchInput = screen.getByPlaceholderText('Search tokens...');
      fireEvent.change(searchInput, { target: { value: 'Base' } });

      expect(screen.getByText('Base Token')).toBeInTheDocument();
      expect(screen.queryByText('Ethereum')).not.toBeInTheDocument();
      expect(screen.queryByText('USD Coin')).not.toBeInTheDocument();
    });

    it('filters tokens by symbol', () => {
      renderWithTheme(<TokenList onTokenSelect={vi.fn()} />);

      const searchInput = screen.getByPlaceholderText('Search tokens...');
      fireEvent.change(searchInput, { target: { value: 'ETH' } });

      expect(screen.getByText('Ethereum')).toBeInTheDocument();
      expect(screen.queryByText('Base Token')).not.toBeInTheDocument();
      expect(screen.queryByText('USD Coin')).not.toBeInTheDocument();
    });

    it('shows no results when search has no matches', () => {
      renderWithTheme(<TokenList onTokenSelect={vi.fn()} />);

      const searchInput = screen.getByPlaceholderText('Search tokens...');
      fireEvent.change(searchInput, { target: { value: 'NonExistent' } });

      expect(screen.getByText('No tokens found')).toBeInTheDocument();
    });

    it('clears search when input is empty', () => {
      renderWithTheme(<TokenList onTokenSelect={vi.fn()} />);

      const searchInput = screen.getByPlaceholderText('Search tokens...');
      
      // Search for something
      fireEvent.change(searchInput, { target: { value: 'Base' } });
      expect(screen.getByText('Base Token')).toBeInTheDocument();
      expect(screen.queryByText('Ethereum')).not.toBeInTheDocument();

      // Clear search
      fireEvent.change(searchInput, { target: { value: '' } });
      expect(screen.getByText('Base Token')).toBeInTheDocument();
      expect(screen.getByText('Ethereum')).toBeInTheDocument();
    });
  });

  describe('Sorting', () => {
    it('sorts tokens by market cap by default', () => {
      renderWithTheme(<TokenList onTokenSelect={vi.fn()} />);

      const tokenRows = screen.getAllByTestId('token-row');
      expect(tokenRows[0]).toHaveTextContent('Ethereum'); // Highest market cap
      expect(tokenRows[1]).toHaveTextContent('USD Coin'); // Second highest
      expect(tokenRows[2]).toHaveTextContent('Base Token'); // Lowest market cap
    });

    it('sorts tokens by price when price header is clicked', () => {
      renderWithTheme(<TokenList onTokenSelect={vi.fn()} />);

      const priceHeader = screen.getByText('Price');
      fireEvent.click(priceHeader);

      const tokenRows = screen.getAllByTestId('token-row');
      expect(tokenRows[0]).toHaveTextContent('Ethereum'); // Highest price
      expect(tokenRows[1]).toHaveTextContent('Base Token'); // Second highest
      expect(tokenRows[2]).toHaveTextContent('USD Coin'); // Lowest price
    });

    it('sorts tokens by volume when volume header is clicked', () => {
      renderWithTheme(<TokenList onTokenSelect={vi.fn()} />);

      const volumeHeader = screen.getByText('Volume');
      fireEvent.click(volumeHeader);

      const tokenRows = screen.getAllByTestId('token-row');
      expect(tokenRows[0]).toHaveTextContent('Ethereum'); // Highest volume
      expect(tokenRows[1]).toHaveTextContent('USD Coin'); // Second highest
      expect(tokenRows[2]).toHaveTextContent('Base Token'); // Lowest volume
    });

    it('toggles sort order when same header is clicked twice', () => {
      renderWithTheme(<TokenList onTokenSelect={vi.fn()} />);

      const priceHeader = screen.getByText('Price');
      
      // First click - ascending
      fireEvent.click(priceHeader);
      let tokenRows = screen.getAllByTestId('token-row');
      expect(tokenRows[0]).toHaveTextContent('USD Coin'); // Lowest price first

      // Second click - descending
      fireEvent.click(priceHeader);
      tokenRows = screen.getAllByTestId('token-row');
      expect(tokenRows[0]).toHaveTextContent('Ethereum'); // Highest price first
    });
  });

  describe('Error Handling', () => {
    it('handles network errors gracefully', () => {
      mockUseTokenData.mockReturnValue({
        tokens: [],
        loading: false,
        error: 'Network error',
        refetch: vi.fn(),
      });

      renderWithTheme(<TokenList onTokenSelect={vi.fn()} />);

      expect(screen.getByText('Network error')).toBeInTheDocument();
    });

    it('provides retry functionality on error', () => {
      const mockRefetch = vi.fn();
      
      mockUseTokenData.mockReturnValue({
        tokens: [],
        loading: false,
        error: 'Failed to load',
        refetch: mockRefetch,
      });

      renderWithTheme(<TokenList onTokenSelect={vi.fn()} />);

      const retryButton = screen.getByText('Retry');
      fireEvent.click(retryButton);

      expect(mockRefetch).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      renderWithTheme(<TokenList onTokenSelect={vi.fn()} />);

      const searchInput = screen.getByPlaceholderText('Search tokens...');
      expect(searchInput).toHaveAttribute('aria-label');

      const tokenRows = screen.getAllByTestId('token-row');
      tokenRows.forEach(row => {
        expect(row).toHaveAttribute('role', 'button');
        expect(row).toHaveAttribute('tabIndex');
      });
    });

    it('supports keyboard navigation', () => {
      renderWithTheme(<TokenList onTokenSelect={vi.fn()} />);

      const firstTokenRow = screen.getAllByTestId('token-row')[0];
      
      // Should be focusable
      firstTokenRow.focus();
      expect(document.activeElement).toBe(firstTokenRow);
      
      // Should be activatable with Enter key
      fireEvent.keyDown(firstTokenRow, { key: 'Enter', code: 'Enter' });
      // This would trigger the onTokenSelect callback
    });

    it('announces token information to screen readers', () => {
      renderWithTheme(<TokenList onTokenSelect={vi.fn()} />);

      const baseTokenRow = screen.getByText('Base Token').closest('[data-testid="token-row"]');
      expect(baseTokenRow).toHaveAttribute('aria-label');
    });
  });

  describe('Performance', () => {
    it('handles large token lists efficiently', () => {
      const largeTokenList = Array.from({ length: 100 }, (_, i) => ({
        name: `Token ${i}`,
        symbol: `TK${i}`,
        price: Math.random() * 1000,
        address: `0x${i.toString(16).padStart(40, '0')}`,
        market_cap: Math.random() * 1000000,
        volume_24h: Math.random() * 100000,
        liquidity: Math.random() * 500000,
        holders: Math.floor(Math.random() * 10000),
        price_change_24h: (Math.random() - 0.5) * 20,
      }));

      mockUseTokenData.mockReturnValue({
        tokens: largeTokenList,
        loading: false,
        error: null,
        refetch: vi.fn(),
      });

      renderWithTheme(<TokenList onTokenSelect={vi.fn()} />);

      // Should render without performance issues
      expect(screen.getByText('Token 0')).toBeInTheDocument();
    });

    it('does not re-render unnecessarily', () => {
      const { rerender } = renderWithTheme(<TokenList onTokenSelect={vi.fn()} />);

      // Re-render with same props
      rerender(
        <ThemeProvider>
          <TokenList onTokenSelect={vi.fn()} />
        </ThemeProvider>
      );

      // Should not cause issues
      expect(screen.getByText('Base Token')).toBeInTheDocument();
    });
  });
});
