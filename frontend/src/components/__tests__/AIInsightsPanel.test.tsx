import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import AIInsightsPanel from '../AIInsightsPanel';
import { ThemeProvider } from '../../contexts/ThemeContext';
import { useChat } from '../../hooks/useChat';

// Mock the useChat hook
vi.mock('../../hooks/useChat');

const mockUseChat = vi.mocked(useChat);

// Mock AgentStatus component
vi.mock('../AgentStatus', () => ({
  default: ({ agent, message }: { agent: string; message: string }) => (
    <div data-testid="agent-status" data-agent={agent}>
      {message}
    </div>
  ),
}));

const mockToken = {
  name: 'Base Token',
  symbol: 'BASE',
  price: 1.0,
  address: '0x123',
  market_cap: 1000000,
  volume_24h: 100000,
  liquidity: 500000,
  holders: 1000,
};

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider>
      {component}
    </ThemeProvider>
  );
};

describe('AIInsightsPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock implementation
    mockUseChat.mockReturnValue({
      sendMessage: vi.fn(),
      sendMessageStream: vi.fn(),
      isConnected: true,
      messages: [],
      isLoading: false,
      error: null,
    });
  });

  describe('Rendering', () => {
    it('renders AI insights panel with EAILI5 personality', () => {
      renderWithTheme(<AIInsightsPanel selectedToken={mockToken} />);

      expect(screen.getByText(/Hey! I'm EAILI5/)).toBeInTheDocument();
      expect(screen.getByText(/I'm here to help you understand crypto/)).toBeInTheDocument();
    });

    it('renders with selected token information', () => {
      renderWithTheme(<AIInsightsPanel selectedToken={mockToken} />);

      expect(screen.getByText('Base Token (BASE)')).toBeInTheDocument();
      expect(screen.getByText('$1.00')).toBeInTheDocument();
    });

    it('renders without selected token', () => {
      renderWithTheme(<AIInsightsPanel selectedToken={null} />);

      expect(screen.getByText(/Hey! I'm EAILI5/)).toBeInTheDocument();
      expect(screen.queryByText('Base Token (BASE)')).not.toBeInTheDocument();
    });

    it('renders chat input and send button', () => {
      renderWithTheme(<AIInsightsPanel selectedToken={mockToken} />);

      expect(screen.getByPlaceholderText('Ask EAILI5 anything about crypto...')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
    });

    it('renders suggestion buttons', () => {
      renderWithTheme(<AIInsightsPanel selectedToken={mockToken} />);

      expect(screen.getByText('What is cryptocurrency?')).toBeInTheDocument();
      expect(screen.getByText('How do I start learning?')).toBeInTheDocument();
      expect(screen.getByText('Show me trading basics')).toBeInTheDocument();
    });
  });

  describe('Message Sending', () => {
    it('sends message when send button is clicked', async () => {
      const mockSendMessage = vi.fn().mockResolvedValue({
        message: 'AI response',
        suggestions: ['Suggestion 1'],
        learning_level: 1,
      });

      mockUseChat.mockReturnValue({
        sendMessage: mockSendMessage,
        sendMessageStream: vi.fn(),
        isConnected: true,
        messages: [],
        isLoading: false,
        error: null,
      });

      renderWithTheme(<AIInsightsPanel selectedToken={mockToken} />);

      const input = screen.getByPlaceholderText('Ask EAILI5 anything about crypto...');
      const sendButton = screen.getByRole('button', { name: /send/i });

      fireEvent.change(input, { target: { value: 'What is Bitcoin?' } });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(mockSendMessage).toHaveBeenCalledWith(
          'What is Bitcoin?',
          expect.any(String), // wallet address
          expect.any(String), // session token
          0, // learning level
          expect.any(Object) // context
        );
      });
    });

    it('sends message when Enter key is pressed', async () => {
      const mockSendMessage = vi.fn().mockResolvedValue({
        message: 'AI response',
        suggestions: ['Suggestion 1'],
        learning_level: 1,
      });

      mockUseChat.mockReturnValue({
        sendMessage: mockSendMessage,
        sendMessageStream: vi.fn(),
        isConnected: true,
        messages: [],
        isLoading: false,
        error: null,
      });

      renderWithTheme(<AIInsightsPanel selectedToken={mockToken} />);

      const input = screen.getByPlaceholderText('Ask EAILI5 anything about crypto...');

      fireEvent.change(input, { target: { value: 'What is Bitcoin?' } });
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

      await waitFor(() => {
        expect(mockSendMessage).toHaveBeenCalled();
      });
    });

    it('prevents sending empty messages', () => {
      const mockSendMessage = vi.fn();

      mockUseChat.mockReturnValue({
        sendMessage: mockSendMessage,
        sendMessageStream: vi.fn(),
        isConnected: true,
        messages: [],
        isLoading: false,
        error: null,
      });

      renderWithTheme(<AIInsightsPanel selectedToken={mockToken} />);

      const sendButton = screen.getByRole('button', { name: /send/i });
      fireEvent.click(sendButton);

      expect(mockSendMessage).not.toHaveBeenCalled();
    });
  });

  describe('Suggestion Clicks', () => {
    it('sends suggestion as message when clicked', async () => {
      const mockSendMessage = vi.fn().mockResolvedValue({
        message: 'AI response to suggestion',
        suggestions: ['New suggestion'],
        learning_level: 1,
      });

      mockUseChat.mockReturnValue({
        sendMessage: mockSendMessage,
        sendMessageStream: vi.fn(),
        isConnected: true,
        messages: [],
        isLoading: false,
        error: null,
      });

      renderWithTheme(<AIInsightsPanel selectedToken={mockToken} />);

      const suggestionButton = screen.getByText('What is cryptocurrency?');
      fireEvent.click(suggestionButton);

      await waitFor(() => {
        expect(mockSendMessage).toHaveBeenCalledWith(
          'What is cryptocurrency?',
          expect.any(String),
          expect.any(String),
          0,
          expect.any(Object)
        );
      });
    });

    it('handles all suggestion buttons', async () => {
      const mockSendMessage = vi.fn().mockResolvedValue({
        message: 'AI response',
        suggestions: [],
        learning_level: 1,
      });

      mockUseChat.mockReturnValue({
        sendMessage: mockSendMessage,
        sendMessageStream: vi.fn(),
        isConnected: true,
        messages: [],
        isLoading: false,
        error: null,
      });

      renderWithTheme(<AIInsightsPanel selectedToken={mockToken} />);

      const suggestions = [
        'What is cryptocurrency?',
        'How do I start learning?',
        'Show me trading basics',
      ];

      for (const suggestion of suggestions) {
        const button = screen.getByText(suggestion);
        fireEvent.click(button);

        await waitFor(() => {
          expect(mockSendMessage).toHaveBeenCalledWith(
            suggestion,
            expect.any(String),
            expect.any(String),
            0,
            expect.any(Object)
          );
        });
      }
    });
  });

  describe('Streaming Messages', () => {
    it('handles streaming message display', async () => {
      const mockSendMessageStream = vi.fn();
      const mockOnChunk = vi.fn();
      const mockOnStatus = vi.fn();
      const mockOnComplete = vi.fn();

      mockUseChat.mockReturnValue({
        sendMessage: vi.fn(),
        sendMessageStream: mockSendMessageStream,
        isConnected: true,
        messages: [],
        isLoading: false,
        error: null,
      });

      renderWithTheme(<AIInsightsPanel selectedToken={mockToken} />);

      const input = screen.getByPlaceholderText('Ask EAILI5 anything about crypto...');
      fireEvent.change(input, { target: { value: 'Test message' } });

      // Simulate streaming response
      mockSendMessageStream.mockImplementation((message, onChunk, onStatus, onComplete) => {
        onStatus('coordinator', 'Routing to educator...');
        onChunk('Hello');
        onChunk(' there!');
        onComplete('Hello there!');
      });

      const sendButton = screen.getByRole('button', { name: /send/i });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(mockSendMessageStream).toHaveBeenCalled();
      });
    });

    it('displays agent status updates', async () => {
      const mockSendMessageStream = vi.fn();

      mockUseChat.mockReturnValue({
        sendMessage: vi.fn(),
        sendMessageStream: mockSendMessageStream,
        isConnected: true,
        messages: [],
        isLoading: false,
        error: null,
      });

      renderWithTheme(<AIInsightsPanel selectedToken={mockToken} />);

      // Mock streaming with status updates
      mockSendMessageStream.mockImplementation((message, onChunk, onStatus, onComplete) => {
        onStatus('coordinator', 'Routing to educator...');
        onStatus('educator', 'Preparing explanation...');
        onChunk('Bitcoin is a digital currency');
        onComplete('Bitcoin is a digital currency');
      });

      const input = screen.getByPlaceholderText('Ask EAILI5 anything about crypto...');
      const sendButton = screen.getByRole('button', { name: /send/i });

      fireEvent.change(input, { target: { value: 'What is Bitcoin?' } });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(screen.getByTestId('agent-status')).toBeInTheDocument();
      });
    });
  });

  describe('EAILI5 Personality', () => {
    it('maintains EAILI5 personality in responses', () => {
      renderWithTheme(<AIInsightsPanel selectedToken={mockToken} />);

      expect(screen.getByText(/Hey! I'm EAILI5/)).toBeInTheDocument();
      expect(screen.getByText(/I'm here to help you understand crypto/)).toBeInTheDocument();
    });

    it('shows friendly and educational tone', () => {
      renderWithTheme(<AIInsightsPanel selectedToken={mockToken} />);

      expect(screen.getByText(/Let's explore the exciting world of cryptocurrency together/)).toBeInTheDocument();
    });

    it('provides helpful suggestions', () => {
      renderWithTheme(<AIInsightsPanel selectedToken={mockToken} />);

      expect(screen.getByText('What is cryptocurrency?')).toBeInTheDocument();
      expect(screen.getByText('How do I start learning?')).toBeInTheDocument();
      expect(screen.getByText('Show me trading basics')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('displays error messages', () => {
      mockUseChat.mockReturnValue({
        sendMessage: vi.fn(),
        sendMessageStream: vi.fn(),
        isConnected: true,
        messages: [],
        isLoading: false,
        error: 'Connection failed',
      });

      renderWithTheme(<AIInsightsPanel selectedToken={mockToken} />);

      expect(screen.getByText('Connection failed')).toBeInTheDocument();
    });

    it('handles connection errors gracefully', () => {
      mockUseChat.mockReturnValue({
        sendMessage: vi.fn(),
        sendMessageStream: vi.fn(),
        isConnected: false,
        messages: [],
        isLoading: false,
        error: null,
      });

      renderWithTheme(<AIInsightsPanel selectedToken={mockToken} />);

      // Should still render the panel
      expect(screen.getByText(/Hey! I'm EAILI5/)).toBeInTheDocument();
    });

    it('shows loading state during message sending', () => {
      mockUseChat.mockReturnValue({
        sendMessage: vi.fn(),
        sendMessageStream: vi.fn(),
        isConnected: true,
        messages: [],
        isLoading: true,
        error: null,
      });

      renderWithTheme(<AIInsightsPanel selectedToken={mockToken} />);

      expect(screen.getByText(/EAILI5 is thinking/)).toBeInTheDocument();
    });
  });

  describe('Token Context', () => {
    it('includes token information in context', async () => {
      const mockSendMessage = vi.fn().mockResolvedValue({
        message: 'AI response',
        suggestions: [],
        learning_level: 1,
      });

      mockUseChat.mockReturnValue({
        sendMessage: mockSendMessage,
        sendMessageStream: vi.fn(),
        isConnected: true,
        messages: [],
        isLoading: false,
        error: null,
      });

      renderWithTheme(<AIInsightsPanel selectedToken={mockToken} />);

      const input = screen.getByPlaceholderText('Ask EAILI5 anything about crypto...');
      const sendButton = screen.getByRole('button', { name: /send/i });

      fireEvent.change(input, { target: { value: 'Tell me about this token' } });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(mockSendMessage).toHaveBeenCalledWith(
          'Tell me about this token',
          expect.any(String),
          expect.any(String),
          0,
          expect.objectContaining({
            selectedToken: mockToken,
          })
        );
      });
    });

    it('handles null token gracefully', async () => {
      const mockSendMessage = vi.fn().mockResolvedValue({
        message: 'AI response',
        suggestions: [],
        learning_level: 1,
      });

      mockUseChat.mockReturnValue({
        sendMessage: mockSendMessage,
        sendMessageStream: vi.fn(),
        isConnected: true,
        messages: [],
        isLoading: false,
        error: null,
      });

      renderWithTheme(<AIInsightsPanel selectedToken={null} />);

      const input = screen.getByPlaceholderText('Ask EAILI5 anything about crypto...');
      const sendButton = screen.getByRole('button', { name: /send/i });

      fireEvent.change(input, { target: { value: 'General question' } });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(mockSendMessage).toHaveBeenCalledWith(
          'General question',
          expect.any(String),
          expect.any(String),
          0,
          expect.objectContaining({
            selectedToken: null,
          })
        );
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      renderWithTheme(<AIInsightsPanel selectedToken={mockToken} />);

      const input = screen.getByPlaceholderText('Ask EAILI5 anything about crypto...');
      expect(input).toHaveAttribute('aria-label');

      const sendButton = screen.getByRole('button', { name: /send/i });
      expect(sendButton).toHaveAttribute('aria-label');
    });

    it('supports keyboard navigation', () => {
      renderWithTheme(<AIInsightsPanel selectedToken={mockToken} />);

      const input = screen.getByPlaceholderText('Ask EAILI5 anything about crypto...');
      const sendButton = screen.getByRole('button', { name: /send/i });

      // Should be focusable
      input.focus();
      expect(document.activeElement).toBe(input);

      sendButton.focus();
      expect(document.activeElement).toBe(sendButton);
    });
  });

  describe('Performance', () => {
    it('handles rapid message sending', async () => {
      const mockSendMessage = vi.fn().mockResolvedValue({
        message: 'AI response',
        suggestions: [],
        learning_level: 1,
      });

      mockUseChat.mockReturnValue({
        sendMessage: mockSendMessage,
        sendMessageStream: vi.fn(),
        isConnected: true,
        messages: [],
        isLoading: false,
        error: null,
      });

      renderWithTheme(<AIInsightsPanel selectedToken={mockToken} />);

      const input = screen.getByPlaceholderText('Ask EAILI5 anything about crypto...');
      const sendButton = screen.getByRole('button', { name: /send/i });

      // Rapid clicks
      fireEvent.change(input, { target: { value: 'Message 1' } });
      fireEvent.click(sendButton);
      fireEvent.change(input, { target: { value: 'Message 2' } });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(mockSendMessage).toHaveBeenCalledTimes(2);
      });
    });

    it('does not re-render unnecessarily', () => {
      const { rerender } = renderWithTheme(<AIInsightsPanel selectedToken={mockToken} />);

      // Re-render with same props
      rerender(
        <ThemeProvider>
          <AIInsightsPanel selectedToken={mockToken} />
        </ThemeProvider>
      );

      // Should not cause issues
      expect(screen.getByText(/Hey! I'm EAILI5/)).toBeInTheDocument();
    });
  });
});
