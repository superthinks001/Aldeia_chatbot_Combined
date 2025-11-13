import React from 'react';
import BiasWarning from './BiasWarning';
import EthicalAIIndicators from './EthicalAIIndicators';

export interface Message {
  sender: 'user' | 'bot' | 'docs';
  text?: string;
  timestamp?: Date | string;
  confidence?: number;
  bias?: boolean;
  uncertainty?: boolean;
  hallucination?: boolean;
  grounded?: boolean;
  sources?: string[];
  matches?: { text: string; source: string; score: number; chunk_index: number }[];
  isGreeting?: boolean;
  intent?: string;
  context?: any;
  isClarification?: boolean;

  // Sprint 2: Enhanced bias analysis
  biasAnalysis?: {
    detected: boolean;
    score: number;
    types: string[];
    severity: 'low' | 'medium' | 'high';
    corrected: boolean;
  };

  // Sprint 2: Fact-checking results
  hallucinationRisk?: number;
  factCheck?: {
    verified: boolean;
    reliability: 'high' | 'medium' | 'low' | 'unverified';
    sources: string[];
    conflicts?: any[];
    recommendations: string[];
  };

  // Sprint 2: Enhanced intent classification
  intentConfidence?: number;
  secondaryIntents?: string[];
  entities?: {
    location?: string;
    dateTime?: string;
    documentType?: string;
    topic?: string;
  };

  // Sprint 2/3: Human handoff
  handoffRequired?: boolean;
  handoffReason?: string;
  handoffPriority?: 'low' | 'medium' | 'high' | 'urgent';
  handoffMessage?: string;
  handoffContact?: {
    name: string;
    phone?: string;
    email?: string;
    hours?: string;
  };
  handoffExpert?: string;

  // Sprint 2/3: Proactive notifications
  notification?: {
    id: string;
    type: 'deadline' | 'update' | 'resource' | 'weather' | 'safety';
    title: string;
    message: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    location?: string;
    actionUrl?: string;
    actionText?: string;
  };
  notifications?: any[];
}

interface MessageListProps {
  messages: Message[];
  history?: any[];
  isFullScreen?: boolean;
}

const MessageList: React.FC<MessageListProps> = ({ messages, history, isFullScreen }) => (
  <div
    style={{ maxHeight: 240, overflowY: 'auto', padding: 8 }}
    aria-live="polite"
    role="log"
  >
    {messages.map((msg, idx) => (
      <div key={idx} style={{
        marginBottom: 12,
        textAlign: msg.sender === 'user' ? 'right' : 'left',
      }}>
        {msg.sender === 'docs' && msg.matches ? (
          <div style={{
            background: '#fffde7',
            border: '1px solid #ffe082',
            borderRadius: 8,
            padding: '8px 12px',
            maxWidth: isFullScreen ? '100%' : 320,
            margin: '0 auto',
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: 6 }}>Relevant Documents:</div>
            {(() => {
              // Filter out duplicate source+chunk_index
              const seen = new Set<string>();
              const uniqueMatches = msg.matches.filter(match => {
                const key = `${match.source}_${match.chunk_index}`;
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
              });
              return uniqueMatches.map((match, i) => {
                let folder = '';
                if (match.source.toLowerCase().includes('pasadena')) {
                  folder = 'Pasadena County';
                } else {
                  folder = 'LA County';
                }
                const pdfUrl = `/${folder}/${encodeURIComponent(match.source)}`;
                return (
                  <div key={i} style={{ fontSize: 12, marginBottom: 4 }}>
                    <a
                      href={pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#1976d2', textDecoration: 'underline', cursor: 'pointer' }}
                    >
                      {match.text.length > 220 ? match.text.slice(0, 220) + '...' : match.text}
                    </a>
                    <div style={{ color: '#764ba2', fontSize: 11 }}>Source: {match.source}</div>
                  </div>
                );
              });
            })()}
          </div>
        ) : (
          <div style={{
            display: 'inline-block',
            background: msg.sender === 'user' 
              ? '#e3f2fd' 
              : msg.isGreeting 
                ? 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)'
                : '#f8f9fa',
            borderRadius: 12,
            padding: msg.isGreeting ? '16px 20px' : '8px 12px',
            minWidth: 60,
            maxWidth: isFullScreen ? '100%' : 300,
            wordBreak: 'break-word',
            border: msg.isGreeting ? '2px solid #667eea' : '1px solid #e0e0e0',
            boxShadow: msg.isGreeting ? '0 4px 12px rgba(102, 126, 234, 0.15)' : '0 1px 3px rgba(0,0,0,0.1)',
          }}>
            <div style={{ 
              fontSize: msg.isGreeting ? 14 : 13,
              lineHeight: 1.4,
              color: msg.isGreeting ? '#2c3e50' : '#333'
            }}>
              {msg.text}
            </div>
            {/* Multi-turn context badge */}
            {msg.sender === 'bot' && msg.context && msg.context.history && msg.context.history.length > 1 && (
              <div style={{ marginTop: 4, fontSize: 11, color: '#764ba2', fontWeight: 500 }}>
                Contextual answer (multi-turn)
              </div>
            )}
            {/* Admin/debug: show last few turns of history */}
            {msg.sender === 'bot' && msg.context && msg.context.history && (
              <details style={{ marginTop: 4, fontSize: 11, color: '#333' }}>
                <summary>Show conversation history</summary>
                <ul style={{ paddingLeft: 16 }}>
                  {msg.context.history.slice(-3).map((turn: any, i: number) => (
                    <li key={i}><b>{turn.sender}:</b> {turn.text}</li>
                  ))}
                </ul>
              </details>
            )}
            {/* Ethical AI Indicators for bot messages */}
            {msg.sender === 'bot' && !msg.isGreeting && (
              <EthicalAIIndicators
                confidence={msg.confidence}
                bias={msg.bias}
                uncertainty={msg.uncertainty}
                hallucination={msg.hallucination}
                grounded={msg.grounded}
                sources={msg.sources}
                size="small"
                showDetails={false}
              />
            )}
          </div>
        )}
      </div>
    ))}
  </div>
);

export default MessageList;
