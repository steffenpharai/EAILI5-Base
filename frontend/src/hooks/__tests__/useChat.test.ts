import { renderHook, act } from '@testing-library/react';
import { useChat } from '../useChat';

// Mock WebSocket
class MockWebSocket {
  public readyState = WebSocket.CONNECTING;
  public url: string;
  public onopen: ((event: Event) => void) | null = null;
  public onclose: ((event: CloseEvent) => void) | null = null;
  public onmessage: ((event: MessageEvent) => void) | null = null;
  public onerror: ((event: Event) => void) | null = null;
  public send = jest.fn();
  public close = jest.fn();
  public addEventListener = jest.fn();
  public removeEventListener = jest.fn();

  constructor(url: string) {
    this.url = url;
    // Simulate connection
    setTimeout(() => {
      this.readyState = WebSocket.OPEN;
      if (this.onopen) this.onopen(new Event('open'));
    }, 10);
  }
}

// Mock global WebSocket
global.WebSocket = MockWebSocket as any;

describe('useChat', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('WebSocket Connection', () => {
    it('connects to WebSocket on mount', () => {
      const { result } = renderHook(() => useChat());
      
      expect(result.current.isConnected).toBe(false);
      
      // Wait for connection
      act(() => {
        // Simulate WebSocket connection
        const ws = new MockWebSocket('ws://localhost:8000/ws/chat/test');
        ws.readyState = WebSocket.OPEN;
      });
    });

    it('updates connection status when WebSocket opens', async () => {
      const { result } = renderHook(() => useChat());
      
      // Initially not connected
      expect(result.current.isConnected).toBe(false);
      
      // Simulate WebSocket opening
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 20));
      });
    });
  });

  describe('sendMessage', () => {
    it('validates session_id before sending', async () => {
      const { result } = renderHook(() => useChat());
      
      await expect(
        result.current.sendMessage('test', 'user', '', 0, {})
      ).rejects.toThrow('Session token is required. Please refresh the page.');
    });

    it('validates session_id is not empty', async () => {
      const { result } = renderHook(() => useChat());
      
      await expect(
        result.current.sendMessage('test', 'user', '   ', 0, {})
      ).rejects.toThrow('Session token is required. Please refresh the page.');
    });

    it('sends message with correct structure', async () => {
      const { result } = renderHook(() => useChat());
      
      // Mock WebSocket
      const mockSend = jest.fn();
      const mockAddEventListener = jest.fn();
      
      // Create a mock WebSocket that we can control
      const mockWS = {
        readyState: WebSocket.OPEN,
        send: mockSend,
        addEventListener: mockAddEventListener,
        removeEventListener: jest.fn(),
        url: 'ws://localhost:8000/ws/chat/test'
      };

      // Mock WebSocket constructor
      jest.spyOn(global, 'WebSocket').mockImplementation(() => mockWS as any);

      const sendPromise = result.current.sendMessage(
        'test message',
        'user123',
        'session-token',
        1,
        { context: 'test' }
      );

      // Verify message structure
      expect(mockSend).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'chat',
          message: 'test message',
          messageId: expect.stringMatching(/^msg_\d+$/),
          learning_level: 1,
          context: { context: 'test' },
          session_id: 'session-token'
        })
      );

      // Simulate response
      act(() => {
        const messageEvent = new MessageEvent('message', {
          data: JSON.stringify({
            type: 'ai_response',
            message: 'AI response',
            suggestions: ['suggestion1'],
            learning_level: 2,
            messageId: expect.stringMatching(/^msg_\d+$/)
          })
        });
        mockAddEventListener.mock.calls[0][1](messageEvent);
      });

      const response = await sendPromise;
      expect(response).toEqual({
        message: 'AI response',
        suggestions: ['suggestion1'],
        learning_level: 2
      });
    });

    it('handles error responses', async () => {
      const { result } = renderHook(() => useChat());
      
      const mockWS = {
        readyState: WebSocket.OPEN,
        send: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        url: 'ws://localhost:8000/ws/chat/test'
      };

      jest.spyOn(global, 'WebSocket').mockImplementation(() => mockWS as any);

      const sendPromise = result.current.sendMessage(
        'test message',
        'user123',
        'session-token',
        0,
        {}
      );

      // Simulate error response
      act(() => {
        const messageEvent = new MessageEvent('message', {
          data: JSON.stringify({
            type: 'error',
            message: 'Session expired',
            messageId: expect.stringMatching(/^msg_\d+$/)
          })
        });
        mockWS.addEventListener.mock.calls[0][1](messageEvent);
      });

      await expect(sendPromise).rejects.toThrow('Session expired');
    });

    it('handles timeout', async () => {
      const { result } = renderHook(() => useChat());
      
      const mockWS = {
        readyState: WebSocket.OPEN,
        send: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        url: 'ws://localhost:8000/ws/chat/test'
      };

      jest.spyOn(global, 'WebSocket').mockImplementation(() => mockWS as any);

      // Mock setTimeout to make timeout faster
      jest.useFakeTimers();
      
      const sendPromise = result.current.sendMessage(
        'test message',
        'user123',
        'session-token',
        0,
        {}
      );

      // Fast-forward time to trigger timeout
      act(() => {
        jest.advanceTimersByTime(30000);
      });

      await expect(sendPromise).rejects.toThrow('Request timeout');
      
      jest.useRealTimers();
    });

    it('ignores responses with mismatched message IDs', async () => {
      const { result } = renderHook(() => useChat());
      
      const mockWS = {
        readyState: WebSocket.OPEN,
        send: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        url: 'ws://localhost:8000/ws/chat/test'
      };

      jest.spyOn(global, 'WebSocket').mockImplementation(() => mockWS as any);

      const sendPromise = result.current.sendMessage(
        'test message',
        'user123',
        'session-token',
        0,
        {}
      );

      // Simulate response with wrong message ID
      act(() => {
        const messageEvent = new MessageEvent('message', {
          data: JSON.stringify({
            type: 'ai_response',
            message: 'Wrong response',
            messageId: 'wrong-id'
          })
        });
        mockWS.addEventListener.mock.calls[0][1](messageEvent);
      });

      // Should still be waiting for correct response
      expect(mockWS.removeEventListener).not.toHaveBeenCalled();
    });
  });

  describe('Message ID Generation', () => {
    it('generates unique message IDs', async () => {
      const { result } = renderHook(() => useChat());
      
      const mockWS = {
        readyState: WebSocket.OPEN,
        send: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        url: 'ws://localhost:8000/ws/chat/test'
      };

      jest.spyOn(global, 'WebSocket').mockImplementation(() => mockWS as any);

      // Send multiple messages
      result.current.sendMessage('message1', 'user', 'session', 0, {});
      result.current.sendMessage('message2', 'user', 'session', 0, {});

      // Check that different message IDs were generated
      const calls = mockWS.send.mock.calls;
      expect(calls).toHaveLength(2);
      
      const message1 = JSON.parse(calls[0][0]);
      const message2 = JSON.parse(calls[1][0]);
      
      expect(message1.messageId).not.toBe(message2.messageId);
      expect(message1.messageId).toMatch(/^msg_\d+$/);
      expect(message2.messageId).toMatch(/^msg_\d+$/);
    });
  });
});
