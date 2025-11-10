import React, { useState } from 'react';
import './ProactiveNotificationBanner.css';

interface Notification {
  id: string;
  type: 'deadline' | 'update' | 'resource' | 'weather' | 'safety';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  location?: string;
  expiresAt?: Date;
  actionUrl?: string;
  actionText?: string;
}

interface ProactiveNotificationBannerProps {
  notifications: Notification[];
  onDismiss?: (id: string) => void;
}

const ProactiveNotificationBanner: React.FC<ProactiveNotificationBannerProps> = ({
  notifications,
  onDismiss
}) => {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  if (!notifications || notifications.length === 0) {
    return null;
  }

  const visibleNotifications = notifications.filter(n => !dismissedIds.has(n.id));

  if (visibleNotifications.length === 0) {
    return null;
  }

  const handleDismiss = (id: string) => {
    setDismissedIds(prev => new Set([...prev, id]));
    if (onDismiss) {
      onDismiss(id);
    }
  };

  const getIcon = (type: string): string => {
    switch (type) {
      case 'deadline': return '⏰';
      case 'update': return '📢';
      case 'resource': return '📋';
      case 'weather': return '🌤️';
      case 'safety': return '🛡️';
      default: return '📌';
    }
  };

  const getPriorityColor = (priority: string): { bg: string; border: string; text: string } => {
    switch (priority) {
      case 'urgent':
        return { bg: '#ffebee', border: '#c62828', text: '#c62828' };
      case 'high':
        return { bg: '#fff3e0', border: '#e65100', text: '#e65100' };
      case 'medium':
        return { bg: '#fff9c4', border: '#f57f17', text: '#f57f17' };
      case 'low':
        return { bg: '#e3f2fd', border: '#1976d2', text: '#1976d2' };
      default:
        return { bg: '#f5f5f5', border: '#757575', text: '#757575' };
    }
  };

  return (
    <div className="notification-banner-container">
      {visibleNotifications.map((notification) => {
        const colors = getPriorityColor(notification.priority);

        return (
          <div
            key={notification.id}
            className={`notification-banner priority-${notification.priority}`}
            style={{
              backgroundColor: colors.bg,
              borderLeft: `4px solid ${colors.border}`,
              borderRadius: 4,
              padding: '12px 16px',
              marginBottom: 8,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              animation: 'slideIn 0.3s ease-out'
            }}
          >
            {/* Icon */}
            <div style={{ fontSize: 20, flexShrink: 0 }}>
              {getIcon(notification.type)}
            </div>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Title */}
              <div style={{
                fontWeight: 600,
                fontSize: 13,
                color: colors.text,
                marginBottom: 4
              }}>
                {notification.title}
                {notification.priority === 'urgent' && (
                  <span style={{
                    marginLeft: 6,
                    padding: '2px 6px',
                    backgroundColor: '#c62828',
                    color: 'white',
                    borderRadius: 8,
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: 'uppercase'
                  }}>
                    URGENT
                  </span>
                )}
              </div>

              {/* Message */}
              <div style={{
                fontSize: 12,
                color: '#333',
                lineHeight: 1.4,
                marginBottom: notification.actionUrl ? 8 : 0
              }}>
                {notification.message}
              </div>

              {/* Location badge */}
              {notification.location && (
                <div style={{
                  display: 'inline-block',
                  padding: '2px 8px',
                  backgroundColor: 'rgba(0,0,0,0.1)',
                  borderRadius: 10,
                  fontSize: 10,
                  fontWeight: 600,
                  marginTop: 4,
                  color: colors.text
                }}>
                  📍 {notification.location}
                </div>
              )}

              {/* Action button */}
              {notification.actionUrl && (
                <a
                  href={notification.actionUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-block',
                    marginTop: 8,
                    padding: '6px 12px',
                    backgroundColor: colors.border,
                    color: 'white',
                    borderRadius: 4,
                    fontSize: 12,
                    fontWeight: 600,
                    textDecoration: 'none',
                    cursor: 'pointer',
                    transition: 'opacity 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                >
                  {notification.actionText || 'Learn More'} →
                </a>
              )}
            </div>

            {/* Dismiss button */}
            <button
              onClick={() => handleDismiss(notification.id)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: 18,
                color: '#757575',
                cursor: 'pointer',
                padding: 0,
                width: 24,
                height: 24,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                flexShrink: 0,
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              title="Dismiss notification"
            >
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default ProactiveNotificationBanner;
