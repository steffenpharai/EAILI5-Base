import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Brain, BookOpen, Wallet, Send } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigation } from '../contexts/NavigationContext';
import { useSession } from '../contexts/SessionContext';
import { useChat } from '../hooks/useChat';
import { ProButton, ProInput } from './pro';
import SuggestionChips from './SuggestionChips';

// Simple markdown renderer for basic formatting
const renderMarkdown = (text: string): string => {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br/>');
};

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  agent?: string;
}

const WelcomeLanding: React.FC = () => {
  const { theme } = useTheme();
  const { setView } = useNavigation();
  const { sessionToken, isSessionReady } = useSession();
  const { sendMessageStream, isConnected, connect } = useChat();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const isStreamingRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Connect WebSocket when session is ready
  useEffect(() => {
    if (isSessionReady && sessionToken) {
      console.log('WelcomeLanding: Connecting WebSocket with session token:', sessionToken);
      try {
        connect(sessionToken);
      } catch (error) {
        console.error('WelcomeLanding: Failed to connect WebSocket:', error);
        setMessages(prev => [...prev, {
          id: `error_${Date.now()}`,
          role: 'system',
          content: 'Failed to connect to AI service. Please refresh the page.',
          timestamp: Date.now(),
        }]);
      }
    }
  }, [isSessionReady, sessionToken, connect]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = useCallback(async () => {
    if (!inputMessage.trim() || isStreaming || !isConnected || !isSessionReady) return;

    // Ensure we have a session token
    if (!sessionToken) {
      console.error('No session token available');
      setMessages(prev => [...prev, {
        id: `error_${Date.now()}`,
        role: 'system',
        content: 'Session not available. Please refresh the page.',
        timestamp: Date.now(),
      }]);
      return;
    }

    // Prevent multiple simultaneous streams
    if (isStreamingRef.current) {
      console.log('Stream already in progress, ignoring request');
      return;
    }
    
    isStreamingRef.current = true;

    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: inputMessage,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsAnalyzing(true);
    setSuggestions([]); // Clear previous suggestions

    // Add analyzing message immediately (like ChatGPT)
    const analyzingMessage: Message = {
      id: `analyzing_${Date.now()}`,
      role: 'assistant',
      content: 'Analyzing your question...',
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, analyzingMessage]);

    // Create a consistent AI message ID for streaming
    const aiMessageId = `ai_${Date.now()}`;

    try {
      console.log('Sending message with session token:', sessionToken);
      console.log('About to call sendMessageStream for message:', inputMessage);
      await sendMessageStream(
        inputMessage,
        'anonymous',
        sessionToken,
        (chunk: string) => {
          console.log('WelcomeLanding received chunk:', JSON.stringify(chunk), 'Length:', chunk.length);
          setMessages(prev => {
            const updated = [...prev];
            const lastMessage = updated[updated.length - 1];
            
            // If we're still analyzing, remove analyzing message and add new AI message
            if (lastMessage && lastMessage.id.startsWith('analyzing_')) {
              updated.pop(); // Remove analyzing message
              updated.push({
                id: aiMessageId,
                role: 'assistant',
                content: chunk,
                timestamp: Date.now(),
              });
              setIsAnalyzing(false);
              setIsStreaming(true);
            } else if (lastMessage && lastMessage.role === 'assistant' && lastMessage.id === aiMessageId) {
              // Create new message object with appended content (don't mutate)
              updated[updated.length - 1] = {
                ...lastMessage,
                content: lastMessage.content + chunk
              };
            } else {
              // Create new assistant message with consistent ID
              updated.push({
                id: aiMessageId,
                role: 'assistant',
                content: chunk,
                timestamp: Date.now(),
              });
            }
            return updated;
          });
        },
        (agent: string, status: string) => {
          // Update the analyzing message with ChatGPT-style formatting
          setMessages(prev => {
            const updated = [...prev];
            const lastMessage = updated[updated.length - 1];
            if (lastMessage && lastMessage.id.startsWith('analyzing_')) {
              // Format like ChatGPT: bold main action, lighter subtext
              const agentNames: Record<string, string> = {
                'coordinator': 'Analyzing',
                'research': 'Researching',
                'educator': 'Preparing explanation',
                'portfolio': 'Analyzing portfolio',
                'trading': 'Analyzing strategy',
                'web_search': 'Searching web'
              };
              const mainAction = agentNames[agent.toLowerCase()] || 'Processing';
              // Format with HTML for bold/light styling
              lastMessage.content = `<strong>${mainAction}</strong><br/><span style="opacity: 0.7; font-size: 0.9em;">${status}</span>`;
            }
            return updated;
          });
        },
        (suggestions: string[], learningLevel: number) => {
          setIsStreaming(false);
          setIsAnalyzing(false);
          isStreamingRef.current = false; // Reset streaming flag
          
          // Remove any remaining analyzing messages (ChatGPT style - no persistent activity)
          setMessages(prev => {
            return prev.filter(msg => !msg.id.startsWith('analyzing_'));
          });
          
          // Store suggestions for display
          setSuggestions(suggestions);
        },
        (error: string) => {
          setIsStreaming(false);
          setIsAnalyzing(false);
          isStreamingRef.current = false; // Reset streaming flag
          setMessages(prev => [...prev, {
            id: `error_${Date.now()}`,
            role: 'assistant',
            content: `Sorry, I encountered an error: ${error}`,
            timestamp: Date.now(),
          }]);
        }
      );
    } catch (error: any) {
      setIsStreaming(false);
      setMessages(prev => [...prev, {
        id: `error_${Date.now()}`,
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error.message}`,
        timestamp: Date.now(),
      }]);
    }
  }, [inputMessage, isStreaming, isConnected, isSessionReady, sessionToken, sendMessageStream]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputMessage(suggestion);
    // Auto-send the suggestion
    setTimeout(() => {
      handleSendMessage();
    }, 100);
  };

  const suggestedPrompts = [
    "What is DeFi and how does it work?",
    "How do I analyze a token's safety?",
    "Explain liquidity pools to me",
    "Tell me about AAVE",
    "What are the risks of crypto investing?",
    "How do smart contracts work?"
  ];

  const containerStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    background: theme.background.primary,
    overflow: 'hidden',
  };

  const heroStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '40px 20px',
    textAlign: 'center',
    background: `linear-gradient(135deg, ${theme.surface.primary} 0%, ${theme.surface.secondary} 100%)`,
    borderBottom: `1px solid ${theme.border.primary}`,
  };

  const logoStyles: React.CSSProperties = {
    fontSize: '48px',
    fontWeight: 800,
    color: theme.accent.blue,
    marginBottom: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  };

  const taglineStyles: React.CSSProperties = {
    fontSize: '24px',
    fontWeight: 600,
    color: theme.text.primary,
    marginBottom: '8px',
  };

  const subtitleStyles: React.CSSProperties = {
    fontSize: '16px',
    color: theme.text.secondary,
    marginBottom: '32px',
    maxWidth: '600px',
  };

  const actionButtonsStyles: React.CSSProperties = {
    display: 'flex',
    gap: '16px',
    marginBottom: '32px',
    flexWrap: 'wrap',
    justifyContent: 'center',
  };

  const chatContainerStyles: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    padding: '20px',
    overflow: 'hidden',
  };

  const messagesAreaStyles: React.CSSProperties = {
    flex: 1,
    overflowY: 'auto',
    padding: '20px',
    background: theme.surface.secondary,
    borderRadius: '12px',
    marginBottom: '20px',
    border: `1px solid ${theme.border.primary}`,
  };

  const messageStyles = (role: string): React.CSSProperties => ({
    marginBottom: '16px',
    display: 'flex',
    justifyContent: role === 'user' ? 'flex-end' : 'flex-start',
  });

  const messageBubbleStyles = (role: string): React.CSSProperties => ({
    maxWidth: '70%',
    padding: '12px 16px',
    borderRadius: role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
    background: role === 'user' ? theme.accent.blue : theme.surface.primary,
    color: role === 'user' ? theme.text.inverted : theme.text.primary,
    fontSize: '14px',
    lineHeight: 1.5,
    wordWrap: 'break-word',
  });

  const inputContainerStyles: React.CSSProperties = {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
  };

  const suggestionsStyles: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginBottom: '16px',
  };

  const suggestionButtonStyles: React.CSSProperties = {
    background: theme.surface.tertiary,
    border: `1px solid ${theme.border.primary}`,
    borderRadius: '20px',
    padding: '6px 12px',
    fontSize: '12px',
    color: theme.text.secondary,
    cursor: 'pointer',
    transition: 'all 150ms ease',
  };

  return (
    <div style={containerStyles}>
      {/* Hero Section */}
      <div style={heroStyles}>
        <div style={logoStyles}>
          <Brain className="w-12 h-12" />
          EAILI5
        </div>
        
        <h1 style={taglineStyles}>
          Your AI-Powered Crypto Education Companion
        </h1>
        
        <p style={subtitleStyles}>
          Learn about crypto through real-time analysis and conversation. 
          Ask me anything about blockchain, DeFi, tokens, and more!
        </p>
        
        {/* Quick Action Buttons */}
        <div style={actionButtonsStyles}>
          <ProButton
            variant="primary"
            size="lg"
            onClick={() => setView('learn')}
            className="flex items-center gap-2"
          >
            <BookOpen className="w-5 h-5" />
            Start Learning
          </ProButton>
          
          <ProButton
            variant="secondary"
            size="lg"
            onClick={() => setView('portfolio')}
            className="flex items-center gap-2"
          >
            <Wallet className="w-5 h-5" />
            View Portfolio
          </ProButton>
        </div>
      </div>

      {/* Chat Interface */}
      <div style={chatContainerStyles}>
        <div style={messagesAreaStyles}>
          {messages.length === 0 ? (
            <div style={{ textAlign: 'center', color: theme.text.tertiary }}>
              <Brain className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p style={{ fontSize: '18px', marginBottom: '16px' }}>
                Welcome to EAILI5! I'm here to help you learn about crypto.
              </p>
              <p style={{ fontSize: '14px', marginBottom: '24px' }}>
                Try asking me something like:
              </p>
              <div style={suggestionsStyles}>
                {suggestedPrompts.map((prompt, index) => (
                  <button
                    key={index}
                    style={suggestionButtonStyles}
                    onClick={() => setInputMessage(prompt)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = theme.surface.primary;
                      e.currentTarget.style.color = theme.text.primary;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = theme.surface.tertiary;
                      e.currentTarget.style.color = theme.text.secondary;
                    }}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <div key={message.id} style={messageStyles(message.role)}>
                  <div style={messageBubbleStyles(message.role)}>
                    {message.role === 'assistant' ? (
                      <div 
                        dangerouslySetInnerHTML={{ 
                          __html: renderMarkdown(message.content) 
                        }} 
                      />
                    ) : (
                      message.content
                    )}
                  </div>
                </div>
              ))}
              
              {/* Suggestion Chips */}
              {suggestions.length > 0 && (
                <SuggestionChips 
                  suggestions={suggestions}
                  onSuggestionClick={handleSuggestionClick}
                />
              )}
              
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input Area */}
        <div style={inputContainerStyles}>
          <ProInput
            value={inputMessage}
            onChange={setInputMessage}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about crypto..."
            disabled={!isConnected || isStreaming || isAnalyzing}
            className="flex-1"
          />
          <ProButton
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isStreaming || isAnalyzing || !isConnected}
            className="flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            {isAnalyzing ? 'Analyzing...' : isStreaming ? 'Generating...' : 'Send'}
          </ProButton>
        </div>
      </div>
    </div>
  );
};

export default WelcomeLanding;
