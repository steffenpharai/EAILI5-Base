import React, { useState, useEffect } from 'react';
import { Brain, TrendingUp, AlertTriangle, Lightbulb, Send, Search } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useMobile } from '../hooks/useMobile';
import { ProCard, ProButton, ProInput, ProBadge } from './pro';
import { Token } from '../hooks/useTokenData';
import { useChat } from '../hooks/useChat';
import { sessionManager } from '../utils/sessionManager';
import CollapsiblePanel from './CollapsiblePanel';
// import FeedbackWidget from './FeedbackWidget'; // Removed - using FeedbackBar instead

// Add interface for agent activities
interface AgentActivity {
  agent: string;
  status: string;
  timestamp: number;
  icon: React.ReactNode;
}

// Add interface for conversation history
interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  agent?: string;
  timestamp: number;
}

interface AIInsightsPanelProps {
  token: Token | null;
  walletAddress?: string;
}

const AIInsightsPanel: React.FC<AIInsightsPanelProps> = ({ token, walletAddress }) => {
  const { theme } = useTheme();
  const { sendMessageStream, isConnected } = useChat();
  const [question, setQuestion] = useState('');
  const [, setAnalysis] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [sessionToken, setSessionToken] = useState('');
  
  // Add state for tracking activities and conversation
  const [agentActivities, setAgentActivities] = useState<AgentActivity[]>([]);
  const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([]);
  const [learningLevel, setLearningLevel] = useState(() => {
    const stored = sessionStorage.getItem('eaili5_learning_level');
    return stored ? parseInt(stored) : 0;
  });

  // Initialize session with retry logic
  useEffect(() => {
    const initSession = async () => {
      try {
        const token = await sessionManager.getOrCreateSession(walletAddress || 'anonymous');
        setSessionToken(token);
      } catch (error) {
        console.error('Failed to initialize session:', error);
        // Retry after 1 second
        setTimeout(() => {
          sessionManager.getOrCreateSession(walletAddress || 'anonymous')
            .then(setSessionToken)
            .catch(console.error);
        }, 1000);
      }
    };
    initSession();
  }, [walletAddress]);

  // Auto-analyze token when selected
  useEffect(() => {
    if (token && sessionToken) {
      analyzeToken();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token?.address, sessionToken]);

  const analyzeToken = () => {
    if (!token || !sessionToken) return;

    // Clear agent activities for new analysis
    setAgentActivities([]);
    
    // Add system message to conversation
    setConversationHistory(prev => [
      ...prev,
      {
        role: 'system',
        content: `Analyzing ${token.symbol} (${token.name})...`,
        timestamp: Date.now()
      }
    ]);

    setIsAnalyzing(true);
    setAnalysis('');

    const prompt = `Analyze ${token.symbol} (${token.name}). Price: $${token.price}, 24h change: ${token.priceChange24h}%, Volume: $${token.volume24h.toLocaleString()}, Market Cap: $${token.marketCap.toLocaleString()}, Safety Score: ${token.safetyScore}/100. Give me your honest analysis with predictions.`;

    sendMessageStream(
      prompt,
      walletAddress || 'anonymous',
      sessionToken,
      // onChunk
      (chunk: string) => {
        setAnalysis(prev => prev + chunk);
        
        // Update conversation history with streaming chunks
        setConversationHistory(prev => {
          const updated = [...prev];
          const lastMsg = updated[updated.length - 1];
          
          if (lastMsg && lastMsg.role === 'assistant') {
            lastMsg.content += chunk;
          } else {
            updated.push({
              role: 'assistant',
              content: chunk,
              timestamp: Date.now()
            });
          }
          
          return updated;
        });
      },
      // onStatus
      (agent: string, status: string) => {
        const agentIcons: Record<string, React.ReactNode> = {
          coordinator: <Brain className="w-3 h-3" />,
          research: <TrendingUp className="w-3 h-3" />,
          educator: <Lightbulb className="w-3 h-3" />,
          trading: <AlertTriangle className="w-3 h-3" />,
          web_search: <Search className="w-3 h-3" />
        };
        
        setAgentActivities(prev => [
          ...prev.slice(-4), // Keep last 5 activities
          {
            agent: agent.charAt(0).toUpperCase() + agent.slice(1),
            status,
            timestamp: Date.now(),
            icon: agentIcons[agent] || <Brain className="w-3 h-3" />
          }
        ]);
      },
      // onComplete
      (suggestions: string[], learning_level: number) => {
        setIsAnalyzing(false);
        setLearningLevel(learning_level);
        sessionStorage.setItem('eaili5_learning_level', learning_level.toString());
      },
      // onError
      (error: string) => {
        console.error('Analysis error:', error);
        
        // Check if it's a session error and retry
        if (error.includes('session') || error.includes('expired') || error.includes('Invalid')) {
          console.log('Session error detected, retrying with new session...');
          sessionManager.getOrCreateSession(walletAddress || 'anonymous')
            .then(newToken => {
              setSessionToken(newToken);
              // Retry the analysis after getting new session
              setTimeout(() => analyzeToken(), 500);
            })
            .catch(console.error);
        } else {
          setAnalysis("I'm having trouble analyzing this token right now. Let me try again...");
          setConversationHistory(prev => [
            ...prev,
            {
              role: 'system',
              content: `Error: ${error}`,
              timestamp: Date.now()
            }
          ]);
        }
        setIsAnalyzing(false);
      }
    );
  };

  const handleAskQuestion = () => {
    if (!question.trim() || !sessionToken) return;

    // Add user question to conversation
    setConversationHistory(prev => [
      ...prev,
      {
        role: 'user',
        content: question,
        timestamp: Date.now()
      }
    ]);

    setQuestion('');
    setIsAnalyzing(true);
    setAgentActivities([]);

    const contextPrompt = token 
      ? `About ${token.symbol}: ${question}`
      : question;

    sendMessageStream(
      contextPrompt,
      walletAddress || 'anonymous',
      sessionToken,
      (chunk: string) => {
        setAnalysis(prev => prev + chunk);
        
        // Update conversation history with streaming chunks
        setConversationHistory(prev => {
          const updated = [...prev];
          const lastMsg = updated[updated.length - 1];
          
          if (lastMsg && lastMsg.role === 'assistant') {
            lastMsg.content += chunk;
          } else {
            updated.push({
              role: 'assistant',
              content: chunk,
              timestamp: Date.now()
            });
          }
          
          return updated;
        });
      },
      (agent: string, status: string) => {
        const agentIcons: Record<string, React.ReactNode> = {
          coordinator: <Brain className="w-3 h-3" />,
          research: <TrendingUp className="w-3 h-3" />,
          educator: <Lightbulb className="w-3 h-3" />,
          trading: <AlertTriangle className="w-3 h-3" />,
          web_search: <Search className="w-3 h-3" />
        };
        
        setAgentActivities(prev => [
          ...prev.slice(-4), // Keep last 5 activities
          {
            agent: agent.charAt(0).toUpperCase() + agent.slice(1),
            status,
            timestamp: Date.now(),
            icon: agentIcons[agent] || <Brain className="w-3 h-3" />
          }
        ]);
      },
      (suggestions: string[], learning_level: number) => {
        setIsAnalyzing(false);
        setLearningLevel(learning_level);
        sessionStorage.setItem('eaili5_learning_level', learning_level.toString());
      },
      (error: string) => {
        console.error('Question error:', error);
        setAnalysis("I hit a snag. Try asking that again?");
        setConversationHistory(prev => [
          ...prev,
          {
            role: 'system',
            content: `Error: ${error}`,
            timestamp: Date.now()
          }
        ]);
        setIsAnalyzing(false);
      }
    );
  };

  // Add responsive styles
  const isMobile = useMobile();

  const containerStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    background: theme.surface.primary,
    borderLeft: isMobile ? 'none' : `1px solid ${theme.border.primary}`,
    borderTop: isMobile ? `1px solid ${theme.border.primary}` : 'none',
    width: isMobile ? '100vw' : '320px',
    position: isMobile ? 'fixed' : 'relative',
    bottom: isMobile ? 0 : 'auto',
    left: isMobile ? 0 : 'auto',
    zIndex: isMobile ? 1000 : 'auto',
    overflow: 'hidden',
  };

  const headerStyles: React.CSSProperties = {
    padding: '16px',
    borderBottom: `1px solid ${theme.border.primary}`,
  };

  const titleStyles: React.CSSProperties = {
    fontSize: '14px',
    fontWeight: 600,
    color: theme.text.primary,
    marginBottom: '4px',
    fontFamily: 'Inter, system-ui, sans-serif',
  };

  const subtitleStyles: React.CSSProperties = {
    fontSize: '12px',
    color: theme.text.secondary,
    fontFamily: 'Inter, system-ui, sans-serif',
  };


  const footerStyles: React.CSSProperties = {
    padding: '16px',
    borderTop: `1px solid ${theme.border.primary}`,
    display: 'flex',
    gap: '8px',
  };

  // For mobile, use bottom sheet overlay pattern
  if (isMobile) {
    return (
      <CollapsiblePanel
        id="ai-insights-mobile"
        title="AI Insights"
        direction="vertical"
        defaultCollapsed={{ mobile: true, desktop: false }}
        collapsedSize="48px"
        expandedSize="80vh"
        icon={<Brain className="w-4 h-4" />}
        badge={agentActivities.length > 0 ? agentActivities.length : undefined}
        className="mobile-ai-insights"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          maxHeight: '80vh',
          borderRadius: '16px 16px 0 0',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.15)',
        }}
      >
        <div style={containerStyles}>
          <div style={headerStyles}>
            <div style={titleStyles}>
              <Brain className="w-4 h-4 inline mr-2" style={{ verticalAlign: 'middle' }} />
              AI Insights
            </div>
            <div style={subtitleStyles}>
              Powered by EAILI5
            </div>
          </div>

          {/* Learning Progress Indicator */}
          <div style={{
            padding: '12px 16px',
            borderBottom: `1px solid ${theme.border.primary}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <div style={{ fontSize: '12px', color: theme.text.tertiary }}>
                Learning Progress
              </div>
              <div style={{ fontSize: '14px', color: theme.text.primary, fontWeight: 600 }}>
                Level {Math.floor(learningLevel / 10)} Crypto Explorer
              </div>
            </div>
            
            <div style={{
              width: '100px',
              height: '4px',
              background: theme.surface.secondary,
              borderRadius: '2px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${(learningLevel % 10) * 10}%`,
                height: '100%',
                background: theme.accent.blue,
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>

          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            {!token ? (
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
                <Brain className="w-12 h-12 mb-4" />
                <div style={{ fontSize: '14px', marginBottom: '8px' }}>
                  Select a token to get AI insights
                </div>
                <div style={{ fontSize: '12px' }}>
                  I'll analyze it with complete honesty
                </div>
              </div>
            ) : (
              <>
                {/* Token Info */}
                <ProCard padding="sm">
                  <div style={{ marginBottom: '8px' }}>
                    <div style={{ fontSize: '16px', fontWeight: 600, color: theme.text.primary }}>
                      {token.symbol}
                    </div>
                    <div style={{ fontSize: '12px', color: theme.text.secondary }}>
                      {token.name}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <ProBadge variant={token.priceChange24h >= 0 ? 'bullish' : 'bearish'}>
                      {token.priceChange24h >= 0 ? <TrendingUp className="w-3 h-3" /> : null}
                      {token.priceChange24h.toFixed(2)}%
                    </ProBadge>
                    <ProBadge variant={token.safetyScore >= 80 ? 'bullish' : token.safetyScore >= 60 ? 'neutral' : 'bearish'}>
                      <AlertTriangle className="w-3 h-3" />
                      Safety: {token.safetyScore}
                    </ProBadge>
                  </div>
                </ProCard>

                {/* Agent Activities Display */}
                {agentActivities.length > 0 && (
                  <div style={{
                    padding: '12px',
                    background: `${theme.surface.secondary}80`,
                    borderRadius: '8px',
                    marginBottom: '12px'
                  }}>
                    {agentActivities.map((activity, idx) => (
                      <div key={idx} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '11px',
                        color: theme.text.tertiary,
                        marginBottom: idx < agentActivities.length - 1 ? '4px' : '0'
                      }}>
                        {activity.icon}
                        <span style={{ fontWeight: 500, color: theme.accent.blue }}>
                          {activity.agent}
                        </span>
                        <span>•</span>
                        <span>{activity.status}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Conversation History */}
                <div style={{
                  flex: 1,
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  {conversationHistory.map((msg, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
                        width: '100%'
                      }}
                    >
                      {msg.role === 'system' && (
                        <div style={{
                          fontSize: '11px',
                          color: theme.text.tertiary,
                          marginBottom: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}>
                          <Brain className="w-3 h-3" />
                          <span>EAILI5 {msg.agent ? `(${msg.agent})` : ''}</span>
                        </div>
                      )}
                      
                      <div
                        style={{
                          maxWidth: '85%',
                          padding: '12px 16px',
                          borderRadius: '12px',
                          background: msg.role === 'user' 
                            ? theme.accent.blue
                            : `${theme.surface.secondary}`,
                          color: msg.role === 'user' ? '#ffffff' : theme.text.primary,
                          fontSize: '14px',
                          lineHeight: '1.5',
                          whiteSpace: 'pre-wrap'
                        }}
                      >
                        {msg.content}
                      </div>
                      
                      <div style={{
                        fontSize: '10px',
                        color: theme.text.tertiary,
                        marginTop: '4px'
                      }}>
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                  
                  {/* Show typing indicator when analyzing */}
                  {isAnalyzing && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      color: theme.text.tertiary,
                      fontSize: '13px'
                    }}>
                      <Brain className="w-4 h-4 animate-pulse" />
                      <span>EAILI5 is analyzing...</span>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Ask AI Input */}
          <div style={footerStyles}>
            <ProInput
              value={question}
              onChange={setQuestion}
              placeholder="Ask AI about this token..."
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleAskQuestion();
                }
              }}
              disabled={!token || isAnalyzing || !isConnected}
            />
            <ProButton
              onClick={handleAskQuestion}
              disabled={!question.trim() || !token || isAnalyzing || !isConnected}
              variant="primary"
            >
              <Send className="w-4 h-4" />
            </ProButton>
          </div>
        </div>
      </CollapsiblePanel>
    );
  }

  // For desktop, use CollapsiblePanel as right drawer
  return (
    <CollapsiblePanel
      id="ai-insights-desktop"
      title="AI Insights"
      direction="horizontal"
      defaultCollapsed={{ mobile: true, desktop: false }}
      collapsedSize="48px"
      expandedSize="320px"
      icon={<Brain className="w-4 h-4" />}
      badge={agentActivities.length > 0 ? agentActivities.length : undefined}
      className="desktop-ai-insights"
      style={{
        position: 'fixed',
        right: 0,
        top: 0,
        height: '100vh',
        zIndex: 100,
      }}
    >
      <div style={containerStyles}>
        <div style={headerStyles}>
          <div style={titleStyles}>
            <Brain className="w-4 h-4 inline mr-2" style={{ verticalAlign: 'middle' }} />
            AI Insights
          </div>
          <div style={subtitleStyles}>
            Powered by EAILI5
          </div>
        </div>

        {/* Learning Progress Indicator */}
        <div style={{
          padding: '12px 16px',
          borderBottom: `1px solid ${theme.border.primary}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ fontSize: '12px', color: theme.text.tertiary }}>
              Learning Progress
            </div>
            <div style={{ fontSize: '14px', color: theme.text.primary, fontWeight: 600 }}>
              Level {Math.floor(learningLevel / 10)} Crypto Explorer
            </div>
          </div>
          
          <div style={{
            width: '100px',
            height: '4px',
            background: theme.surface.secondary,
            borderRadius: '2px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${(learningLevel % 10) * 10}%`,
              height: '100%',
              background: theme.accent.blue,
              transition: 'width 0.3s ease'
            }} />
          </div>
        </div>

        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          {!token ? (
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
              <Brain className="w-12 h-12 mb-4" />
              <div style={{ fontSize: '14px', marginBottom: '8px' }}>
                Select a token to get AI insights
              </div>
              <div style={{ fontSize: '12px' }}>
                I'll analyze it with complete honesty
              </div>
            </div>
          ) : (
            <>
              {/* Token Info */}
              <ProCard padding="sm">
                <div style={{ marginBottom: '8px' }}>
                  <div style={{ fontSize: '16px', fontWeight: 600, color: theme.text.primary }}>
                    {token.symbol}
                  </div>
                  <div style={{ fontSize: '12px', color: theme.text.secondary }}>
                    {token.name}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <ProBadge variant={token.priceChange24h >= 0 ? 'bullish' : 'bearish'}>
                    {token.priceChange24h >= 0 ? <TrendingUp className="w-3 h-3" /> : null}
                    {token.priceChange24h.toFixed(2)}%
                  </ProBadge>
                  <ProBadge variant={token.safetyScore >= 80 ? 'bullish' : token.safetyScore >= 60 ? 'neutral' : 'bearish'}>
                    <AlertTriangle className="w-3 h-3" />
                    Safety: {token.safetyScore}
                  </ProBadge>
                </div>
              </ProCard>

              {/* Agent Activities Display */}
              {agentActivities.length > 0 && (
                <div style={{
                  padding: '12px',
                  background: `${theme.surface.secondary}80`,
                  borderRadius: '8px',
                  marginBottom: '12px'
                }}>
                  {agentActivities.map((activity, idx) => (
                    <div key={idx} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '11px',
                      color: theme.text.tertiary,
                      marginBottom: idx < agentActivities.length - 1 ? '4px' : '0'
                    }}>
                      {activity.icon}
                      <span style={{ fontWeight: 500, color: theme.accent.blue }}>
                        {activity.agent}
                      </span>
                      <span>•</span>
                      <span>{activity.status}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Conversation History */}
              <div style={{
                flex: 1,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                {conversationHistory.map((msg, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
                      width: '100%'
                    }}
                  >
                    {msg.role === 'system' && (
                      <div style={{
                        fontSize: '11px',
                        color: theme.text.tertiary,
                        marginBottom: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <Brain className="w-3 h-3" />
                        <span>EAILI5 {msg.agent ? `(${msg.agent})` : ''}</span>
                      </div>
                    )}
                    
                    <div
                      style={{
                        maxWidth: '85%',
                        padding: '12px 16px',
                        borderRadius: '12px',
                        background: msg.role === 'user' 
                          ? theme.accent.blue
                          : `${theme.surface.secondary}`,
                        color: msg.role === 'user' ? '#ffffff' : theme.text.primary,
                        fontSize: '14px',
                        lineHeight: '1.5',
                        whiteSpace: 'pre-wrap'
                      }}
                    >
                      {msg.content}
                    </div>
                    
                    <div style={{
                      fontSize: '10px',
                      color: theme.text.tertiary,
                      marginTop: '4px'
                    }}>
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
                
                {/* Show typing indicator when analyzing */}
                {isAnalyzing && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: theme.text.tertiary,
                    fontSize: '13px'
                  }}>
                    <Brain className="w-4 h-4 animate-pulse" />
                    <span>EAILI5 is analyzing...</span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Ask AI Input */}
        <div style={footerStyles}>
          <ProInput
            value={question}
            onChange={setQuestion}
            placeholder="Ask AI about this token..."
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleAskQuestion();
              }
            }}
            disabled={!token || isAnalyzing || !isConnected}
          />
          <ProButton
            onClick={handleAskQuestion}
            disabled={!question.trim() || !token || isAnalyzing || !isConnected}
            variant="primary"
          >
            <Send className="w-4 h-4" />
          </ProButton>
        </div>
      </div>
    </CollapsiblePanel>
  );
};

export default AIInsightsPanel;

