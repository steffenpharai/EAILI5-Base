import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Hook to manage real-time token price WebSocket updates
 * Connects to /ws/tokens for live token price data
 */
export const useTokenWebSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [tokenUpdates, setTokenUpdates] = useState<Map<string, any>>(new Map());
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const wsUrl = `${process.env.REACT_APP_WS_URL || 'ws://localhost:8000'}/ws/tokens`;
      
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        setIsConnected(true);
        setError(null);
        reconnectAttempts.current = 0;
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'token_update') {
            // Update specific token data
            setTokenUpdates(prev => {
              const newMap = new Map(prev);
              newMap.set(data.token_address, {
                ...data.token,
                lastUpdate: Date.now()
              });
              return newMap;
            });
          } else if (data.type === 'price_update') {
            // Handle price updates for multiple tokens
            if (data.prices) {
              setTokenUpdates(prev => {
                const newMap = new Map(prev);
                Object.entries(data.prices).forEach(([address, priceData]: [string, any]) => {
                  newMap.set(address, {
                    ...priceData,
                    lastUpdate: Date.now()
                  });
                });
                return newMap;
              });
            }
          }
        } catch (err) {
          console.error('Error parsing token WebSocket message:', err);
        }
      };

      wsRef.current.onclose = (event) => {
        setIsConnected(false);
        
        // Attempt to reconnect if not a normal closure
        if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current++;
            connect();
          }, delay);
        } else if (reconnectAttempts.current >= maxReconnectAttempts) {
          setError('Failed to reconnect to token updates');
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('Token WebSocket error:', error);
        setError('WebSocket connection error');
      };

    } catch (err) {
      console.error('Error creating token WebSocket:', err);
      setError('Failed to connect to token updates');
    }
  }, []);

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
      console.warn('Token WebSocket not connected, cannot send message');
    }
  };

  const subscribeToToken = (tokenAddress: string) => {
    sendMessage({
      type: 'subscribe',
      token_address: tokenAddress
    });
  };

  const unsubscribeFromToken = (tokenAddress: string) => {
    sendMessage({
      type: 'unsubscribe',
      token_address: tokenAddress
    });
  };

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  return {
    isConnected,
    tokenUpdates,
    error,
    sendMessage,
    subscribeToToken,
    unsubscribeFromToken,
    connect,
    disconnect
  };
};
