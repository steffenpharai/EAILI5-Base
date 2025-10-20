import { useState, useRef } from 'react';
import { useWebSocket } from './useWebSocket';

interface ChatResponse {
  message: string;
  suggestions?: string[];
  learning_level?: number;
}

export const useChat = () => {
  const [agentActivities, setAgentActivities] = useState<Array<{
    agent: string;
    message: string;
    timestamp: number;
    status: 'active' | 'completed' | 'error';
  }>>([]);
  const messageIdRef = useRef(0);
  const { isConnected, connect, disconnect, sendMessage: wsSendMessage, addMessageListener } = useWebSocket();

  const sendMessage = async (
    message: string, 
    user_id: string,
    session_id: string,
    learning_level: number = 0,
    context: any = {}
  ): Promise<ChatResponse> => {
    // Validate session_id exists
    if (!session_id || session_id.trim() === '') {
      throw new Error('Session token is required. Please refresh the page.');
    }
    
    return new Promise((resolve, reject) => {
      if (!isConnected) {
        reject(new Error('WebSocket not connected'));
        return;
      }

      const messageId = `msg_${Date.now()}_${++messageIdRef.current}`;
      
      const timeout = setTimeout(() => {
        console.error('useChat: Request timeout after 30 seconds');
        clearTimeout(warningTimeout);
        reject(new Error('Request timeout'));
      }, 30000); // 30 second timeout for AI processing

      // Add a warning at 20 seconds to let user know AI is still processing
      const warningTimeout = setTimeout(() => {
        console.warn('useChat: AI is taking longer than usual to respond...');
      }, 20000);

      // Set up response handler
      const handleMessage = (data: any) => {
        if (data.type === 'ai_response' && data.messageId === messageId) {
          clearTimeout(timeout);
          clearTimeout(warningTimeout);
          removeListener();
          resolve({
            message: data.message,
            suggestions: data.suggestions,
            learning_level: data.learning_level
          });
        } else if (data.type === 'error' && data.messageId === messageId) {
          // Session expired or invalid
          clearTimeout(timeout);
          clearTimeout(warningTimeout);
          removeListener();
          reject(new Error(data.message));
        }
      };

      const removeListener = addMessageListener(handleMessage);

      // Send message
      const messageToSend = {
        type: 'chat',
        message,
        messageId: messageId,
        learning_level,
        context,
        session_id,
        streaming: false  // Non-streaming mode (legacy)
      };
      wsSendMessage(messageToSend);
    });
  };

  const sendMessageStream = (
    message: string,
    user_id: string,
    session_id: string,
    onChunk: (chunk: string) => void,
    onStatus: (agent: string, status: string) => void,
    onComplete: (suggestions: string[], learning_level: number) => void,
    onError: (error: string) => void,
    learning_level: number = 0,
    context: any = {}
  ) => {
    // Validate session_id exists
    if (!session_id || session_id.trim() === '') {
      console.error('useChat: No session token provided');
      onError('Session token is required. Please refresh the page.');
      return;
    }

    if (!isConnected) {
      console.error('useChat: WebSocket not connected');
      onError('WebSocket not connected');
      return;
    }

    const messageId = `msg_${Date.now()}_${++messageIdRef.current}`;
    
    const handleMessage = (data: any) => {
      // Only process messages for this specific messageId
      if (data.messageId !== messageId) {
        return;
      }

        switch (data.type) {
          case 'status':
            // Agent status update
            onStatus(data.agent, data.message);
            // Track agent activity
            setAgentActivities(prev => [...prev, {
              agent: data.agent,
              message: data.message,
              timestamp: Date.now(),
              status: 'active'
            }]);
            break;

          case 'chunk':
            // Character chunk
            onChunk(data.content);
            break;

          case 'complete':
            // Stream complete
            removeListener();
            onComplete(data.suggestions || [], data.learning_level || 0);
            // Mark all active activities as completed
            setAgentActivities(prev => prev.map(activity => 
              activity.status === 'active' 
                ? { ...activity, status: 'completed' as const }
                : activity
            ));
            break;

          case 'error':
            // Error occurred
            removeListener();
            onError(data.message || 'Unknown error');
            // Mark all active activities as error
            setAgentActivities(prev => prev.map(activity => 
              activity.status === 'active' 
                ? { ...activity, status: 'error' as const }
                : activity
            ));
            break;
        }
    };

    const removeListener = addMessageListener(handleMessage);

    // Send streaming message request
    const messageToSend = {
      type: 'chat',
      message,
      messageId,
      learning_level,
      context,
      session_id,
      streaming: true  // Enable streaming mode
    };
    
    wsSendMessage(messageToSend);
  };

  return {
    sendMessage,
    sendMessageStream,
    isConnected,
    agentActivities,
    connect,
    disconnect
  };
};
