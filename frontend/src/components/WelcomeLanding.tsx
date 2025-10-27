import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BookOpen, Wallet, Send } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigation } from '../contexts/NavigationContext';
import { useSession } from '../contexts/SessionContext';
import { useMobile } from '../hooks/useMobile';
import { useChat } from '../hooks/useChat';
import { ProButton, ProInput } from './pro';
import SuggestionChips from './SuggestionChips';
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
  const messagesAreaRef = useRef<HTMLDivElement>(null); // Ref for auto-scrolling messages container

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

  // Auto-scroll messages area to bottom when new messages arrive
  useEffect(() => {
    if (messagesAreaRef.current) {
      messagesAreaRef.current.scrollTop = messagesAreaRef.current.scrollHeight;
    }
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
    "What are the risks of crypto investing?",
    "How do I start trading on Base?",
    "What is a blockchain and how does it work?",
    "How do I keep my crypto safe?",
    "What are the differences between Bitcoin and Ethereum?"
  ];

  const containerStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    maxHeight: '100%', // Prevent expansion beyond parent
    width: '100%',
    overflow: 'hidden',
    position: 'relative',
    margin: 0,
    padding: 0,
    paddingBottom: 0, // ✅ Explicit no bottom padding
    marginBottom: 0, // ✅ Explicit no bottom margin
  };


  const chatInputContainerStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: '12px',
    flexShrink: 0,
    background: theme.surface.primary,
    borderTop: `1px solid ${theme.border.primary}`,
    padding: '16px',
    paddingBottom: '16px', // ✅ Explicit bottom padding
    width: '100%',
    marginBottom: 0, // ✅ Ensure no bottom margin
  };






  const chatContainerStyles: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    padding: '0',
    overflow: 'hidden',
    minHeight: 0, // Critical for flex containment
    maxHeight: '100%', // Prevent expansion
    margin: '0',
    marginTop: '16px',
    marginBottom: 0,
    background: 'transparent',
    border: 'none',
    borderRadius: '0',
    boxShadow: 'none',
    width: '100%',
  };

  const messagesAreaStyles: React.CSSProperties = {
    flex: 1,
    overflowY: 'auto',
    padding: '0 24px 0 24px',  // ✅ Remove bottom padding - input is sticky
    paddingBottom: 0, // ✅ Explicit no bottom padding
    margin: '0',
    background: 'transparent',
    borderRadius: '0',
    marginBottom: '0',
    border: 'none',
    boxShadow: 'none',
    minHeight: 'auto',
    width: '100%',
  };

  const messageStyles = (role: string, isLast: boolean = false): React.CSSProperties => ({
    marginBottom: isLast ? '0' : '16px', // ✅ No bottom margin on last message
    display: 'flex',
    justifyContent: role === 'user' ? 'flex-end' : 'flex-start',
  });

  const messageBubbleStyles = (role: string): React.CSSProperties => ({
    maxWidth: isMobile ? '85%' : '70%',
    padding: isMobile ? '12px 14px' : '12px 16px',
    borderRadius: '12px',
    background: role === 'user' ? theme.accent.blue : theme.surface.primary,
    color: role === 'user' ? theme.text.inverted : theme.text.primary,
    fontSize: isMobile ? '14px' : '15px',
    lineHeight: 1.5,
    wordWrap: 'break-word',
    minHeight: isMobile ? '44px' : 'auto',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    border: `1px solid ${role === 'user' ? 'rgba(59, 130, 246, 0.2)' : theme.border.primary}`,
    touchAction: 'manipulation',
    WebkitTapHighlightColor: 'transparent',
  });




  return (
    <div style={containerStyles}>
      {/* Single Unified Chat Interface */}
      <div style={chatContainerStyles}>
        <div style={messagesAreaStyles} ref={messagesAreaRef}>
          {messages.length === 0 ? (
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center',
                height: '100%',
                textAlign: 'center',
                padding: isMobile ? '40px 20px' : '8px 24px'  // ✅ Further reduced desktop padding for compact layout
              }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', height: isMobile ? '50px' : '60px' }}>
                <img 
                  src="/EAILI5.png" 
                  alt="EAILI5" 
                  style={{ 
                    width: isMobile ? '160px' : '220px', 
                    height: isMobile ? '50px' : '60px',
                    marginBottom: '0',
                    filter: theme.name === 'dark' ? 'invert(1) brightness(1.2) contrast(1.1)' : 'none',
                    transition: 'filter 0.2s ease',
                    objectFit: 'cover',
                    objectPosition: 'center'
                  }} 
                />
              </div>
              
              {/* Base Batches Builder Track Statement */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginBottom: isMobile ? '8px' : '16px',
                padding: isMobile ? '4px 10px' : '8px 16px',
                background: `${theme.accent.blue}15`,
                border: `1px solid ${theme.accent.blue}30`,
                borderRadius: '20px',
                fontSize: isMobile ? '11px' : '14px',
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
                fontSize: isMobile ? '16px' : '32px',  // 20% reduction
                fontWeight: '700', 
                color: theme.text.primary,
                marginBottom: isMobile ? '8px' : '12px',
                fontFamily: 'Inter, system-ui, sans-serif',
                lineHeight: 1.2,
                letterSpacing: '-0.01em'
              }}>
                Your AI-Powered Crypto Education Companion
              </h1>
              
              <p style={{ 
                fontSize: isMobile ? '13px' : '18px',  // 19% reduction
                color: theme.text.secondary,
                marginBottom: isMobile ? '16px' : '24px',
                maxWidth: '700px',
                lineHeight: isMobile ? 1.4 : 1.6,  // Tighter line height
                fontFamily: 'Inter, system-ui, sans-serif'
              }}>
                Learn about crypto through real-time analysis and conversation. 
                Ask me anything about blockchain, DeFi, tokens, and more! 
                {!isMobile && ' Click any token on the left to get personalized AI insights and analysis.'}
              </p>

              {/* Quick action buttons removed - redundant with TopBar navigation */}



              <div style={{
                marginTop: isMobile ? '16px' : '24px',
                padding: isMobile ? '12px 12px' : '20px',
                background: theme.surface.primary,
                borderRadius: '12px',
                border: `1px solid ${theme.border.primary}`,
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                maxWidth: '800px',
                width: '100%'
              }}>
                <h3 style={{
                  fontSize: isMobile ? '15px' : '18px',
                  fontWeight: '600',
                  color: theme.text.primary,
                  marginBottom: isMobile ? '10px' : '16px',
                  textAlign: 'center',
                  fontFamily: 'Inter, system-ui, sans-serif'
                }}>
                  Get Started with These Questions
                </h3>
                <p style={{
                  fontSize: isMobile ? '12px' : '14px',
                  color: theme.text.secondary,
                  marginBottom: '16px',  // ✅ Reduced spacing for compact layout
                  textAlign: 'center',
                  fontFamily: 'Inter, system-ui, sans-serif'
                }}>
                  Click any question below to start a conversation
                </p>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',  // ✅ 2 columns on mobile, 3 columns on desktop
                  gap: isMobile ? '6px' : '8px',  // ✅ Further reduced gap for compact layout
                  marginBottom: '0'
                }}>
                  {(isMobile ? suggestedPrompts.slice(0, 2) : suggestedPrompts).map((prompt, index) => (
                    <button
                      key={index}
                      style={{
                        background: theme.surface.secondary,
                        border: `1px solid ${theme.border.primary}`,
                        borderRadius: isMobile ? '6px' : '8px',  // ✅ Smaller border radius on mobile
                        padding: isMobile ? '6px 10px' : '12px 16px',  // ✅ Much smaller padding on mobile
                        fontSize: isMobile ? '12px' : '14px',  // ✅ Smaller font on mobile
                        color: theme.text.primary,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        textAlign: 'left',
                        minHeight: isMobile ? '32px' : '48px',  // ✅ Smaller min height on mobile
                        display: 'flex',
                        alignItems: 'center',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                        fontFamily: 'Inter, system-ui, sans-serif',
                        fontWeight: '500',
                        touchAction: 'manipulation',
                        WebkitTapHighlightColor: 'transparent',
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
              {messages.map((message, index) => (
                <div key={message.id} style={messageStyles(message.role, index === messages.length - 1)}>
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
              
              <div ref={messagesEndRef} style={{ height: 0, margin: 0, padding: 0 }} />
            </>
          )}
        </div>

        {/* Input Area */}
        <div style={chatInputContainerStyles}>
          <ProInput
            value={inputMessage}
            onChange={setInputMessage}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about crypto..."
            disabled={!isConnected || isStreaming || isAnalyzing}
            style={{ flex: 1 }}  // ✅ Inline style to fill space
          />
          <ProButton
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isStreaming || isAnalyzing || !isConnected}
            style={{ 
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flexShrink: 0,  // ✅ Don't shrink button
            }}
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
