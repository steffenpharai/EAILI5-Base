import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Brain, BookOpen, Wallet, Send } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigation } from '../contexts/NavigationContext';
import { useSession } from '../contexts/SessionContext';
import { useMobile } from '../hooks/useMobile';
import { useChat } from '../hooks/useChat';
import { ProButton, ProInput } from './pro';
import SuggestionChips from './SuggestionChips';
import Footer from './Footer';
// import FeedbackWidget from './FeedbackWidget'; // Removed - using FeedbackBar instead

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

interface WelcomeLandingProps {
  onAIMessageGenerated?: (messageId: string) => void;
}

const WelcomeLanding: React.FC<WelcomeLandingProps> = ({ onAIMessageGenerated }) => {
  const { theme } = useTheme();
  const { setView } = useNavigation();
  const { sessionToken, isSessionReady } = useSession();
  const isMobile = useMobile();
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
      await sendMessageStream(
        inputMessage,
        'anonymous',
        sessionToken,
        (chunk: string) => {
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
    background: 'transparent',
    overflow: 'hidden',
    padding: '0',
    margin: '0',
    width: '100%',
    paddingBottom: '32px', // Account for fixed footer
  };

  const heroStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: window.innerWidth < 768 ? '40px 24px' : '60px 32px',
    textAlign: 'center',
    background: `linear-gradient(135deg, ${theme.background.primary} 0%, ${theme.background.secondary} 100%)`,
    flex: '0 0 auto',
    margin: '0',
    position: 'relative',
    borderBottom: `1px solid ${theme.border.primary}`,
  };

  const logoStyles: React.CSSProperties = {
    fontSize: window.innerWidth < 768 ? '40px' : '56px',
    fontWeight: 800,
    color: theme.accent.blue,
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    letterSpacing: '-0.02em',
  };

  const taglineStyles: React.CSSProperties = {
    fontSize: window.innerWidth < 768 ? '28px' : '36px',
    fontWeight: 700,
    color: theme.text.primary,
    marginBottom: '20px',
    lineHeight: 1.2,
    letterSpacing: '-0.01em',
  };

  const subtitleStyles: React.CSSProperties = {
    fontSize: '18px',
    color: theme.text.secondary,
    marginBottom: '40px',
    maxWidth: '700px',
    lineHeight: 1.6,
    fontWeight: 400,
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
    padding: '0',
    overflow: 'hidden',
    minHeight: '0',
    margin: '0',
    background: 'transparent',
    border: 'none',
    borderRadius: '0',
    boxShadow: 'none',
    marginTop: '16px',
    width: '100%',
  };

  const messagesAreaStyles: React.CSSProperties = {
    flex: 1,
    overflowY: 'auto',
    padding: '0 24px 16px 24px',
    margin: '0',
    background: 'transparent',
    borderRadius: '0',
    marginBottom: '0',
    border: 'none',
    boxShadow: 'none',
    minHeight: 'auto',
    width: '100%',
  };

  const messageStyles = (role: string): React.CSSProperties => ({
    marginBottom: '16px',
    display: 'flex',
    justifyContent: role === 'user' ? 'flex-end' : 'flex-start',
  });

  const messageBubbleStyles = (role: string): React.CSSProperties => ({
    maxWidth: isMobile ? '90%' : '70%',
    padding: isMobile ? '16px 20px' : '12px 16px',
    borderRadius: role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
    background: role === 'user' ? theme.accent.blue : theme.surface.primary,
    color: role === 'user' ? theme.text.inverted : theme.text.primary,
    fontSize: isMobile ? '16px' : '15px',
    lineHeight: 1.5,
    wordWrap: 'break-word',
    minHeight: isMobile ? '44px' : 'auto',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    border: `1px solid ${role === 'user' ? 'rgba(59, 130, 246, 0.2)' : theme.border.primary}`,
    touchAction: 'manipulation',
    WebkitTapHighlightColor: 'transparent',
  });

  const inputContainerStyles: React.CSSProperties = {
    display: 'flex',
    gap: isMobile ? '8px' : '12px',
    alignItems: 'center',
    padding: isMobile ? '12px 16px' : '16px 24px',
    paddingBottom: isMobile 
      ? 'max(12px, env(safe-area-inset-bottom))' 
      : '16px',
    margin: '16px 0 0 0',
    background: isMobile ? theme.surface.primary : 'transparent',
    border: 'none',
    borderRadius: '0',
    boxShadow: 'none',
    width: '100%',
    maxWidth: 'none',
    minHeight: isMobile ? '60px' : 'auto',
    position: isMobile ? 'sticky' : 'static',
    bottom: isMobile ? '32px' : 'auto', // Account for footer height
    zIndex: isMobile ? 1000 : 'auto',
    borderTop: isMobile ? `1px solid ${theme.border.primary}` : 'none',
  };

  const suggestionsStyles: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: window.innerWidth < 768 ? '1fr' : 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '12px',
    marginBottom: '0',
    padding: '0',
    margin: '0',
  };

  const suggestionButtonStyles: React.CSSProperties = {
    background: theme.surface.tertiary,
    border: `1px solid ${theme.border.primary}`,
    borderRadius: '8px',
    padding: '12px 20px',
    fontSize: '14px',
    color: theme.text.primary,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    textAlign: 'left',
    minHeight: '44px',
    display: 'flex',
    alignItems: 'center',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    margin: '0',
    fontWeight: '500',
  };

  return (
    <div style={containerStyles}>
      {/* Single Unified Chat Interface */}
      <div style={chatContainerStyles}>
        <div style={messagesAreaStyles}>
          {messages.length === 0 ? (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center',
              height: '100%',
              textAlign: 'center',
              padding: '60px 24px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <Brain className="w-12 h-12" style={{ color: theme.accent.blue }} />
                <span style={{ 
                  fontSize: '32px', 
                  fontWeight: '800', 
                  color: theme.accent.blue,
                  fontFamily: 'Inter, system-ui, sans-serif'
                }}>
                  EAILI5
                </span>
              </div>
              
              {/* Base Batches Builder Track Statement */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginBottom: '16px',
                padding: '8px 16px',
                background: `${theme.accent.blue}15`,
                border: `1px solid ${theme.accent.blue}30`,
                borderRadius: '20px',
                fontSize: '14px',
                color: theme.accent.blue,
                fontWeight: '500',
                fontFamily: 'Inter, system-ui, sans-serif'
              }}>
                <span>🏆</span>
                <span>
                  Competing in <a 
                    href="https://devfolio.co/projects/eaili-fc7a" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ 
                      color: theme.accent.blue, 
                      textDecoration: 'underline',
                      fontWeight: '600'
                    }}
                  >
                    Base Builder Track
                  </a>
                </span>
              </div>
              
              <h1 style={{ 
                fontSize: window.innerWidth < 768 ? '24px' : '32px', 
                fontWeight: '700', 
                color: theme.text.primary,
                marginBottom: '20px',
                fontFamily: 'Inter, system-ui, sans-serif',
                lineHeight: 1.2,
                letterSpacing: '-0.01em'
              }}>
                Your AI-Powered Crypto Education Companion
              </h1>
              
              <p style={{ 
                fontSize: '18px', 
                color: theme.text.secondary,
                marginBottom: '48px',
                maxWidth: '700px',
                lineHeight: 1.6,
                fontFamily: 'Inter, system-ui, sans-serif'
              }}>
                Learn about crypto through real-time analysis and conversation. 
                Ask me anything about blockchain, DeFi, tokens, and more! 
                Click any token on the left to get personalized AI insights and analysis.
              </p>

              {/* Quick Action Buttons */}
              <div style={{ 
                display: 'flex', 
                gap: '20px', 
                marginBottom: '48px',
                flexWrap: 'wrap',
                justifyContent: 'center'
              }}>
                <button
                  onClick={() => setView('learn')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '14px 28px',
                    background: theme.accent.blue,
                    color: theme.text.inverted,
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(59, 130, 246, 0.4)';
                  }}
                  onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
                  }}
                >
                  <BookOpen className="w-5 h-5" />
                  Start Learning
                </button>
                
                <button
                  onClick={() => setView('portfolio')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '14px 28px',
                    background: 'transparent',
                    color: theme.text.primary,
                    border: `1px solid ${theme.border.primary}`,
                    borderRadius: '10px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                  }}
                  onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
                  }}
                >
                  <Wallet className="w-5 h-5" />
                  View Portfolio
                </button>
              </div>



              <div style={{
                marginTop: '48px',
                padding: '32px',
                background: theme.surface.primary,
                borderRadius: '12px',
                border: `1px solid ${theme.border.primary}`,
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                maxWidth: '800px',
                width: '100%'
              }}>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: theme.text.primary,
                  marginBottom: '16px',
                  textAlign: 'center',
                  fontFamily: 'Inter, system-ui, sans-serif'
                }}>
                  Get Started with These Questions
                </h3>
                <p style={{
                  fontSize: '14px',
                  color: theme.text.secondary,
                  marginBottom: '24px',
                  textAlign: 'center',
                  fontFamily: 'Inter, system-ui, sans-serif'
                }}>
                  Click any question below to start a conversation
                </p>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: window.innerWidth < 768 ? '1fr' : 'repeat(2, 1fr)',
                  gap: '12px',
                  marginBottom: '0'
                }}>
                  {suggestedPrompts.map((prompt, index) => (
                    <button
                      key={index}
                      style={{
                        background: theme.surface.secondary,
                        border: `1px solid ${theme.border.primary}`,
                        borderRadius: '8px',
                        padding: '16px 20px',
                        fontSize: '14px',
                        color: theme.text.primary,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        textAlign: 'left',
                        minHeight: '48px',
                        display: 'flex',
                        alignItems: 'center',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                        fontFamily: 'Inter, system-ui, sans-serif',
                        fontWeight: '500'
                      }}
                      onClick={() => setInputMessage(prompt)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = theme.surface.primary;
                        e.currentTarget.style.color = theme.accent.blue;
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                        e.currentTarget.style.borderColor = theme.accent.blue;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = theme.surface.secondary;
                        e.currentTarget.style.color = theme.text.primary;
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
                        e.currentTarget.style.borderColor = theme.border.primary;
                      }}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
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
                  
                  {/* FeedbackWidget removed - now handled by FeedbackBar */}
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
      
      {/* Footer */}
      <Footer />
    </div>
  );
};

export default WelcomeLanding;
