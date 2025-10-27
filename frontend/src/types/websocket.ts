// WebSocket message types for EAILI5 chat system

export interface ChatMessage {
  message: string;
  user_id: string;
  context?: Record<string, any>;
  // WebSocket-specific fields
  type?: 'chat';
  messageId?: number;
  learning_level?: number;
  session_id?: string;
  streaming?: boolean;
}

export interface AIResponse {
  type: 'ai_response';
  message: string;
  suggestions: string[];
  learning_level: number;
  messageId: number;
  intent?: string;
  timestamp?: string;
}

export interface WebSocketError {
  type: 'error';
  message: string;
  code?: string;
  timestamp: string;
}

export interface ConnectionStatus {
  type: 'connection';
  status: 'connected' | 'disconnected' | 'connecting';
  timestamp: string;
}

export type WebSocketMessage = ChatMessage | AIResponse | WebSocketError | ConnectionStatus;
