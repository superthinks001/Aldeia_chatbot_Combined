import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';
import MessageList from './MessageList';
import InputBox from './InputBox';
import { extractPageContext, monitorPageContext, PageContext } from '../utils/pageContextExtractor';

interface Message {
  sender: 'user' | 'bot';
  text: string;
  confidence?: number;
  bias?: any;
  timestamp?: Date;
}

const ChatWidget: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [pageContext, setPageContext] = useState<PageContext | null>(null);

  // Extract page context on mount and monitor changes
  useEffect(() => {
    // Extract initial context
    const context = extractPageContext();
    setPageContext(context);

    // Monitor context changes (URL changes, scrolling)
    const cleanup = monitorPageContext((newContext) => {
      setPageContext(newContext);
    }, 10000); // Check every 10 seconds

    return cleanup;
  }, []);

  // Greeting on mount (only if authenticated)
  useEffect(() => {
    if (isAuthenticated && messages.length === 0 && pageContext) {
      let greeting = `Hello ${user?.name || 'there'}! I'm the Aldeia Fire Recovery Assistant.`;

      // Add location-aware greeting
      if (pageContext.location.detected) {
        greeting += ` I can see you're looking at information about ${pageContext.location.city || pageContext.location.county}.`;
      }

      // Add topic-aware greeting
      if (pageContext.primaryTopic) {
        const topicName = pageContext.primaryTopic.replace(/-/g, ' ');
        greeting += ` I can help you with ${topicName}.`;
      }

      greeting += ` How can I assist you today?`;

      setMessages([{
        sender: 'bot',
        text: greeting,
        timestamp: new Date()
      }]);
    }
  }, [isAuthenticated, user, pageContext]);

  const handleSendMessage = async (message: string) => {
    if (!message.trim() || !isAuthenticated) return;

    // Add user message
    const userMessage: Message = {
      sender: 'user',
      text: message,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setLoading(true);

    try {
      // Send to authenticated API with comprehensive page context
      const response = await api.sendMessage(message, {
        pageUrl: window.location.href,
        pageTitle: document.title,
        location: pageContext?.location.detected
          ? `${pageContext.location.city || ''} ${pageContext.location.county || ''}`.trim()
          : undefined,
        topic: pageContext?.primaryTopic,
        context: pageContext ? {
          headings: pageContext.headings.h1.concat(pageContext.headings.h2).join(', '),
          keywords: pageContext.keywords.slice(0, 10).join(', '),
        } : undefined
      });

      const botMessage: Message = {
        sender: 'bot',
        text: response.data.response || 'I apologize, I encountered an error.',
        confidence: response.data.confidence,
        bias: response.data.bias,
        timestamp: new Date()
      } as any;

      setMessages(prev => [...prev, botMessage]);
    } catch (error: any) {
      console.error('Chat error:', error);

      const errorMessage: Message = {
        sender: 'bot',
        text: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="chat-widget-unauthorized">
        <div className="unauthorized-message">
          <h3>Authentication Required</h3>
          <p>Please log in to use the chat assistant.</p>
          <button onClick={() => window.location.href = '/login'}>
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`chat-widget ${isMinimized ? 'minimized' : ''}`}>
      <div className="chat-header">
        <div className="chat-header-info">
          <h3>Aldeia Assistant</h3>
          <span className="user-info">{user?.email}</span>
        </div>
        <div className="chat-header-actions">
          <button onClick={() => setIsMinimized(!isMinimized)}>
            {isMinimized ? '▲' : '▼'}
          </button>
          <button onClick={logout} title="Logout">
            🚪
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Context badges */}
          {pageContext && (pageContext.location.detected || pageContext.primaryTopic) && (
            <div style={{
              padding: '8px 12px',
              backgroundColor: '#e3f2fd',
              borderBottom: '1px solid #90caf9',
              fontSize: 11,
              display: 'flex',
              gap: 6,
              flexWrap: 'wrap'
            }}>
              {pageContext.location.detected && (
                <span style={{
                  padding: '2px 8px',
                  backgroundColor: '#1976d2',
                  color: 'white',
                  borderRadius: 12,
                  fontWeight: 600
                }}>
                  📍 {pageContext.location.city || pageContext.location.county}
                </span>
              )}
              {pageContext.primaryTopic && (
                <span style={{
                  padding: '2px 8px',
                  backgroundColor: '#388e3c',
                  color: 'white',
                  borderRadius: 12,
                  fontWeight: 600
                }}>
                  🏷️ {pageContext.primaryTopic.replace(/-/g, ' ')}
                </span>
              )}
            </div>
          )}

          <MessageList messages={messages} />
          <InputBox onSend={handleSendMessage} disabled={loading} />
        </>
      )}
    </div>
  );
};

export default ChatWidget;
