import { renderHook, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { useTokenData } from '../useTokenData';

// Mock the API service
vi.mock('../../services/api', () => ({
  api: {
    get: vi.fn(),
  },
}));

const mockApi = vi.mocked(require('../../services/api').api);

describe('useTokenData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('returns initial loading state', () => {
      mockApi.get.mockResolvedValue({ data: [] });

      const { result } = renderHook(() => useTokenData());

      expect(result.current.tokens).toEqual([]);
      expect(result.current.loading).toBe(true);
      expect(result.current.error).toBe(null);
    });
  });

  describe('Successful Data Fetching', () => {
    it('fetches and returns token data', async () => {
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
      ];

      mockApi.get.mockResolvedValue({ data: mockTokens });

      const { result } = renderHook(() => useTokenData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.tokens).toEqual(mockTokens);
      expect(result.current.error).toBe(null);
    });

    it('calls API with correct endpoint', async () => {
      mockApi.get.mockResolvedValue({ data: [] });

      renderHook(() => useTokenData());

      await waitFor(() => {
        expect(mockApi.get).toHaveBeenCalledWith('/api/tokens');
      });
    });

    it('handles empty token list', async () => {
      mockApi.get.mockResolvedValue({ data: [] });

      const { result } = renderHook(() => useTokenData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.tokens).toEqual([]);
      expect(result.current.error).toBe(null);
    });
  });

  describe('Error Handling', () => {
    it('handles API errors', async () => {
      const errorMessage = 'Failed to fetch tokens';
      mockApi.get.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useTokenData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.tokens).toEqual([]);
      expect(result.current.error).toBe(errorMessage);
    });

    it('handles network errors', async () => {
      mockApi.get.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useTokenData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Network error');
    });

    it('handles timeout errors', async () => {
      mockApi.get.mockRejectedValue(new Error('Request timeout'));

      const { result } = renderHook(() => useTokenData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Request timeout');
    });

    it('handles malformed response data', async () => {
      mockApi.get.mockResolvedValue({ data: 'invalid data' });

      const { result } = renderHook(() => useTokenData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.tokens).toEqual([]);
      expect(result.current.error).toContain('Invalid response format');
    });
  });

  describe('Refetch Functionality', () => {
    it('refetches data when refetch is called', async () => {
      const mockTokens = [
        { name: 'Token 1', symbol: 'TK1', price: 1.0, address: '0x123' },
      ];

      mockApi.get.mockResolvedValue({ data: mockTokens });

      const { result } = renderHook(() => useTokenData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Clear previous calls
      mockApi.get.mockClear();

      // Refetch
      await result.current.refetch();

      expect(mockApi.get).toHaveBeenCalledWith('/api/tokens');
    });

    it('handles refetch errors', async () => {
      mockApi.get
        .mockResolvedValueOnce({ data: [] })
        .mockRejectedValueOnce(new Error('Refetch failed'));

      const { result } = renderHook(() => useTokenData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await result.current.refetch();

      await waitFor(() => {
        expect(result.current.error).toBe('Refetch failed');
      });
    });

    it('shows loading state during refetch', async () => {
      mockApi.get.mockResolvedValue({ data: [] });

      const { result } = renderHook(() => useTokenData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Mock delayed response for refetch
      mockApi.get.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ data: [] }), 100))
      );

      const refetchPromise = result.current.refetch();

      // Should show loading during refetch
      expect(result.current.loading).toBe(true);

      await refetchPromise;

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });
  });

  describe('Real-time Updates', () => {
    it('updates token prices in real-time', async () => {
      const initialTokens = [
        { name: 'Base Token', symbol: 'BASE', price: 1.0, address: '0x123' },
      ];

      const updatedTokens = [
        { name: 'Base Token', symbol: 'BASE', price: 1.05, address: '0x123' },
      ];

      mockApi.get
        .mockResolvedValueOnce({ data: initialTokens })
        .mockResolvedValueOnce({ data: updatedTokens });

      const { result } = renderHook(() => useTokenData());

      await waitFor(() => {
        expect(result.current.tokens[0].price).toBe(1.0);
      });

      // Simulate real-time update
      await result.current.refetch();

      await waitFor(() => {
        expect(result.current.tokens[0].price).toBe(1.05);
      });
    });

    it('handles partial updates gracefully', async () => {
      const fullTokens = [
        { name: 'Token 1', symbol: 'TK1', price: 1.0, address: '0x123' },
        { name: 'Token 2', symbol: 'TK2', price: 2.0, address: '0x456' },
      ];

      const partialTokens = [
        { name: 'Token 1', symbol: 'TK1', price: 1.1, address: '0x123' },
        // Token 2 missing
      ];

      mockApi.get
        .mockResolvedValueOnce({ data: fullTokens })
        .mockResolvedValueOnce({ data: partialTokens });

      const { result } = renderHook(() => useTokenData());

      await waitFor(() => {
        expect(result.current.tokens).toHaveLength(2);
      });

      await result.current.refetch();

      await waitFor(() => {
        expect(result.current.tokens).toHaveLength(1);
        expect(result.current.tokens[0].price).toBe(1.1);
      });
    });
  });

  describe('Caching', () => {
    it('caches token data between calls', async () => {
      const mockTokens = [
        { name: 'Cached Token', symbol: 'CACHE', price: 1.0, address: '0x123' },
      ];

      mockApi.get.mockResolvedValue({ data: mockTokens });

      const { result } = renderHook(() => useTokenData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Multiple calls should not trigger multiple API requests
      const { result: result2 } = renderHook(() => useTokenData());

      await waitFor(() => {
        expect(result2.current.tokens).toEqual(mockTokens);
      });

      // API should only be called once due to caching
      expect(mockApi.get).toHaveBeenCalledTimes(1);
    });

    it('invalidates cache on refetch', async () => {
      const mockTokens = [
        { name: 'Token', symbol: 'TK', price: 1.0, address: '0x123' },
      ];

      mockApi.get.mockResolvedValue({ data: mockTokens });

      const { result } = renderHook(() => useTokenData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Refetch should bypass cache
      await result.current.refetch();

      expect(mockApi.get).toHaveBeenCalledTimes(2);
    });
  });

  describe('Performance', () => {
    it('handles large token datasets efficiently', async () => {
      const largeTokenList = Array.from({ length: 1000 }, (_, i) => ({
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

      mockApi.get.mockResolvedValue({ data: largeTokenList });

      const { result } = renderHook(() => useTokenData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.tokens).toHaveLength(1000);
    });

    it('does not cause unnecessary re-renders', async () => {
      const mockTokens = [
        { name: 'Token', symbol: 'TK', price: 1.0, address: '0x123' },
      ];

      mockApi.get.mockResolvedValue({ data: mockTokens });

      const { result, rerender } = renderHook(() => useTokenData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const initialTokens = result.current.tokens;

      // Re-render with same dependencies
      rerender();

      // Should not cause new API calls or state changes
      expect(result.current.tokens).toBe(initialTokens);
    });
  });

  describe('Edge Cases', () => {
    it('handles null/undefined responses', async () => {
      mockApi.get.mockResolvedValue({ data: null });

      const { result } = renderHook(() => useTokenData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.tokens).toEqual([]);
    });

    it('handles malformed token data', async () => {
      const malformedTokens = [
        { name: 'Valid Token', symbol: 'VT', price: 1.0, address: '0x123' },
        { name: null, symbol: undefined, price: 'invalid' }, // Malformed
        { name: 'Another Valid', symbol: 'AV', price: 2.0, address: '0x456' },
      ];

      mockApi.get.mockResolvedValue({ data: malformedTokens });

      const { result } = renderHook(() => useTokenData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should filter out malformed tokens
      expect(result.current.tokens).toHaveLength(2);
      expect(result.current.tokens[0].name).toBe('Valid Token');
      expect(result.current.tokens[1].name).toBe('Another Valid');
    });

    it('handles concurrent requests', async () => {
      mockApi.get.mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({ data: [] }), 100)
        )
      );

      const { result } = renderHook(() => useTokenData());

      // Multiple concurrent refetches
      const refetch1 = result.current.refetch();
      const refetch2 = result.current.refetch();
      const refetch3 = result.current.refetch();

      await Promise.all([refetch1, refetch2, refetch3]);

      // Should handle concurrent requests gracefully
      expect(result.current.tokens).toEqual([]);
    });
  });
});
