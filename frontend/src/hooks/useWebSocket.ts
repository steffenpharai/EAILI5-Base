import { useState, useEffect, useRef, useCallback } from 'react';

interface WebSocketState {
  isConnected: boolean;
  connect: (sessionToken: string) => void;
  disconnect: () => void;
  sendMessage: (message: any) => void;
  addMessageListener: (callback: (data: any) => void) => () => void;
}

// Global WebSocket instance
let globalWebSocket: WebSocket | null = null;
let globalConnectionState = false;
const messageListeners = new Set<(data: any) => void>();

export const useWebSocket = (): WebSocketState => {
  const [isConnected, setIsConnected] = useState(globalConnectionState);
  const listenersRef = useRef<Set<(data: any) => void>>(new Set());

  const connect = useCallback((sessionToken: string) => {
    if (!sessionToken || sessionToken.trim() === '') {
      throw new Error('Session token is required to connect WebSocket');
    }

    // Don't create multiple connections - reuse existing if connected
    if (globalWebSocket && globalWebSocket.readyState === WebSocket.OPEN) {
      return;
    }

    // Close existing connection if any
    if (globalWebSocket) {
      globalWebSocket.close();
    }

    // Use secure session-based WebSocket URL
    const wsUrl = `${process.env.REACT_APP_WS_URL || 'ws://localhost:8000'}/ws/chat/secure`;
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      globalConnectionState = true;
      setIsConnected(true);
    };

    ws.onclose = (event) => {
      globalConnectionState = false;
      setIsConnected(false);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      globalConnectionState = false;
      setIsConnected(false);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        // Notify all listeners
        messageListeners.forEach(listener => {
          try {
            listener(data);
          } catch (error) {
            console.error('Error in message listener:', error);
          }
        });
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    globalWebSocket = ws;
  }, []);

  const disconnect = useCallback(() => {
    if (globalWebSocket) {
      globalWebSocket.close();
      globalWebSocket = null;
      globalConnectionState = false;
      setIsConnected(false);
    }
  }, []);

  const sendMessage = useCallback((message: any) => {
    if (globalWebSocket && globalWebSocket.readyState === WebSocket.OPEN) {
      globalWebSocket.send(JSON.stringify(message));
    } else {
      throw new Error('WebSocket not connected');
    }
  }, []);

  const addMessageListener = useCallback((callback: (data: any) => void) => {
    messageListeners.add(callback);
    listenersRef.current.add(callback);
    
    return () => {
      messageListeners.delete(callback);
      listenersRef.current.delete(callback);
    };
  }, []);

  // Cleanup listeners on unmount
  useEffect(() => {
    const currentListeners = listenersRef.current;
    return () => {
      currentListeners.forEach(listener => {
        messageListeners.delete(listener);
      });
    };
  }, []);

  return {
    isConnected,
    connect,
    disconnect,
    sendMessage,
    addMessageListener
  };
};
