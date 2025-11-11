import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';
import MessageList, { Message } from './MessageList';
import InputBox from './InputBox';
import ProactiveNotificationBanner from './ProactiveNotificationBanner';
import HandoffDialog from './HandoffDialog';
import { extractPageContext, monitorPageContext, PageContext } from '../utils/pageContextExtractor';

const ChatWidget: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [pageContext, setPageContext] = useState<PageContext | null>(null);

  // Sprint 3: Proactive notifications and suggestions
  const [notifications, setNotifications] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);

  // Sprint 3: Human handoff dialog
  const [handoffDialogOpen, setHandoffDialogOpen] = useState(false);
  const [handoffData, setHandoffData] = useState<any>(null);

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

      // Sprint 2/3: Extract all enhanced data from response
      const botMessage: Message = {
        sender: 'bot',
        text: response.data.response || 'I apologize, I encountered an error.',
        confidence: response.data.confidence,
        bias: response.data.bias,
        uncertainty: response.data.uncertainty,
        hallucination: response.data.hallucination,
        grounded: response.data.grounded,
        sources: response.data.factCheck?.sources,
        timestamp: new Date(),

        // Sprint 2: Enhanced fields
        biasAnalysis: response.data.biasAnalysis,
        hallucinationRisk: response.data.hallucinationRisk,
        factCheck: response.data.factCheck,
        intentConfidence: response.data.intentConfidence,
        secondaryIntents: response.data.secondaryIntents,
        entities: response.data.entities,
        intent: response.data.intent,

        // Sprint 3: Handoff fields
        handoffRequired: response.data.handoffRequired,
        handoffReason: response.data.handoffReason,
        handoffPriority: response.data.handoffPriority,
        handoffMessage: response.data.handoffMessage,
        handoffContact: response.data.handoffContact,
        handoffExpert: response.data.handoffExpert
      };

      setMessages(prev => [...prev, botMessage]);

      // Sprint 3: Update notifications
      if (response.data.notifications && response.data.notifications.length > 0) {
        setNotifications(response.data.notifications);
      } else if (response.data.notification) {
        setNotifications([response.data.notification]);
      }

      // Sprint 3: Update suggestions
      if (response.data.suggestions && response.data.suggestions.length > 0) {
        setSuggestions(response.data.suggestions);
      }

      // Sprint 3: Show handoff dialog if triggered
      if (response.data.handoffRequired) {
        setHandoffData({
          reason: response.data.handoffReason,
          priority: response.data.handoffPriority,
          message: response.data.handoffMessage,
          contact: response.data.handoffContact,
          expert: response.data.handoffExpert
        });
        setHandoffDialogOpen(true);
      }
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

          {/* Sprint 3: Proactive Notification Banner */}
          {notifications.length > 0 && (
            <ProactiveNotificationBanner
              notifications={notifications}
              onDismiss={(id) => {
                setNotifications(prev => prev.filter(n => n.id !== id));
              }}
            />
          )}

          <MessageList messages={messages} />

          {/* Sprint 3: Interest-based Suggestions */}
          {suggestions.length > 0 && (
            <div style={{
              padding: '8px 12px',
              backgroundColor: '#f8f9fa',
              borderTop: '1px solid #e0e0e0',
              fontSize: 11
            }}>
              <div style={{ fontWeight: 600, marginBottom: 6, color: '#2c3e50' }}>
                💡 Suggested for you
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {suggestions.slice(0, 3).map((suggestion, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '4px 8px',
                      backgroundColor: 'white',
                      border: '1px solid #e0e0e0',
                      borderRadius: 12,
                      fontSize: 11,
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onClick={() => {
                      if (suggestion.url) {
                        window.open(suggestion.url, '_blank');
                      }
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#e3f2fd';
                      e.currentTarget.style.borderColor = '#1976d2';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'white';
                      e.currentTarget.style.borderColor = '#e0e0e0';
                    }}
                  >
                    {suggestion.icon || '📄'} {suggestion.title}
                  </div>
                ))}
              </div>
            </div>
          )}

          <InputBox onSend={handleSendMessage} disabled={loading} />
        </>
      )}

      {/* Sprint 3: Human Handoff Dialog */}
      {handoffData && (
        <HandoffDialog
          isOpen={handoffDialogOpen}
          reason={handoffData.reason}
          priority={handoffData.priority}
          message={handoffData.message}
          contact={handoffData.contact}
          expert={handoffData.expert}
          onClose={() => setHandoffDialogOpen(false)}
        />
      )}
    </div>
  );
};

export default ChatWidget;
