import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import TradingChart from '../TradingChart';
import { ThemeProvider } from '../../contexts/ThemeContext';

// Mock lightweight-charts
vi.mock('lightweight-charts', () => ({
  createChart: vi.fn(() => ({
    addCandlestickSeries: vi.fn(() => ({
      setData: vi.fn(),
    })),
    timeScale: vi.fn(() => ({
      fitContent: vi.fn(),
    })),
    applyOptions: vi.fn(),
    remove: vi.fn(),
  })),
  ColorType: {
    Solid: 'solid',
  },
}));

// Mock the chart library
const mockCreateChart = vi.mocked(require('lightweight-charts').createChart);

const mockToken = {
  name: 'Base Token',
  symbol: 'BASE',
  price: 1.0,
  address: '0x123',
  market_cap: 1000000,
  volume_24h: 100000,
  liquidity: 500000,
  holders: 1000,
};

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider>
      {component}
    </ThemeProvider>
  );
};

describe('TradingChart', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders chart container', () => {
      renderWithTheme(<TradingChart token={mockToken} />);

      expect(screen.getByRole('button', { name: '1M' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '5M' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '15M' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '1H' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '4H' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '1D' })).toBeInTheDocument();
    });

    it('renders with no token selected', () => {
      renderWithTheme(<TradingChart token={null} />);

      // Should still render timeframe buttons
      expect(screen.getByRole('button', { name: '1H' })).toBeInTheDocument();
    });

    it('initializes chart with correct timeframe', () => {
      renderWithTheme(<TradingChart token={mockToken} />);

      // Default timeframe should be 1H
      const defaultButton = screen.getByRole('button', { name: '1H' });
      expect(defaultButton).toHaveClass('bg-blue-600'); // Primary variant
    });
  });

  describe('Chart Initialization', () => {
    it('creates chart with correct configuration', () => {
      renderWithTheme(<TradingChart token={mockToken} />);

      expect(mockCreateChart).toHaveBeenCalledWith(
        expect.any(HTMLElement),
        expect.objectContaining({
          layout: expect.objectContaining({
            background: expect.objectContaining({
              type: 'solid',
            }),
          }),
          grid: expect.objectContaining({
            vertLines: expect.objectContaining({}),
            horzLines: expect.objectContaining({}),
          }),
        })
      );
    });

    it('creates candlestick series', () => {
      const mockChart = {
        addCandlestickSeries: vi.fn(() => ({
          setData: vi.fn(),
        })),
        timeScale: vi.fn(() => ({
          fitContent: vi.fn(),
        })),
        applyOptions: vi.fn(),
        remove: vi.fn(),
      };
      
      mockCreateChart.mockReturnValue(mockChart);

      renderWithTheme(<TradingChart token={mockToken} />);

      expect(mockChart.addCandlestickSeries).toHaveBeenCalledWith(
        expect.objectContaining({
          upColor: expect.any(String),
          downColor: expect.any(String),
          borderVisible: false,
        })
      );
    });

    it('sets chart data when token is provided', () => {
      const mockCandlestickSeries = {
        setData: vi.fn(),
      };
      
      const mockChart = {
        addCandlestickSeries: vi.fn(() => mockCandlestickSeries),
        timeScale: vi.fn(() => ({
          fitContent: vi.fn(),
        })),
        applyOptions: vi.fn(),
        remove: vi.fn(),
      };
      
      mockCreateChart.mockReturnValue(mockChart);

      renderWithTheme(<TradingChart token={mockToken} />);

      expect(mockCandlestickSeries.setData).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            time: expect.any(Number),
            open: expect.any(Number),
            high: expect.any(Number),
            low: expect.any(Number),
            close: expect.any(Number),
          }),
        ])
      );
    });
  });

  describe('Timeframe Switching', () => {
    it('switches to 1M timeframe', async () => {
      renderWithTheme(<TradingChart token={mockToken} />);

      const oneMinuteButton = screen.getByRole('button', { name: '1M' });
      fireEvent.click(oneMinuteButton);

      await waitFor(() => {
        expect(oneMinuteButton).toHaveClass('bg-blue-600');
      });
    });

    it('switches to 5M timeframe', async () => {
      renderWithTheme(<TradingChart token={mockToken} />);

      const fiveMinuteButton = screen.getByRole('button', { name: '5M' });
      fireEvent.click(fiveMinuteButton);

      await waitFor(() => {
        expect(fiveMinuteButton).toHaveClass('bg-blue-600');
      });
    });

    it('switches to 15M timeframe', async () => {
      renderWithTheme(<TradingChart token={mockToken} />);

      const fifteenMinuteButton = screen.getByRole('button', { name: '15M' });
      fireEvent.click(fifteenMinuteButton);

      await waitFor(() => {
        expect(fifteenMinuteButton).toHaveClass('bg-blue-600');
      });
    });

    it('switches to 4H timeframe', async () => {
      renderWithTheme(<TradingChart token={mockToken} />);

      const fourHourButton = screen.getByRole('button', { name: '4H' });
      fireEvent.click(fourHourButton);

      await waitFor(() => {
        expect(fourHourButton).toHaveClass('bg-blue-600');
      });
    });

    it('switches to 1D timeframe', async () => {
      renderWithTheme(<TradingChart token={mockToken} />);

      const oneDayButton = screen.getByRole('button', { name: '1D' });
      fireEvent.click(oneDayButton);

      await waitFor(() => {
        expect(oneDayButton).toHaveClass('bg-blue-600');
      });
    });

    it('updates chart data when timeframe changes', async () => {
      const mockCandlestickSeries = {
        setData: vi.fn(),
      };
      
      const mockChart = {
        addCandlestickSeries: vi.fn(() => mockCandlestickSeries),
        timeScale: vi.fn(() => ({
          fitContent: vi.fn(),
        })),
        applyOptions: vi.fn(),
        remove: vi.fn(),
      };
      
      mockCreateChart.mockReturnValue(mockChart);

      renderWithTheme(<TradingChart token={mockToken} />);

      const oneDayButton = screen.getByRole('button', { name: '1D' });
      fireEvent.click(oneDayButton);

      await waitFor(() => {
        // Should call setData with new timeframe data
        expect(mockCandlestickSeries.setData).toHaveBeenCalledTimes(2); // Initial + timeframe change
      });
    });
  });

  describe('Data Loading States', () => {
    it('shows loading state while chart initializes', () => {
      renderWithTheme(<TradingChart token={mockToken} />);

      // Chart should render immediately
      expect(screen.getByRole('button', { name: '1H' })).toBeInTheDocument();
    });

    it('handles missing token data gracefully', () => {
      renderWithTheme(<TradingChart token={null} />);

      // Should still render timeframe buttons
      expect(screen.getByRole('button', { name: '1H' })).toBeInTheDocument();
    });

    it('regenerates data when token changes', () => {
      const mockCandlestickSeries = {
        setData: vi.fn(),
      };
      
      const mockChart = {
        addCandlestickSeries: vi.fn(() => mockCandlestickSeries),
        timeScale: vi.fn(() => ({
          fitContent: vi.fn(),
        })),
        applyOptions: vi.fn(),
        remove: vi.fn(),
      };
      
      mockCreateChart.mockReturnValue(mockChart);

      const { rerender } = renderWithTheme(<TradingChart token={null} />);
      
      // Change token
      rerender(
        <ThemeProvider>
          <TradingChart token={mockToken} />
        </ThemeProvider>
      );

      expect(mockCandlestickSeries.setData).toHaveBeenCalled();
    });
  });

  describe('Chart Responsiveness', () => {
    it('handles window resize events', () => {
      const mockChart = {
        addCandlestickSeries: vi.fn(() => ({
          setData: vi.fn(),
        })),
        timeScale: vi.fn(() => ({
          fitContent: vi.fn(),
        })),
        applyOptions: vi.fn(),
        remove: vi.fn(),
      };
      
      mockCreateChart.mockReturnValue(mockChart);

      renderWithTheme(<TradingChart token={mockToken} />);

      // Simulate window resize
      window.dispatchEvent(new Event('resize'));

      expect(mockChart.applyOptions).toHaveBeenCalled();
    });

    it('cleans up chart on unmount', () => {
      const mockChart = {
        addCandlestickSeries: vi.fn(() => ({
          setData: vi.fn(),
        })),
        timeScale: vi.fn(() => ({
          fitContent: vi.fn(),
        })),
        applyOptions: vi.fn(),
        remove: vi.fn(),
      };
      
      mockCreateChart.mockReturnValue(mockChart);

      const { unmount } = renderWithTheme(<TradingChart token={mockToken} />);
      
      unmount();

      expect(mockChart.remove).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('handles chart creation errors', () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      mockCreateChart.mockImplementation(() => {
        throw new Error('Chart creation failed');
      });

      renderWithTheme(<TradingChart token={mockToken} />);

      // Should not crash the component
      expect(screen.getByRole('button', { name: '1H' })).toBeInTheDocument();
      
      consoleError.mockRestore();
    });

    it('handles data generation errors', () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Mock Math.random to throw error
      const originalRandom = Math.random;
      Math.random = vi.fn(() => {
        throw new Error('Random generation failed');
      });

      renderWithTheme(<TradingChart token={mockToken} />);

      // Should handle error gracefully
      expect(screen.getByRole('button', { name: '1H' })).toBeInTheDocument();
      
      // Restore
      Math.random = originalRandom;
      consoleError.mockRestore();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels for timeframe buttons', () => {
      renderWithTheme(<TradingChart token={mockToken} />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveAttribute('aria-label');
      });
    });

    it('supports keyboard navigation for timeframe selection', () => {
      renderWithTheme(<TradingChart token={mockToken} />);

      const oneDayButton = screen.getByRole('button', { name: '1D' });
      
      // Should be focusable
      oneDayButton.focus();
      expect(document.activeElement).toBe(oneDayButton);
      
      // Should be activatable with Enter key
      fireEvent.keyDown(oneDayButton, { key: 'Enter', code: 'Enter' });
      expect(oneDayButton).toHaveClass('bg-blue-600');
    });
  });

  describe('Performance', () => {
    it('does not recreate chart on unnecessary re-renders', () => {
      const { rerender } = renderWithTheme(<TradingChart token={mockToken} />);
      
      const initialCallCount = mockCreateChart.mock.calls.length;
      
      // Re-render with same props
      rerender(
        <ThemeProvider>
          <TradingChart token={mockToken} />
        </ThemeProvider>
      );

      // Should not recreate chart
      expect(mockCreateChart.mock.calls.length).toBe(initialCallCount);
    });

    it('handles rapid timeframe changes efficiently', async () => {
      renderWithTheme(<TradingChart token={mockToken} />);

      const buttons = [
        screen.getByRole('button', { name: '1M' }),
        screen.getByRole('button', { name: '5M' }),
        screen.getByRole('button', { name: '15M' }),
        screen.getByRole('button', { name: '1H' }),
      ];

      // Rapid clicks
      buttons.forEach(button => {
        fireEvent.click(button);
      });

      await waitFor(() => {
        // Should handle all clicks without issues
        expect(screen.getByRole('button', { name: '1H' })).toHaveClass('bg-blue-600');
      });
    });
  });
});
