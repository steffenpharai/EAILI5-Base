import { useEffect, useRef, useState } from 'react';
import { useAccount } from 'wagmi';

/**
 * Hook to manage real-time portfolio WebSocket updates
 * Connects to /ws/portfolio/{user_id} for live portfolio data
 */
export const usePortfolioWebSocket = (userId: string) => {
  const [isConnected, setIsConnected] = useState(false);
  const [portfolioData, setPortfolioData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = () => {
    if (!userId || wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const wsUrl = `${process.env.REACT_APP_WS_URL || 'ws://localhost:8000'}/ws/portfolio/${userId}`;
      console.log('Connecting to portfolio WebSocket:', wsUrl);
      
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('Portfolio WebSocket connected');
        setIsConnected(true);
        setError(null);
        reconnectAttempts.current = 0;
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('Portfolio WebSocket message:', data);
          
          if (data.type === 'portfolio_update') {
            setPortfolioData(data.portfolio);
          } else if (data.type === 'trade_update') {
            // Handle individual trade updates
            console.log('Trade update received:', data.trade);
          }
        } catch (err) {
          console.error('Error parsing portfolio WebSocket message:', err);
        }
      };

      wsRef.current.onclose = (event) => {
        console.log('Portfolio WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);
        
        // Attempt to reconnect if not a normal closure
        if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current + 1})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current++;
            connect();
          }, delay);
        } else if (reconnectAttempts.current >= maxReconnectAttempts) {
          setError('Failed to reconnect to portfolio updates');
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('Portfolio WebSocket error:', error);
        setError('WebSocket connection error');
      };

    } catch (err) {
      console.error('Error creating portfolio WebSocket:', err);
      setError('Failed to connect to portfolio updates');
    }
  };

  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close(1000, 'Component unmounting');
      wsRef.current = null;
    }
    
    setIsConnected(false);
    reconnectAttempts.current = 0;
  };

  const sendMessage = (message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('Portfolio WebSocket not connected, cannot send message');
    }
  };

  useEffect(() => {
    if (userId) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [userId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  return {
    isConnected,
    portfolioData,
    error,
    sendMessage,
    connect,
    disconnect
  };
};
