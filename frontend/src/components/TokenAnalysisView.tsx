import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, TrendingUp, TrendingDown, Shield, Users, DollarSign, Brain } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigation } from '../contexts/NavigationContext';
import { useSession } from '../contexts/SessionContext';
import { useMobile } from '../hooks/useMobile';
import { useChat } from '../hooks/useChat';
import { ProButton, ProBadge } from './pro';
import { Z_INDEX } from '../utils/zIndex';
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
  const { sendMessageStream, isConnected, connect } = useChat();
  const isMobile = useMobile();
  const [activeTab, setActiveTab] = useState<'chart' | 'chat' | 'learn' | 'insights'>('chat');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSentiment, setShowSentiment] = useState(false);
  const isStreamingRef = useRef(false);
  const messagesAreaRef = useRef<HTMLDivElement>(null); // Ref for auto-scrolling messages container

  // Connect WebSocket when session is ready
  useEffect(() => {
    if (isSessionReady && sessionToken) {
      try {
        connect(sessionToken);
      } catch (error) {
        console.error('TokenAnalysisView: Failed to connect WebSocket:', error);
      }
    }
  }, [isSessionReady, sessionToken, connect]);

  // Auto-scroll messages area to bottom when new messages arrive
  useEffect(() => {
    if (messagesAreaRef.current) {
      messagesAreaRef.current.scrollTop = messagesAreaRef.current.scrollHeight;
    }
  }, [messages]);

  // Removed auto-analysis - only trigger on user action

  const analyzeToken = useCallback(async () => {
    if (!token || !sessionToken || !isSessionReady) {
      console.error('Missing token or session not ready:', { token: !!token, sessionToken: !!sessionToken, isSessionReady });
      return;
    }

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
      setIsAnalyzing(false);
      isStreamingRef.current = false; // Reset streaming flag
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
    maxHeight: '100%', // Prevent expansion beyond parent
    background: theme.background.primary,
    overflow: 'hidden',
  };

  const headerStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: isMobile ? '8px 12px' : '20px',
    borderBottom: `1px solid ${theme.border.primary}`,
    background: theme.surface.primary,
  };

  const backButtonStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: isMobile ? '4px' : '8px',
    background: 'transparent',
    border: `1px solid ${theme.border.primary}`,
    borderRadius: isMobile ? '6px' : '8px',
    padding: isMobile ? '4px 8px' : '8px 16px',
    color: theme.text.secondary,
    cursor: 'pointer',
    transition: 'all 150ms ease',
    fontSize: isMobile ? '12px' : '14px',
  };

  const tokenInfoStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  };

  const mainContentStyles: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    flexDirection: isMobile ? 'column' : 'row',  // ✅ Mobile: column, Desktop: row
    overflow: isMobile ? 'auto' : 'hidden',  // ✅ Scroll on mobile, fixed on desktop
    marginBottom: 0, // ✅ REMOVE: No bottom margin
    width: '100%', // Ensure full width
    minWidth: 0, // Allow flex items to shrink
    height: isMobile ? 'auto' : '100%',  // ✅ Auto height on mobile allows natural stacking
    WebkitOverflowScrolling: 'touch',  // ✅ Smooth scrolling on iOS
  };

  const leftSectionStyles: React.CSSProperties = {
    flex: isMobile ? 'none' : '0 0 65%',  // ✅ Don't flex on mobile
    display: 'flex',
    flexDirection: 'column',
    padding: isMobile ? '16px' : '12px',  // ✅ Larger mobile padding
    paddingBottom: isMobile ? '16px' : '12px',
    borderRight: isMobile ? 'none' : `1px solid ${theme.border.primary}`,  // ✅ No border on mobile
    overflow: isMobile ? 'visible' : 'hidden',
    height: isMobile ? 'auto' : '100%',
    gap: isMobile ? '20px' : '16px',  // ✅ Larger mobile gap
    minHeight: isMobile ? '280px' : 'auto', // ✅ Ensure minimum height for chart
  };

  const rightSectionStyles: React.CSSProperties = {
    flex: isMobile ? 'none' : '0 0 35%',  // ✅ Don't flex on mobile
    display: 'flex',
    flexDirection: 'column',
    padding: isMobile ? '16px' : '12px',  // ✅ Larger mobile padding
    paddingBottom: isMobile ? '16px' : '12px',
    minWidth: isMobile ? 'auto' : '250px',  // ✅ No min width on mobile
    overflow: isMobile ? 'visible' : 'hidden',  // ✅ Visible on mobile for natural flow
    height: isMobile ? 'auto' : '100%',  // ✅ Auto height on mobile
    width: '100%',
  };

  const statsGridStyles: React.CSSProperties = {
    display: isMobile ? 'flex' : 'grid',
    gridTemplateColumns: isMobile ? 'none' : 'repeat(2, 1fr)',
    flexDirection: isMobile ? 'row' : undefined,
    overflowX: isMobile ? 'auto' : 'visible',
    gap: isMobile ? '8px' : '8px',
    marginBottom: isMobile ? '12px' : '16px',
    WebkitOverflowScrolling: 'touch',
    scrollbarWidth: 'none', // Firefox
    msOverflowStyle: 'none', // IE/Edge
  };

  const statCardStyles: React.CSSProperties = {
    background: theme.surface.secondary,
    border: `1px solid ${theme.border.primary}`,
    borderRadius: '8px',
    padding: isMobile ? '10px 8px' : '12px',
    minHeight: isMobile ? '65px' : 'auto',
    minWidth: isMobile ? '100px' : 'auto',
    flexShrink: isMobile ? 0 : undefined,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  };

  const mobileTabContainerStyles: React.CSSProperties = {
    display: 'flex',
    borderBottom: `1px solid ${theme.border.primary}`,
    marginBottom: '20px',
    background: theme.surface.primary,
    borderRadius: '8px',
    padding: '4px',
    gap: '4px',
  };

  const desktopTabContainerStyles: React.CSSProperties = {
    display: 'flex',
    borderBottom: `1px solid ${theme.border.primary}`,
    marginBottom: '16px',
    gap: '0',
  };

  const mobileTabButtonStyles: React.CSSProperties = {
    background: 'transparent',
    border: 'none',
    padding: '12px 16px',
    color: theme.text.secondary,
    cursor: 'pointer',
    borderRadius: '6px',
    transition: 'all 150ms ease',
    flex: 1,
    fontSize: '14px',
    fontWeight: '500',
    minHeight: '44px',
    touchAction: 'manipulation',
    WebkitTapHighlightColor: 'transparent',
  };

  const desktopTabButtonStyles: React.CSSProperties = {
    background: 'transparent',
    border: 'none',
    padding: '12px 20px',
    color: theme.text.secondary,
    cursor: 'pointer',
    borderBottom: '2px solid transparent',
    transition: 'all 150ms ease',
    fontSize: '16px',
    fontWeight: '500',
    minHeight: '44px',
  };

  const mobileActiveTabStyles: React.CSSProperties = {
    color: theme.text.primary,
    background: theme.surface.secondary,
    fontWeight: '600',
  };

  const desktopActiveTabStyles: React.CSSProperties = {
    color: theme.text.primary,
    borderBottomColor: theme.accent.blue,
    fontWeight: '600',
  };

  const chatAreaStyles: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    minHeight: 0, // Critical for flex containment
    maxHeight: '100%', // Prevent expansion
  };

  const messagesAreaStyles: React.CSSProperties = {
    flex: 1,
    overflowY: 'auto',
    padding: '16px',
    background: theme.surface.secondary,
    borderRadius: '8px',
    marginBottom: 0, // ✅ Remove bottom margin to prevent footer jumping
    border: `1px solid ${theme.border.primary}`,
  };

  const messageStyles = (role: string, isLast: boolean = false): React.CSSProperties => ({
    marginBottom: isLast ? '0' : '12px', // ✅ No bottom margin on last message
    display: 'flex',
    justifyContent: role === 'user' ? 'flex-end' : 'flex-start',
  });

  const messageBubbleStyles = (role: string): React.CSSProperties => ({
    maxWidth: isMobile ? '85%' : '80%',
    padding: isMobile ? '12px 14px' : '12px 16px',
    borderRadius: '12px',
    background: role === 'user' ? theme.accent.blue : theme.surface.primary,
    color: role === 'user' ? theme.text.inverted : theme.text.primary,
    fontSize: isMobile ? '14px' : '15px',
    lineHeight: 1.5, // Better readability
    minHeight: window.innerWidth < 768 ? '44px' : 'auto', // Touch-friendly minimum height
    // Enhanced mobile animations
    animation: window.innerWidth < 768 ? 'slideInUp 0.3s ease-out' : 'none',
    // Better touch targets
    touchAction: 'manipulation',
    WebkitTapHighlightColor: 'transparent',
    // ✅ Remove marginBottom from bubble - spacing handled by messageStyles
    marginBottom: 0,
    // Better text wrapping
    wordWrap: 'break-word',
    overflowWrap: 'break-word',
  });

  const inputContainerStyles: React.CSSProperties = {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    // Mobile optimizations
  };

  // Always show full dashboard - removed simplified token-optional view

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
            <h2 style={{ fontSize: isMobile ? '14px' : '24px', fontWeight: 700, margin: 0, color: theme.text.primary }}>
              {token ? `${token.name} (${token.symbol})` : 'Crypto Learning Assistant'}
            </h2>
            <p style={{ fontSize: isMobile ? '10px' : '14px', color: theme.text.secondary, margin: isMobile ? '1px 0 0 0' : '4px 0 0 0' }}>
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

      {/* Mobile tabs removed - using single scrollable view */}

      {/* Mobile: Floating Sentiment Toggle Button */}
      {isMobile && (
        <button
          onClick={() => setShowSentiment(!showSentiment)}
          style={{
            position: 'fixed',
            bottom: '16px',
            right: '16px',
            zIndex: Z_INDEX.fab,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '48px',
            height: '48px',
            background: showSentiment ? theme.accent.blue : theme.surface.secondary,
            borderRadius: '50%',
            border: `1px solid ${theme.border.primary}`,
            cursor: 'pointer',
            boxShadow: showSentiment ? '0 4px 12px rgba(59, 130, 246, 0.3)' : '0 4px 12px rgba(0, 0, 0, 0.1)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <Brain className="w-5 h-5" style={{ color: showSentiment ? theme.text.inverted : theme.text.primary }} />
        </button>
      )}

      {/* Main Content */}
      <div style={mainContentStyles}>
        {/* Left Section - Chart (Desktop) / Always visible (Mobile) */}
        <div style={leftSectionStyles}>
          <TradingChart token={token} />
          
          
          {/* TokenSentiment - Always show on desktop, conditional on mobile */}
          {(!isMobile || showSentiment) && (
            <TokenSentiment 
              tokenAddress={token?.address || ''} 
              tokenSymbol={token?.symbol || 'Crypto'} 
            />
          )}
        </div>

        {/* Right Section - Stats & Chat (Desktop) / Always visible (Mobile) */}
        <div style={rightSectionStyles}>
          {/* Token Stats - Always visible */}
          <div style={statsGridStyles}>
              <div style={statCardStyles}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <DollarSign className="w-4 h-4" style={{ color: theme.accent.blue }} />
                <span style={{ fontSize: isMobile ? '11px' : '12px', color: theme.text.secondary }}>Price</span>
              </div>
              <div style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: 700, color: theme.text.primary }}>
                {token ? formatCurrency(token.price) : 'N/A'}
              </div>
            </div>

            <div style={statCardStyles}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <TrendingUp className="w-4 h-4" style={{ color: theme.accent.green }} />
                <span style={{ fontSize: isMobile ? '11px' : '12px', color: theme.text.secondary }}>Volume 24h</span>
              </div>
              <div style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: 700, color: theme.text.primary }}>
                {token ? formatCurrency(token.volume24h) : 'N/A'}
              </div>
            </div>

            <div style={statCardStyles}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <TrendingUp className="w-4 h-4" style={{ color: theme.accent.blue }} />
                <span style={{ fontSize: isMobile ? '11px' : '12px', color: theme.text.secondary }}>Market Cap</span>
              </div>
              <div style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: 700, color: theme.text.primary }}>
                {token ? formatCurrency(token.marketCap) : 'N/A'}
              </div>
            </div>

            <div style={statCardStyles}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <Shield className="w-4 h-4" style={{ color: token ? getSafetyColor(token.safetyScore) : theme.text.tertiary }} />
                <span style={{ fontSize: isMobile ? '11px' : '12px', color: theme.text.secondary }}>Safety Score</span>
              </div>
              <div style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: 700, color: token ? getSafetyColor(token.safetyScore) : theme.text.tertiary }}>
                {token ? `${token.safetyScore}/100` : 'N/A'}
              </div>
            </div>

            <div style={statCardStyles}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <Users className="w-4 h-4" style={{ color: theme.accent.orange }} />
                <span style={{ fontSize: isMobile ? '11px' : '12px', color: theme.text.secondary }}>Holders</span>
              </div>
              <div style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: 700, color: theme.text.primary }}>
                {token ? formatNumber(token.holders) : 'N/A'}
              </div>
            </div>

            <div style={statCardStyles}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <TrendingDown className="w-4 h-4" style={{ color: theme.accent.purple }} />
                <span style={{ fontSize: isMobile ? '11px' : '12px', color: theme.text.secondary }}>Liquidity</span>
              </div>
              <div style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: 700, color: theme.text.primary }}>
                {token ? formatCurrency(token.liquidity) : 'N/A'}
              </div>
            </div>
          </div>

          {/* Analyze Button - Always visible */}
          <div style={{ marginBottom: '20px', textAlign: 'center' }}>
              <ProButton
                variant="primary"
                size="lg"
                onClick={analyzeToken}
                disabled={isStreaming || !sessionToken}
                className="flex items-center gap-2"
                style={{
                  width: isMobile ? '100%' : 'auto',  // ✅ Full width on mobile
                  minHeight: '48px',  // ✅ Touch-friendly
                }}
              >
                {isStreaming ? 'Analyzing...' : token ? `Analyze ${token.symbol}` : 'Analyze Crypto'}
              </ProButton>
            </div>

          {/* Desktop Tabs - Hidden on Mobile */}
          {!isMobile && (
            <div style={desktopTabContainerStyles}>
              <button
                style={{
                  ...desktopTabButtonStyles,
                  ...(activeTab === 'chat' ? desktopActiveTabStyles : {}),
                }}
                onClick={() => setActiveTab('chat')}
              >
                AI Chat
              </button>
              <button
                style={{
                  ...desktopTabButtonStyles,
                  ...(activeTab === 'learn' ? desktopActiveTabStyles : {}),
                }}
                onClick={() => setActiveTab('learn')}
              >
                Learn
              </button>
              <button
                style={{
                  ...desktopTabButtonStyles,
                  ...(activeTab === 'insights' ? desktopActiveTabStyles : {}),
                }}
                onClick={() => setActiveTab('insights')}
              >
                Insights
              </button>
            </div>
          )}

          {/* Tab Content */}
          <div style={chatAreaStyles}>
            {(!isMobile && activeTab === 'chat') || isMobile ? (
              <>
                <div style={messagesAreaStyles} ref={messagesAreaRef}>
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
                </div>

                <div style={{
                  ...inputContainerStyles,
                  ...(isMobile && {
                    position: 'sticky',
                    bottom: 0,
                    background: theme.surface.primary,
                    borderTop: `1px solid ${theme.border.primary}`,
                    padding: '16px',
                    paddingBottom: `max(16px, env(safe-area-inset-bottom))`,
                    zIndex: Z_INDEX.fab + 1,
                  }),
                }}>
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
                      padding: isMobile ? '16px' : '12px 16px',  // ✅ Larger mobile padding
                      border: `1px solid ${theme.border.primary}`,
                      borderRadius: '8px',
                      background: theme.surface.primary,
                      color: theme.text.primary,
                      fontSize: '16px', // Prevent iOS zoom
                      fontFamily: 'Inter, system-ui, sans-serif',
                      minHeight: isMobile ? '48px' : '44px',  // ✅ Larger mobile minimum
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
                      minHeight: isMobile ? '48px' : '44px',  // ✅ Larger mobile minimum
                      minWidth: isMobile ? '48px' : '44px',  // ✅ Larger mobile minimum
                    }}
                  >
                    {isAnalyzing ? 'Analyzing...' : isStreaming ? 'Generating...' : 'Send'}
                  </ProButton>
                </div>
              </>
            ) : null}

            {/* Learn Tab - Desktop and Mobile */}
            {activeTab === 'learn' && (
              <div style={{ padding: '20px', textAlign: 'center', color: theme.text.secondary }}>
                <h3>Learning content about {token ? token.symbol : 'cryptocurrency'}</h3>
                <p>Educational content coming soon...</p>
              </div>
            )}

            {/* Insights Tab - Desktop and Mobile */}
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