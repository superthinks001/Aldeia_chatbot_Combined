/**
 * Audit Trail Logging Service (Sprint 4)
 *
 * Complete logging of all AI decisions, bias corrections, handoffs, and user interactions
 * for compliance, governance, and system improvement.
 */

import { supabase } from '../config/database';

export enum AuditEventType {
  // AI Decision Events
  INTENT_CLASSIFICATION = 'intent_classification',
  BIAS_DETECTION = 'bias_detection',
  BIAS_CORRECTION = 'bias_correction',
  FACT_CHECK = 'fact_check',
  HALLUCINATION_DETECTED = 'hallucination_detected',

  // Human Handoff Events
  HANDOFF_TRIGGERED = 'handoff_triggered',
  HANDOFF_COMPLETED = 'handoff_completed',
  HANDOFF_CANCELLED = 'handoff_cancelled',

  // User Interaction Events
  USER_MESSAGE = 'user_message',
  BOT_RESPONSE = 'bot_response',
  CLARIFICATION_REQUESTED = 'clarification_requested',

  // Proactive Events
  NOTIFICATION_SENT = 'notification_sent',
  SUGGESTION_DISPLAYED = 'suggestion_displayed',
  SUGGESTION_CLICKED = 'suggestion_clicked',

  // System Events
  ERROR_OCCURRED = 'error_occurred',
  WARNING_TRIGGERED = 'warning_triggered',
  CONFIG_CHANGED = 'config_changed'
}

export enum AuditSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

export interface AuditLogEntry {
  id?: string;
  timestamp: Date;
  eventType: AuditEventType;
  severity: AuditSeverity;
  userId?: number;
  conversationId?: string;
  sessionId?: string;

  // Event details
  message: string;
  details: any; // JSON object with event-specific data

  // AI decision tracking
  aiDecision?: {
    model?: string;
    confidence?: number;
    reasoning?: string;
    alternatives?: any[];
  };

  // Impact tracking
  userImpact?: 'low' | 'medium' | 'high' | 'critical';
  systemImpact?: 'low' | 'medium' | 'high' | 'critical';

  // Compliance tracking
  complianceFlags?: string[];
  reviewRequired?: boolean;
  reviewedBy?: number;
  reviewedAt?: Date;

  // Metadata
  metadata?: any;
}

/**
 * Log an audit event to the database
 */
export async function logAuditEvent(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<void> {
  try {
    const auditEntry = {
      ...entry,
      timestamp: new Date(),
      details: JSON.stringify(entry.details || {}),
      ai_decision: entry.aiDecision ? JSON.stringify(entry.aiDecision) : null,
      compliance_flags: entry.complianceFlags || [],
      metadata: entry.metadata ? JSON.stringify(entry.metadata) : null
    };

    const { error } = await supabase
      .from('audit_trail')
      .insert([{
        event_type: auditEntry.eventType,
        severity: auditEntry.severity,
        user_id: auditEntry.userId,
        conversation_id: auditEntry.conversationId,
        session_id: auditEntry.sessionId,
        message: auditEntry.message,
        details: auditEntry.details,
        ai_decision: auditEntry.ai_decision,
        user_impact: auditEntry.userImpact,
        system_impact: auditEntry.systemImpact,
        compliance_flags: auditEntry.compliance_flags,
        review_required: auditEntry.reviewRequired || false,
        reviewed_by: auditEntry.reviewedBy,
        reviewed_at: auditEntry.reviewedAt,
        metadata: auditEntry.metadata,
        created_at: auditEntry.timestamp
      }]);

    if (error) {
      console.error('Failed to log audit event:', error);
      // Don't throw - audit logging failure shouldn't break the application
    }
  } catch (err) {
    console.error('Audit logging error:', err);
  }
}

/**
 * Log an intent classification decision
 */
export async function logIntentClassification(data: {
  userId?: number;
  conversationId?: string;
  message: string;
  primaryIntent: string;
  secondaryIntents: string[];
  confidence: number;
  entities: any;
  requiresClarification: boolean;
}): Promise<void> {
  await logAuditEvent({
    eventType: AuditEventType.INTENT_CLASSIFICATION,
    severity: AuditSeverity.INFO,
    userId: data.userId,
    conversationId: data.conversationId,
    message: `Intent classified as '${data.primaryIntent}' with ${(data.confidence * 100).toFixed(1)}% confidence`,
    details: {
      message: data.message,
      primaryIntent: data.primaryIntent,
      secondaryIntents: data.secondaryIntents,
      confidence: data.confidence,
      entities: data.entities,
      requiresClarification: data.requiresClarification
    },
    aiDecision: {
      confidence: data.confidence,
      reasoning: `Primary: ${data.primaryIntent}, Secondary: ${data.secondaryIntents.join(', ')}`,
      alternatives: data.secondaryIntents
    },
    userImpact: data.requiresClarification ? 'medium' : 'low',
    reviewRequired: data.confidence < 0.5
  });
}

/**
 * Log a bias detection event
 */
export async function logBiasDetection(data: {
  userId?: number;
  conversationId?: string;
  text: string;
  detected: boolean;
  biasScore: number;
  biasTypes: string[];
  patterns: string[];
  corrected: boolean;
  correctedText?: string;
}): Promise<void> {
  await logAuditEvent({
    eventType: AuditEventType.BIAS_DETECTION,
    severity: data.biasScore > 0.7 ? AuditSeverity.WARNING : AuditSeverity.INFO,
    userId: data.userId,
    conversationId: data.conversationId,
    message: `Bias ${data.detected ? 'detected' : 'not detected'} (score: ${(data.biasScore * 100).toFixed(1)}%)`,
    details: {
      text: data.text.substring(0, 500),
      detected: data.detected,
      biasScore: data.biasScore,
      biasTypes: data.biasTypes,
      patterns: data.patterns,
      corrected: data.corrected,
      correctedText: data.correctedText?.substring(0, 500)
    },
    aiDecision: {
      confidence: data.biasScore,
      reasoning: `Bias types: ${data.biasTypes.join(', ')}. Patterns: ${data.patterns.join(', ')}`
    },
    userImpact: data.biasScore > 0.6 ? 'high' : 'medium',
    systemImpact: 'medium',
    complianceFlags: data.detected ? ['bias_detected'] : [],
    reviewRequired: data.biasScore > 0.7
  });
}

/**
 * Log a bias correction event
 */
export async function logBiasCorrection(data: {
  userId?: number;
  conversationId?: string;
  originalText: string;
  correctedText: string;
  biasScore: number;
  biasTypes: string[];
}): Promise<void> {
  await logAuditEvent({
    eventType: AuditEventType.BIAS_CORRECTION,
    severity: AuditSeverity.WARNING,
    userId: data.userId,
    conversationId: data.conversationId,
    message: `Bias correction applied (score: ${(data.biasScore * 100).toFixed(1)}%)`,
    details: {
      originalText: data.originalText.substring(0, 500),
      correctedText: data.correctedText.substring(0, 500),
      biasScore: data.biasScore,
      biasTypes: data.biasTypes
    },
    userImpact: 'high',
    systemImpact: 'medium',
    complianceFlags: ['bias_corrected'],
    reviewRequired: true
  });
}

/**
 * Log a fact-checking event
 */
export async function logFactCheck(data: {
  userId?: number;
  conversationId?: string;
  text: string;
  verified: boolean;
  reliability: string;
  hallucinationRisk: number;
  sources: any[];
  conflicts: any[];
}): Promise<void> {
  await logAuditEvent({
    eventType: AuditEventType.FACT_CHECK,
    severity: data.hallucinationRisk > 0.6 ? AuditSeverity.WARNING : AuditSeverity.INFO,
    userId: data.userId,
    conversationId: data.conversationId,
    message: `Fact check: ${data.verified ? 'verified' : 'unverified'} (reliability: ${data.reliability})`,
    details: {
      text: data.text.substring(0, 500),
      verified: data.verified,
      reliability: data.reliability,
      hallucinationRisk: data.hallucinationRisk,
      sources: data.sources.map(s => s.name),
      conflicts: data.conflicts
    },
    aiDecision: {
      confidence: 1 - data.hallucinationRisk,
      reasoning: `Reliability: ${data.reliability}. Sources: ${data.sources.length}. Conflicts: ${data.conflicts.length}`
    },
    userImpact: data.hallucinationRisk > 0.6 ? 'high' : 'low',
    complianceFlags: data.hallucinationRisk > 0.6 ? ['high_hallucination_risk'] : [],
    reviewRequired: data.hallucinationRisk > 0.7
  });
}

/**
 * Log a hallucination detection event
 */
export async function logHallucinationDetection(data: {
  userId?: number;
  conversationId?: string;
  text: string;
  hallucinationRisk: number;
  indicators: string[];
  preventionAction: string;
}): Promise<void> {
  await logAuditEvent({
    eventType: AuditEventType.HALLUCINATION_DETECTED,
    severity: AuditSeverity.WARNING,
    userId: data.userId,
    conversationId: data.conversationId,
    message: `Hallucination risk detected (${(data.hallucinationRisk * 100).toFixed(1)}%)`,
    details: {
      text: data.text.substring(0, 500),
      hallucinationRisk: data.hallucinationRisk,
      indicators: data.indicators,
      preventionAction: data.preventionAction
    },
    userImpact: 'high',
    systemImpact: 'medium',
    complianceFlags: ['hallucination_detected'],
    reviewRequired: true
  });
}

/**
 * Log a human handoff event
 */
export async function logHandoffEvent(data: {
  userId?: number;
  conversationId?: string;
  reason: string;
  priority: string;
  expert: string;
  trigger: string;
  contextSummary: string;
  status: 'triggered' | 'completed' | 'cancelled';
}): Promise<void> {
  const eventType = data.status === 'triggered' ? AuditEventType.HANDOFF_TRIGGERED :
                    data.status === 'completed' ? AuditEventType.HANDOFF_COMPLETED :
                    AuditEventType.HANDOFF_CANCELLED;

  const severity = data.priority === 'urgent' ? AuditSeverity.CRITICAL :
                   data.priority === 'high' ? AuditSeverity.WARNING :
                   AuditSeverity.INFO;

  await logAuditEvent({
    eventType,
    severity,
    userId: data.userId,
    conversationId: data.conversationId,
    message: `Handoff ${data.status}: ${data.reason} (priority: ${data.priority})`,
    details: {
      reason: data.reason,
      priority: data.priority,
      expert: data.expert,
      trigger: data.trigger,
      contextSummary: data.contextSummary,
      status: data.status
    },
    userImpact: data.priority === 'urgent' ? 'critical' : 'high',
    systemImpact: 'medium',
    complianceFlags: ['human_handoff'],
    reviewRequired: data.status === 'triggered'
  });
}

/**
 * Log an error event
 */
export async function logError(data: {
  userId?: number;
  conversationId?: string;
  error: Error | string;
  context: any;
  severity?: AuditSeverity;
}): Promise<void> {
  const errorMessage = data.error instanceof Error ? data.error.message : data.error;
  const errorStack = data.error instanceof Error ? data.error.stack : undefined;

  await logAuditEvent({
    eventType: AuditEventType.ERROR_OCCURRED,
    severity: data.severity || AuditSeverity.ERROR,
    userId: data.userId,
    conversationId: data.conversationId,
    message: `Error: ${errorMessage}`,
    details: {
      error: errorMessage,
      stack: errorStack,
      context: data.context
    },
    systemImpact: 'high',
    reviewRequired: true
  });
}

/**
 * Query audit trail logs
 */
export async function queryAuditTrail(filters: {
  eventType?: AuditEventType;
  severity?: AuditSeverity;
  userId?: number;
  conversationId?: string;
  startDate?: Date;
  endDate?: Date;
  reviewRequired?: boolean;
  limit?: number;
  offset?: number;
}): Promise<{ data: any[]; total: number }> {
  try {
    let query = supabase
      .from('audit_trail')
      .select('*', { count: 'exact' });

    if (filters.eventType) {
      query = query.eq('event_type', filters.eventType);
    }
    if (filters.severity) {
      query = query.eq('severity', filters.severity);
    }
    if (filters.userId) {
      query = query.eq('user_id', filters.userId);
    }
    if (filters.conversationId) {
      query = query.eq('conversation_id', filters.conversationId);
    }
    if (filters.startDate) {
      query = query.gte('created_at', filters.startDate.toISOString());
    }
    if (filters.endDate) {
      query = query.lte('created_at', filters.endDate.toISOString());
    }
    if (filters.reviewRequired !== undefined) {
      query = query.eq('review_required', filters.reviewRequired);
    }

    query = query
      .order('created_at', { ascending: false })
      .limit(filters.limit || 100)
      .range(filters.offset || 0, (filters.offset || 0) + (filters.limit || 100) - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Failed to query audit trail:', error);
      return { data: [], total: 0 };
    }

    return {
      data: data || [],
      total: count || 0
    };
  } catch (err) {
    console.error('Audit trail query error:', err);
    return { data: [], total: 0 };
  }
}

/**
 * Get audit statistics
 */
export async function getAuditStatistics(filters: {
  startDate?: Date;
  endDate?: Date;
}): Promise<any> {
  try {
    const { data, error } = await supabase
      .rpc('get_audit_statistics', {
        start_date: filters.startDate?.toISOString(),
        end_date: filters.endDate?.toISOString()
      });

    if (error) {
      console.error('Failed to get audit statistics:', error);
      return {};
    }

    return data;
  } catch (err) {
    console.error('Audit statistics error:', err);
    return {};
  }
}
