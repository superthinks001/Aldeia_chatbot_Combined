import React from 'react';
import './HandoffDialog.css';

interface HandoffDialogProps {
  isOpen: boolean;
  reason: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  message: string;
  contact: {
    name: string;
    phone?: string;
    email?: string;
    hours?: string;
  };
  expert?: string;
  onClose: () => void;
}

const HandoffDialog: React.FC<HandoffDialogProps> = ({
  isOpen,
  reason,
  priority,
  message,
  contact,
  expert,
  onClose
}) => {
  if (!isOpen) {
    return null;
  }

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

  const getReasonLabel = (reason: string): string => {
    const labels: { [key: string]: string } = {
      'low_confidence': 'Low Confidence',
      'bias_detected': 'Bias Detected',
      'hallucination_risk': 'Hallucination Risk',
      'user_frustration': 'User Frustration',
      'emergency': 'Emergency',
      'complex_legal': 'Complex Legal Question',
      'complex_medical': 'Complex Medical Question',
      'explicit_request': 'Explicit Request',
      'repeated_clarification': 'Repeated Clarifications'
    };
    return labels[reason] || reason;
  };

  const colors = getPriorityColor(priority);

  return (
    <>
      {/* Overlay */}
      <div
        className="handoff-overlay"
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 1000,
          animation: 'fadeIn 0.3s ease'
        }}
      />

      {/* Dialog */}
      <div
        className="handoff-dialog"
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'white',
          borderRadius: 12,
          padding: 24,
          maxWidth: 500,
          width: '90%',
          maxHeight: '80vh',
          overflowY: 'auto',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          zIndex: 1001,
          animation: 'slideUp 0.3s ease'
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: 16,
          borderBottom: `3px solid ${colors.border}`,
          paddingBottom: 12
        }}>
          <div>
            <h2 style={{
              margin: 0,
              fontSize: 20,
              fontWeight: 700,
              color: '#2c3e50',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <span style={{ fontSize: 24 }}>👤</span>
              Human Assistance Available
              {priority === 'urgent' && (
                <span style={{
                  marginLeft: 8,
                  padding: '2px 8px',
                  backgroundColor: '#c62828',
                  color: 'white',
                  borderRadius: 8,
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase'
                }}>
                  URGENT
                </span>
              )}
            </h2>
            <div style={{
              marginTop: 4,
              padding: '4px 10px',
              backgroundColor: colors.bg,
              color: colors.text,
              borderRadius: 12,
              fontSize: 11,
              fontWeight: 600,
              display: 'inline-block'
            }}>
              Reason: {getReasonLabel(reason)}
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 24,
              color: '#757575',
              cursor: 'pointer',
              padding: 0,
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            title="Close"
          >
            ×
          </button>
        </div>

        {/* Message */}
        <div style={{
          padding: '16px',
          backgroundColor: '#f8f9fa',
          borderRadius: 8,
          marginBottom: 20,
          fontSize: 14,
          lineHeight: 1.6,
          color: '#2c3e50'
        }}>
          {message}
        </div>

        {/* Expert Info */}
        {expert && (
          <div style={{
            marginBottom: 20,
            padding: '12px',
            backgroundColor: '#e8f5e9',
            borderLeft: '4px solid #2e7d32',
            borderRadius: 4
          }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#2e7d32', marginBottom: 4 }}>
              Recommended Expert
            </div>
            <div style={{ fontSize: 14, color: '#1b5e20', fontWeight: 500 }}>
              {expert}
            </div>
          </div>
        )}

        {/* Contact Information */}
        <div style={{
          padding: 16,
          backgroundColor: 'white',
          border: '2px solid #e0e0e0',
          borderRadius: 8,
          marginBottom: 20
        }}>
          <div style={{
            fontSize: 14,
            fontWeight: 700,
            marginBottom: 12,
            color: '#2c3e50',
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}>
            <span>📞</span>
            Contact Information
          </div>

          {/* Name */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: '#757575', marginBottom: 2 }}>Organization</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#2c3e50' }}>
              {contact.name}
            </div>
          </div>

          {/* Phone */}
          {contact.phone && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: '#757575', marginBottom: 2 }}>Phone</div>
              <a
                href={`tel:${contact.phone}`}
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: '#1976d2',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                {contact.phone}
                <span style={{ fontSize: 12 }}>📱</span>
              </a>
            </div>
          )}

          {/* Email */}
          {contact.email && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: '#757575', marginBottom: 2 }}>Email</div>
              <a
                href={`mailto:${contact.email}`}
                style={{
                  fontSize: 14,
                  color: '#1976d2',
                  textDecoration: 'none',
                  wordBreak: 'break-word',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                {contact.email}
                <span style={{ fontSize: 12 }}>✉️</span>
              </a>
            </div>
          )}

          {/* Hours */}
          {contact.hours && (
            <div>
              <div style={{ fontSize: 11, color: '#757575', marginBottom: 2 }}>Hours</div>
              <div style={{ fontSize: 13, color: '#2c3e50' }}>
                {contact.hours}
              </div>
            </div>
          )}
        </div>

        {/* Emergency Notice */}
        {priority === 'urgent' && (
          <div style={{
            padding: 12,
            backgroundColor: '#ffebee',
            borderLeft: '4px solid #c62828',
            borderRadius: 4,
            marginBottom: 16
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#c62828' }}>
              ⚠️ If this is a life-threatening emergency, call 911 immediately.
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{
          display: 'flex',
          gap: 12,
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              backgroundColor: '#f5f5f5',
              border: 'none',
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 600,
              color: '#2c3e50',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e0e0e0'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
          >
            Continue Chatting
          </button>

          {contact.phone && (
            <a
              href={`tel:${contact.phone}`}
              style={{
                padding: '10px 20px',
                backgroundColor: '#1976d2',
                border: 'none',
                borderRadius: 6,
                fontSize: 14,
                fontWeight: 600,
                color: 'white',
                textDecoration: 'none',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
                display: 'inline-block'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1565c0'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1976d2'}
            >
              Call Now
            </a>
          )}
        </div>
      </div>
    </>
  );
};

export default HandoffDialog;
