import { useState, useEffect, useCallback } from 'react';

export interface Token {
  address: string;
  name: string;
  symbol: string;
  price: number;
  priceFormatted?: string;
  priceChange24h: number;
  volume24h: number;
  volumeFormatted?: string;
  marketCap: number;
  marketCapFormatted?: string;
  liquidity: number;
  liquidityFormatted?: string;
  holders: number;
  holdersFormatted?: string;
  safetyScore: number;
}

export const useTokenData = (category: string = 'top15') => {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTokens = useCallback(async (cat?: string) => {
    try {
      setLoading(true);
      const categoryParam = cat || category;
      const response = await fetch(`http://localhost:8000/api/tokens?category=${categoryParam}&limit=15`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch tokens');
      }

      const data = await response.json();
      
      // Transform backend data to match our interface
      const transformedTokens: Token[] = (data.tokens || []).map((token: any) => ({
        address: token.address || '',
        name: token.name || 'Unknown',
        symbol: token.symbol || 'N/A',
        price: token.price || 0,
        priceFormatted: token.priceFormatted,
        priceChange24h: token.priceChange24h || 0,
        volume24h: token.volume24h || 0,
        volumeFormatted: token.volumeFormatted,
        marketCap: token.marketCap || 0,
        marketCapFormatted: token.marketCapFormatted,
        liquidity: token.liquidity || 0,
        liquidityFormatted: token.liquidityFormatted,
        holders: token.holders || 0,
        holdersFormatted: token.holdersFormatted,
        safetyScore: token.safetyScore || 0,
      }));

      setTokens(transformedTokens);
      setError(null);
    } catch (err) {
      console.error('Error fetching tokens:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch tokens');
      setTokens([]);
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    fetchTokens(category);
  }, [category, fetchTokens]);

  return { tokens, loading, error, refetch: fetchTokens };
};
