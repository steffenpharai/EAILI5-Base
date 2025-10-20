import { useState } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export const usePortfolio = () => {
  const [isLoading, setIsLoading] = useState(false);

  const getPortfolio = async (user_id: string) => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/portfolio/${user_id}`);
      return response.data.portfolio || {};
    } catch (error) {
      console.error('Error fetching portfolio:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const simulateTrade = async (tradeData: {
    user_id: string;
    token_address: string;
    trade_type: 'buy' | 'sell';
    amount: number;
  }) => {
    setIsLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/portfolio/simulate`, tradeData);
      return response.data;
    } catch (error) {
      console.error('Error simulating trade:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const getPortfolioPerformance = async (user_id: string) => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/portfolio/${user_id}/performance`);
      return response.data;
    } catch (error) {
      console.error('Error fetching portfolio performance:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const getTradeHistory = async (user_id: string, limit: number = 50) => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/portfolio/${user_id}/trades`, {
        params: { limit }
      });
      return response.data.trades || [];
    } catch (error) {
      console.error('Error fetching trade history:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    getPortfolio,
    simulateTrade,
    getPortfolioPerformance,
    getTradeHistory,
    isLoading
  };
};
