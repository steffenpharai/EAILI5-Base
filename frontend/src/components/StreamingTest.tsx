import React, { useState } from 'react';
import { Play, Square, RotateCcw, Brain, MessageSquare } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useChat } from '../hooks/useChat';
import { sessionManager } from '../utils/sessionManager';
import { ProButton } from './pro';
import AgentActivityPanel from './AgentActivityPanel';

const StreamingTest: React.FC = () => {
  const { theme } = useTheme();
  const { sendMessageStream, isConnected, agentActivities } = useChat();
  const [isStreaming, setIsStreaming] = useState(false);
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');
  const [sessionToken, setSessionToken] = useState<string>('');
  const [showAgentPanel, setShowAgentPanel] = useState(false);

  const handleStartStreaming = async () => {
    if (!message.trim()) return;
    
    setIsStreaming(true);
    setResponse('');
    
    try {
      // Get or create session
      const token = await sessionManager.getOrCreateSession();
      setSessionToken(token);
      
      await sendMessageStream(
        message,
        'test-user',
        token,
        (chunk: string) => {
          setResponse(prev => prev + chunk);
        },
        (agent: string, status: string) => {
          console.log(`Agent ${agent}: ${status}`);
        },
        (suggestions: string[], learningLevel: number) => {
          console.log('Stream complete:', { suggestions, learningLevel });
          setIsStreaming(false);
        },
        (error: string) => {
          console.error('Stream error:', error);
          setResponse(prev => prev + `\n\n[Error: ${error}]`);
          setIsStreaming(false);
        }
      );
    } catch (error) {
      console.error('Error starting stream:', error);
      setResponse(prev => prev + `\n\n[Error: ${error}]`);
      setIsStreaming(false);
    }
  };

  const handleStopStreaming = () => {
    setIsStreaming(false);
  };

  const handleReset = () => {
    setMessage('');
    setResponse('');
    setIsStreaming(false);
  };

  const containerStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    background: theme.surface.primary,
    padding: '20px',
    gap: '20px',
  };

  const headerStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    background: theme.surface.secondary,
    borderRadius: '12px',
    border: `1px solid ${theme.border.primary}`,
  };

  const titleStyles: React.CSSProperties = {
    fontSize: '20px',
    fontWeight: 600,
    color: theme.text.primary,
    fontFamily: 'Inter, system-ui, sans-serif',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  };

  const statusStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    color: isConnected ? theme.accent.green : theme.accent.red,
    fontFamily: 'Inter, system-ui, sans-serif',
  };

  const inputContainerStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    background: theme.surface.secondary,
    padding: '20px',
    borderRadius: '12px',
    border: `1px solid ${theme.border.primary}`,
  };

  const textareaStyles: React.CSSProperties = {
    width: '100%',
    minHeight: '100px',
    padding: '12px',
    borderRadius: '8px',
    border: `1px solid ${theme.border.primary}`,
    background: theme.surface.primary,
    color: theme.text.primary,
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: '14px',
    resize: 'vertical',
  };

  const buttonContainerStyles: React.CSSProperties = {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
  };

  const responseContainerStyles: React.CSSProperties = {
    flex: 1,
    background: theme.surface.secondary,
    borderRadius: '12px',
    padding: '20px',
    border: `1px solid ${theme.border.primary}`,
    display: 'flex',
    flexDirection: 'column',
  };

  const responseTextStyles: React.CSSProperties = {
    flex: 1,
    fontSize: '14px',
    color: theme.text.primary,
    fontFamily: 'Inter, system-ui, sans-serif',
    lineHeight: '1.6',
    whiteSpace: 'pre-wrap',
    overflowY: 'auto',
    padding: '12px',
    background: theme.surface.primary,
    borderRadius: '8px',
    border: `1px solid ${theme.border.primary}`,
  };

  const agentButtonStyles: React.CSSProperties = {
    position: 'fixed',
    top: '20px',
    right: '20px',
    zIndex: 1000,
  };

  return (
    <div style={containerStyles}>
      <div style={headerStyles}>
        <h2 style={titleStyles}>
          <Brain className="w-6 h-6" />
          Streaming Test
        </h2>
        <div style={statusStyles}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: isConnected ? theme.accent.green : theme.accent.red,
          }} />
          {isConnected ? 'Connected' : 'Disconnected'}
        </div>
      </div>

      <div style={inputContainerStyles}>
        <label style={{
          fontSize: '14px',
          fontWeight: 500,
          color: theme.text.primary,
          fontFamily: 'Inter, system-ui, sans-serif',
        }}>
          Test Message:
        </label>
        <textarea
          style={textareaStyles}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Enter a message to test streaming with agent visibility..."
          disabled={isStreaming}
        />
        <div style={buttonContainerStyles}>
          <ProButton
            variant="primary"
            size="lg"
            onClick={handleStartStreaming}
            disabled={!message.trim() || isStreaming || !isConnected}
            className="flex items-center gap-2"
          >
            <Play className="w-4 h-4" />
            {isStreaming ? 'Streaming...' : 'Start Stream'}
          </ProButton>
          
          {isStreaming && (
            <ProButton
              variant="ghost"
              size="lg"
              onClick={handleStopStreaming}
              className="flex items-center gap-2"
            >
              <Square className="w-4 h-4" />
              Stop
            </ProButton>
          )}
          
          <ProButton
            variant="ghost"
            size="lg"
            onClick={handleReset}
            disabled={isStreaming}
            className="flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </ProButton>
        </div>
      </div>

      <div style={responseContainerStyles}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '12px',
        }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: 600,
            color: theme.text.primary,
            fontFamily: 'Inter, system-ui, sans-serif',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <MessageSquare className="w-5 h-5" />
            AI Response
          </h3>
          
          <ProButton
            variant="ghost"
            size="sm"
            onClick={() => setShowAgentPanel(!showAgentPanel)}
            className="flex items-center gap-1.5"
          >
            <Brain className="w-4 h-4" />
            {showAgentPanel ? 'Hide' : 'Show'} Agents
          </ProButton>
        </div>
        
        <div style={responseTextStyles}>
          {response || (isStreaming ? 'Waiting for response...' : 'No response yet. Send a message to test streaming.')}
        </div>
      </div>

      {/* Agent Activity Panel */}
      {showAgentPanel && (
        <AgentActivityPanel
          activities={agentActivities}
          isVisible={showAgentPanel}
          onClose={() => setShowAgentPanel(false)}
        />
      )}
    </div>
  );
};

export default StreamingTest;
