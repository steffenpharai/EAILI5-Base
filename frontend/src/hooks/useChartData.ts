import { useState, useEffect } from 'react';

interface OHLCData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface ChartData {
  ohlc: OHLCData[];
  loading: boolean;
  error: string | null;
}

export const useChartData = (tokenAddress: string | null, days: number = 1) => {
  const [chartData, setChartData] = useState<ChartData>({
    ohlc: [],
    loading: false,
    error: null,
  });

  const fetchOHLCData = async (address: string, daysParam: number) => {
    setChartData(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/tokens/${address}/ohlc?days=${daysParam}`
      );
      const data = await response.json();
      
      if (data.status === 'success' && data.ohlc) {
        setChartData({
          ohlc: data.ohlc,
          loading: false,
          error: null,
        });
      } else {
        setChartData({
          ohlc: [],
          loading: false,
          error: data.error || 'Failed to fetch chart data',
        });
      }
    } catch (error) {
      console.error('Error fetching OHLC data:', error);
      setChartData({
        ohlc: [],
        loading: false,
        error: 'Network error fetching chart data',
      });
    }
  };

  useEffect(() => {
    if (tokenAddress) {
      fetchOHLCData(tokenAddress, days);
    } else {
      setChartData({
        ohlc: [],
        loading: false,
        error: null,
      });
    }
  }, [tokenAddress, days]);

  const refetch = () => {
    if (tokenAddress) {
      fetchOHLCData(tokenAddress, days);
    }
  };

  return {
    ...chartData,
    refetch,
  };
};

export const useTokenDetails = (tokenAddress: string | null) => {
  const [tokenDetails, setTokenDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTokenDetails = async (address: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/tokens/${address}`
      );
      const data = await response.json();
      
      if (data.status === 'success' && data.token) {
        setTokenDetails(data.token);
      } else {
        setError(data.error || 'Failed to fetch token details');
      }
    } catch (error) {
      console.error('Error fetching token details:', error);
      setError('Network error fetching token details');
    } finally {
      setLoading(false);
    }
  };

  const fetchEnhancedTokenDetails = async (address: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/tokens/${address}/enhanced`
      );
      const data = await response.json();
      
      if (data.status === 'success' && data.details) {
        setTokenDetails(data.details);
      } else {
        setError(data.error || 'Failed to fetch enhanced token details');
      }
    } catch (error) {
      console.error('Error fetching enhanced token details:', error);
      setError('Network error fetching enhanced token details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tokenAddress) {
      fetchTokenDetails(tokenAddress);
    } else {
      setTokenDetails(null);
      setError(null);
    }
  }, [tokenAddress]);

  return {
    tokenDetails,
    loading,
    error,
    fetchTokenDetails,
    fetchEnhancedTokenDetails,
  };
};

export const useTokenList = (category: string = 'top15', limit: number = 15) => {
  const [tokens, setTokens] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTokens = async (categoryParam: string, limitParam: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/tokens?category=${categoryParam}&limit=${limitParam}`
      );
      const data = await response.json();
      
      if (data.status === 'success' && data.tokens) {
        setTokens(data.tokens);
      } else {
        setError(data.error || 'Failed to fetch tokens');
      }
    } catch (error) {
      console.error('Error fetching tokens:', error);
      setError('Network error fetching tokens');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTokens(category, limit);
  }, [category, limit]);

  const refetch = () => {
    fetchTokens(category, limit);
  };

  return {
    tokens,
    loading,
    error,
    refetch,
  };
};
