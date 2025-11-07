import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';
import MessageList from './MessageList';
import InputBox from './InputBox';

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

  // Greeting on mount (only if authenticated)
  useEffect(() => {
    if (isAuthenticated && messages.length === 0) {
      setMessages([{
        sender: 'bot',
        text: `Hello ${user?.name || 'there'}! I'm the Aldeia Fire Recovery Assistant. How can I help you today?`,
        timestamp: new Date()
      }]);
    }
  }, [isAuthenticated, user]);

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
      // Send to authenticated API
      const response = await api.sendMessage(message, {
        pageUrl: window.location.href,
        pageTitle: document.title
      });

      const botMessage: Message = {
        sender: 'bot',
        text: response.data.response || 'I apologize, I encountered an error.',
        confidence: response.data.confidence,
        bias: response.data.bias,
        timestamp: new Date()
      };

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
          <MessageList messages={messages} />
          <InputBox onSend={handleSendMessage} disabled={loading} />
        </>
      )}
    </div>
  );
};

export default ChatWidget;
