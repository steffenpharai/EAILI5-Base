import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, TrendingUp, TrendingDown, Shield, Users, DollarSign, Brain } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigation } from '../contexts/NavigationContext';
import { useSession } from '../contexts/SessionContext';
import { useMobile } from '../hooks/useMobile';
import { useMobileChatInput } from '../hooks/useMobileLayout';
import { useChat } from '../hooks/useChat';
import { ProButton, ProBadge } from './pro';
import TradingChart from './TradingChart';
import SuggestionChips from './SuggestionChips';
import TokenSentiment from './EnhancedTokenSentiment';
// import FeedbackWidget from './FeedbackWidget'; // Removed - using FeedbackBar instead
import { Token } from '../hooks/useTokenData';

// Simple markdown renderer for basic formatting
const renderMarkdown = (text: string): string => {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br/>');
};

interface TokenAnalysisViewProps {
  token: Token | null;
  onAIMessageGenerated?: (messageId: string) => void;
}

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  agent?: string;
}

const TokenAnalysisView: React.FC<TokenAnalysisViewProps> = ({ token, onAIMessageGenerated }) => {
  const { theme } = useTheme();
  const { goHome } = useNavigation();
  const { sessionToken, isSessionReady } = useSession();
  const isMobile = useMobile();
  const { getInputStyles } = useMobileChatInput();
  const { sendMessageStream, isConnected, connect } = useChat();
  const [activeTab, setActiveTab] = useState<'chat' | 'learn' | 'insights'>('chat');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const isStreamingRef = useRef(false);

  // Connect WebSocket when session is ready
  useEffect(() => {
    if (isSessionReady && sessionToken) {
      console.log('TokenAnalysisView: Connecting WebSocket with session token:', sessionToken);
      try {
        connect(sessionToken);
      } catch (error) {
        console.error('TokenAnalysisView: Failed to connect WebSocket:', error);
      }
    }
  }, [isSessionReady, sessionToken, connect]);

  // Removed auto-analysis - only trigger on user action

  const analyzeToken = useCallback(async () => {
    if (!token || !sessionToken || !isSessionReady) {
      console.error('Missing token or session not ready:', { token: !!token, sessionToken: !!sessionToken, isSessionReady });
      return;
    }

    console.log('Starting token analysis with session token:', sessionToken);
    const analysisPrompt = `Analyze ${token.symbol} (${token.name}). 
    Price: $${token.price}, 24h change: ${token.priceChange24h}%, 
    Volume: $${token.volume24h.toLocaleString()}, 
    Market Cap: $${token.marketCap.toLocaleString()}, 
    Safety Score: ${token.safetyScore}/100. 
    Give me your honest analysis with predictions and educational insights.`;

    setIsAnalyzing(true);

    // Add analyzing message immediately (like ChatGPT)
    const analyzingMessage: Message = {
      id: `analyzing_${Date.now()}`,
      role: 'assistant',
      content: `Analyzing ${token.symbol} data...`,
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, analyzingMessage]);

    try {
      await sendMessageStream(
        analysisPrompt,
        'anonymous',
        sessionToken,
        (chunk: string) => {
          console.log('TokenAnalysisView received chunk:', JSON.stringify(chunk), 'Length:', chunk.length);
          setMessages(prev => {
            const updated = [...prev];
            const lastMessage = updated[updated.length - 1];
            
            // If we're still analyzing, remove analyzing message and add new AI message
            if (lastMessage && lastMessage.id.startsWith('analyzing_')) {
              updated.pop(); // Remove analyzing message
              updated.push({
                id: `ai_${Date.now()}`,
                role: 'assistant',
                content: chunk,
                timestamp: Date.now(),
              });
              setIsAnalyzing(false);
              setIsStreaming(true);
            } else if (lastMessage && lastMessage.role === 'assistant') {
              // Append chunk directly - no deduplication needed as backend sends clean tokens
              lastMessage.content += chunk;
            } else {
              // Create new assistant message
              updated.push({
                id: `ai_${Date.now()}`,
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
          
          // Remove the analyzing message completely (ChatGPT style - no persistent activity)
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
            content: `Analysis error: ${error}`,
            timestamp: Date.now(),
          }]);
        }
      );
    } catch (error: any) {
      setIsStreaming(false);
      setMessages(prev => [...prev, {
        id: `error_${Date.now()}`,
        role: 'assistant',
        content: `Analysis failed: ${error.message}`,
        timestamp: Date.now(),
      }]);
    }
  }, [token, sessionToken, isSessionReady, sendMessageStream]);

  const handleSendMessage = useCallback(async () => {
    if (!inputMessage.trim() || isStreaming || !isConnected || !token || !isSessionReady) return;
    
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
      await sendMessageStream(
        inputMessage,
        'anonymous',
        sessionToken,
        (chunk: string) => {
          console.log('TokenAnalysisView received chunk:', JSON.stringify(chunk), 'Length:', chunk.length);
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
          
          // Remove the analyzing message completely (ChatGPT style - no persistent activity)
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
            content: `Error: ${error}`,
            timestamp: Date.now(),
          }]);
        }
      );
    } catch (error: any) {
      setIsStreaming(false);
      setMessages(prev => [...prev, {
        id: `error_${Date.now()}`,
        role: 'assistant',
        content: `Error: ${error.message}`,
        timestamp: Date.now(),
      }]);
    }
  }, [inputMessage, isStreaming, isConnected, token, isSessionReady, sessionToken, sendMessageStream]);


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

  const formatCurrency = (value: number) => {
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
    return `$${value.toFixed(2)}`;
  };

  const formatNumber = (value: number) => {
    if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3) return `${(value / 1e3).toFixed(2)}K`;
    return value.toLocaleString();
  };

  const getSafetyColor = (score: number) => {
    if (score >= 80) return theme.accent.green;
    if (score >= 60) return theme.accent.orange;
    return theme.accent.red;
  };

  const containerStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    background: theme.background.primary,
    overflow: 'hidden',
  };

  const headerStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '20px',
    borderBottom: `1px solid ${theme.border.primary}`,
    background: theme.surface.primary,
  };

  const backButtonStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'transparent',
    border: `1px solid ${theme.border.primary}`,
    borderRadius: '8px',
    padding: '8px 16px',
    color: theme.text.secondary,
    cursor: 'pointer',
    transition: 'all 150ms ease',
  };

  const tokenInfoStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  };

  const mainContentStyles: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    overflow: 'hidden',
    marginBottom: '40px', // Reduced space for footer
    width: '100%', // Ensure full width
    minWidth: 0, // Allow flex items to shrink
  };

  const leftSectionStyles: React.CSSProperties = {
    flex: '0 0 65%',  // Increased back to give more space to chart
    display: 'flex',
    flexDirection: 'column',
    padding: '12px',  // Reduced padding
    paddingBottom: '80px', // Reduced footer spacing
    borderRight: `1px solid ${theme.border.primary}`,
  };

  const rightSectionStyles: React.CSSProperties = {
    flex: '0 0 35%',  // Reduced to make more compact
    display: 'flex',
    flexDirection: 'column',
    padding: '12px',  // Reduced padding
    paddingBottom: '80px', // Reduced footer spacing
    minWidth: '250px', // Smaller minimum width
    overflow: 'visible', // Allow content to be visible
    width: '100%', // Ensure full width
  };

  const statsGridStyles: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '8px',  // Reduced gap
    marginBottom: '16px',  // Reduced margin
  };

  const statCardStyles: React.CSSProperties = {
    background: theme.surface.secondary,
    border: `1px solid ${theme.border.primary}`,
    borderRadius: '8px',
    padding: '12px',
  };

  const tabContainerStyles: React.CSSProperties = {
    display: 'flex',
    borderBottom: `1px solid ${theme.border.primary}`,
    marginBottom: '20px',
  };

  const tabButtonStyles: React.CSSProperties = {
    background: 'transparent',
    border: 'none',
    padding: '12px 20px',
    color: theme.text.secondary,
    cursor: 'pointer',
    borderBottom: '2px solid transparent',
    transition: 'all 150ms ease',
  };

  const activeTabStyles: React.CSSProperties = {
    color: theme.accent.blue,
    borderBottomColor: theme.accent.blue,
  };

  const chatAreaStyles: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  };

  const messagesAreaStyles: React.CSSProperties = {
    flex: 1,
    overflowY: 'auto',
    padding: '16px',
    background: theme.surface.secondary,
    borderRadius: '8px',
    marginBottom: '16px',
    border: `1px solid ${theme.border.primary}`,
  };

  const messageStyles = (role: string): React.CSSProperties => ({
    marginBottom: '12px',
    display: 'flex',
    justifyContent: role === 'user' ? 'flex-end' : 'flex-start',
  });

  const messageBubbleStyles = (role: string): React.CSSProperties => ({
    maxWidth: window.innerWidth < 768 ? '90%' : '80%',
    padding: window.innerWidth < 768 ? '16px 20px' : '12px 16px', // Better mobile padding
    borderRadius: role === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
    background: role === 'user' ? theme.accent.blue : theme.surface.primary,
    color: role === 'user' ? theme.text.inverted : theme.text.primary,
    fontSize: window.innerWidth < 768 ? '16px' : '14px', // 16px prevents iOS zoom
    lineHeight: 1.5, // Better readability
    minHeight: window.innerWidth < 768 ? '44px' : 'auto', // Touch-friendly minimum height
    // Enhanced mobile animations
    animation: window.innerWidth < 768 ? 'slideInUp 0.3s ease-out' : 'none',
    // Better touch targets
    touchAction: 'manipulation',
    WebkitTapHighlightColor: 'transparent',
    // Improved spacing
    marginBottom: window.innerWidth < 768 ? '16px' : '12px',
    // Better text wrapping
    wordWrap: 'break-word',
    overflowWrap: 'break-word',
  });

  const inputContainerStyles: React.CSSProperties = {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    // Mobile optimizations using mobile layout system
    ...(isMobile && getInputStyles(true)), // Use sticky positioning
  };

  // Always show full dashboard - removed simplified token-optional view
  // if (!token) {
  //   return (
      <div style={containerStyles}>
        {/* Simplified header for general crypto learning */}
        <div style={headerStyles}>
          <button style={backButtonStyles} onClick={goHome}>
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </button>
          
          <div style={tokenInfoStyles}>
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: theme.text.primary }}>
                Crypto Learning Assistant
              </h2>
              <p style={{ fontSize: '14px', color: theme.text.secondary, margin: '4px 0 0 0' }}>
                Ask me anything about cryptocurrency
              </p>
            </div>
            <ProBadge variant="bullish">
              <Brain className="w-3 h-3" />
              AI Powered
            </ProBadge>
          </div>
        </div>

        {/* Main Content - Mobile-first layout */}
        <div style={{
          ...mainContentStyles,
          flexDirection: isMobile ? 'column' : 'row',
        }}>
          {/* Left Section - General crypto info or chart placeholder */}
          <div style={{
            ...leftSectionStyles,
            flex: isMobile ? 'none' : '0 0 60%',
            padding: isMobile ? '16px' : '20px',
            borderRight: isMobile ? 'none' : `1px solid ${theme.border.primary}`,
            borderBottom: isMobile ? `1px solid ${theme.border.primary}` : 'none',
          }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              textAlign: 'center',
              color: theme.text.tertiary,
              padding: '20px',
            }}>
              <Brain className="w-16 h-16 mb-4" style={{ color: theme.accent.blue }} />
              <h3 style={{ fontSize: '18px', marginBottom: '8px', color: theme.text.primary }}>
                General Crypto Learning
              </h3>
              <p style={{ fontSize: '14px', lineHeight: '1.5', marginBottom: '16px' }}>
                Ask me about any cryptocurrency topic, blockchain technology, or trading concepts.
              </p>
              <ProButton
                variant="primary"
                size="lg"
                onClick={() => {
                  setInputMessage("Explain cryptocurrency to me like I'm 5 years old");
                  setTimeout(() => handleSendMessage(), 100);
                }}
                disabled={isStreaming || isAnalyzing || !isConnected}
                className="flex items-center gap-2"
              >
                <Brain className="w-4 h-4" />
                Start Learning
              </ProButton>
            </div>
          </div>

          {/* Right Section - Chat Interface */}
          <div style={{
            ...rightSectionStyles,
            flex: isMobile ? '1' : '0 0 40%',
            padding: isMobile ? '16px' : '20px',
          }}>
            {/* General crypto stats or info */}
            <div style={statsGridStyles}>
              <div style={statCardStyles}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <Brain className="w-4 h-4" style={{ color: theme.accent.blue }} />
                  <span style={{ fontSize: '12px', color: theme.text.secondary }}>AI Learning</span>
                </div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: theme.text.primary }}>
                  Always On
                </div>
              </div>

              <div style={statCardStyles}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <TrendingUp className="w-4 h-4" style={{ color: theme.accent.green }} />
                  <span style={{ fontSize: '12px', color: theme.text.secondary }}>Topics</span>
                </div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: theme.text.primary }}>
                  Unlimited
                </div>
              </div>
            </div>

            {/* Chat Interface */}
            <div style={chatAreaStyles}>
              <div style={messagesAreaStyles}>
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
                
                {/* Suggestion Chips for general topics */}
                {suggestions.length > 0 && (
                  <SuggestionChips 
                    suggestions={suggestions}
                    onSuggestionClick={handleSuggestionClick}
                  />
                )}
              </div>

              <div style={inputContainerStyles}>
                <textarea
                  value={inputMessage}
                  onChange={(e) => {
                    setInputMessage(e.target.value);
                    // Auto-resize
                    e.target.style.height = 'auto';
                    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                  }}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything about crypto..."
                  disabled={!isConnected || isStreaming || isAnalyzing}
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    border: `1px solid ${theme.border.primary}`,
                    borderRadius: '8px',
                    background: theme.surface.primary,
                    color: theme.text.primary,
                    fontSize: '16px',
                    fontFamily: 'Inter, system-ui, sans-serif',
                    minHeight: '44px',
                    maxHeight: '120px',
                    resize: 'none',
                    overflow: 'hidden',
                    lineHeight: '1.5',
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                  rows={1}
                />
                <ProButton
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isStreaming || isAnalyzing || !isConnected}
                  size="sm"
                  style={{
                    minHeight: '44px',
                    minWidth: '44px',
                  }}
                >
                  {isAnalyzing ? 'Analyzing...' : isStreaming ? 'Generating...' : 'Send'}
                </ProButton>
              </div>
            </div>
          </div>
        </div>
  //    </div>
  //  );
  // }

  return (
    <div style={containerStyles}>
      {/* Header */}
      <div style={headerStyles}>
        <button style={backButtonStyles} onClick={goHome}>
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>
        
        <div style={tokenInfoStyles}>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: theme.text.primary }}>
              {token ? `${token.name} (${token.symbol})` : 'Crypto Learning Assistant'}
            </h2>
            <p style={{ fontSize: '14px', color: theme.text.secondary, margin: '4px 0 0 0' }}>
              {token ? 'Base • Ethereum L2' : 'Ask me anything about cryptocurrency'}
            </p>
          </div>
          {token ? (
            <ProBadge variant={token.priceChange24h >= 0 ? 'bullish' : 'bearish'}>
              {token.priceChange24h >= 0 ? '+' : ''}{token.priceChange24h.toFixed(2)}%
            </ProBadge>
          ) : (
            <ProBadge variant="bullish">
              <Brain className="w-3 h-3" />
              AI Powered
            </ProBadge>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div style={mainContentStyles}>
        {/* Left Section - Chart */}
        <div style={leftSectionStyles}>
          <TradingChart token={token} />
          <TokenSentiment 
            tokenAddress={token?.address || ''} 
            tokenSymbol={token?.symbol || 'Crypto'} 
          />
        </div>

        {/* Right Section - Stats & Chat */}
        <div style={rightSectionStyles}>
          {/* Token Stats */}
          <div style={statsGridStyles}>
            <div style={statCardStyles}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <DollarSign className="w-4 h-4" style={{ color: theme.accent.blue }} />
                <span style={{ fontSize: '12px', color: theme.text.secondary }}>Price</span>
              </div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: theme.text.primary }}>
                {token ? formatCurrency(token.price) : 'N/A'}
              </div>
            </div>

            <div style={statCardStyles}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <TrendingUp className="w-4 h-4" style={{ color: theme.accent.green }} />
                <span style={{ fontSize: '12px', color: theme.text.secondary }}>Volume 24h</span>
              </div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: theme.text.primary }}>
                {token ? formatCurrency(token.volume24h) : 'N/A'}
              </div>
            </div>

            <div style={statCardStyles}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <TrendingUp className="w-4 h-4" style={{ color: theme.accent.blue }} />
                <span style={{ fontSize: '12px', color: theme.text.secondary }}>Market Cap</span>
              </div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: theme.text.primary }}>
                {token ? formatCurrency(token.marketCap) : 'N/A'}
              </div>
            </div>

            <div style={statCardStyles}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <Shield className="w-4 h-4" style={{ color: token ? getSafetyColor(token.safetyScore) : theme.text.tertiary }} />
                <span style={{ fontSize: '12px', color: theme.text.secondary }}>Safety Score</span>
              </div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: token ? getSafetyColor(token.safetyScore) : theme.text.tertiary }}>
                {token ? `${token.safetyScore}/100` : 'N/A'}
              </div>
            </div>

            <div style={statCardStyles}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <Users className="w-4 h-4" style={{ color: theme.accent.orange }} />
                <span style={{ fontSize: '12px', color: theme.text.secondary }}>Holders</span>
              </div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: theme.text.primary }}>
                {token ? formatNumber(token.holders) : 'N/A'}
              </div>
            </div>

            <div style={statCardStyles}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <TrendingDown className="w-4 h-4" style={{ color: theme.accent.purple }} />
                <span style={{ fontSize: '12px', color: theme.text.secondary }}>Liquidity</span>
              </div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: theme.text.primary }}>
                {token ? formatCurrency(token.liquidity) : 'N/A'}
              </div>
            </div>
          </div>

          {/* Analyze Button */}
          <div style={{ marginBottom: '20px', textAlign: 'center' }}>
            <ProButton
              variant="primary"
              size="lg"
              onClick={analyzeToken}
              disabled={isStreaming || !sessionToken}
              className="flex items-center gap-2"
            >
              {isStreaming ? 'Analyzing...' : token ? `Analyze ${token.symbol}` : 'Analyze Crypto'}
            </ProButton>
          </div>

          {/* Tabs */}
          <div style={tabContainerStyles}>
            <button
              style={{
                ...tabButtonStyles,
                ...(activeTab === 'chat' ? activeTabStyles : {}),
              }}
              onClick={() => setActiveTab('chat')}
            >
              AI Chat
            </button>
            <button
              style={{
                ...tabButtonStyles,
                ...(activeTab === 'learn' ? activeTabStyles : {}),
              }}
              onClick={() => setActiveTab('learn')}
            >
              Learn
            </button>
            <button
              style={{
                ...tabButtonStyles,
                ...(activeTab === 'insights' ? activeTabStyles : {}),
              }}
              onClick={() => setActiveTab('insights')}
            >
              Insights
            </button>
          </div>

          {/* Tab Content */}
          <div style={chatAreaStyles}>
            {activeTab === 'chat' && (
              <>
                <div style={messagesAreaStyles}>
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
                </div>

                <div style={inputContainerStyles}>
                  <textarea
                    value={inputMessage}
                    onChange={(e) => {
                      setInputMessage(e.target.value);
                      // Auto-resize
                      e.target.style.height = 'auto';
                      e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                    }}
                    onKeyPress={handleKeyPress}
                    placeholder={token ? `Ask about ${token.symbol}...` : 'Ask about any cryptocurrency...'}
                    disabled={!isConnected || isStreaming || isAnalyzing}
                    style={{
                      flex: 1,
                      padding: '12px 16px', // Touch-friendly padding
                      border: `1px solid ${theme.border.primary}`,
                      borderRadius: '8px',
                      background: theme.surface.primary,
                      color: theme.text.primary,
                      fontSize: '16px', // Prevent iOS zoom
                      fontFamily: 'Inter, system-ui, sans-serif',
                      minHeight: '44px', // Minimum touch target
                      maxHeight: '120px', // Max height before scroll
                      resize: 'none',
                      overflow: 'hidden',
                      lineHeight: '1.5',
                      // Enhanced mobile support
                      touchAction: 'manipulation',
                      WebkitTapHighlightColor: 'transparent',
                    }}
                    rows={1}
                  />
                  <ProButton
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || isStreaming || isAnalyzing || !isConnected}
                    size="sm"
                    style={{
                      minHeight: '44px',
                      minWidth: '44px',
                    }}
                  >
                    {isAnalyzing ? 'Analyzing...' : isStreaming ? 'Generating...' : 'Send'}
                  </ProButton>
                </div>
              </>
            )}

            {activeTab === 'learn' && (
              <div style={{ padding: '20px', textAlign: 'center', color: theme.text.secondary }}>
                <h3>Learning content about {token ? token.symbol : 'cryptocurrency'}</h3>
                <p>Educational content coming soon...</p>
              </div>
            )}

            {activeTab === 'insights' && (
              <div style={{ padding: '20px', textAlign: 'center', color: theme.text.secondary }}>
                <h3>AI Insights for {token ? token.symbol : 'cryptocurrency'}</h3>
                <p>Advanced analysis coming soon...</p>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default TokenAnalysisView;
