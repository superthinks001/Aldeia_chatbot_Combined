/**
 * AI Governance Dashboard Service (Sprint 4)
 *
 * Aggregates data from audit trails, bias logs, handoffs, and analytics
 * to provide comprehensive governance insights and system health monitoring.
 */

import { supabase } from '../config/database';
import { queryAuditTrail, AuditEventType, AuditSeverity } from './audit-trail.service';

export interface GovernanceDashboardData {
  overview: {
    totalMessages: number;
    totalHandoffs: number;
    biasDetectionRate: number;
    hallucinationRate: number;
    averageConfidence: number;
    systemHealth: 'healthy' | 'warning' | 'critical';
  };

  biasMetrics: {
    totalDetected: number;
    totalCorrected: number;
    byType: { [type: string]: number };
    bySeverity: { [severity: string]: number };
    trend: Array<{ date: string; count: number }>;
  };

  hallucinationMetrics: {
    totalIncidents: number;
    averageRisk: number;
    byReliability: { [reliability: string]: number };
    preventedCount: number;
    trend: Array<{ date: string; count: number }>;
  };

  handoffMetrics: {
    totalHandoffs: number;
    byReason: { [reason: string]: number };
    byPriority: { [priority: string]: number };
    averageResponseTime?: number;
    completionRate: number;
  };

  factCheckMetrics: {
    totalChecks: number;
    verifiedCount: number;
    verificationRate: number;
    byReliability: { [reliability: string]: number };
    conflictsDetected: number;
  };

  intentClassificationMetrics: {
    totalClassifications: number;
    averageConfidence: number;
    clarificationRate: number;
    byIntent: { [intent: string]: number };
  };

  complianceMetrics: {
    flagsRaised: number;
    reviewsPending: number;
    reviewsCompleted: number;
    criticalIssues: number;
  };

  recentEvents: Array<{
    id: string;
    timestamp: Date;
    eventType: string;
    severity: string;
    message: string;
    userImpact?: string;
  }>;
}

/**
 * Get comprehensive governance dashboard data
 */
export async function getDashboardData(filters: {
  startDate?: Date;
  endDate?: Date;
  userId?: number;
}): Promise<GovernanceDashboardData> {
  const now = new Date();
  const startDate = filters.startDate || new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // Last 30 days
  const endDate = filters.endDate || now;

  const [
    overview,
    biasMetrics,
    hallucinationMetrics,
    handoffMetrics,
    factCheckMetrics,
    intentMetrics,
    complianceMetrics,
    recentEvents
  ] = await Promise.all([
    getOverviewMetrics(startDate, endDate, filters.userId),
    getBiasMetrics(startDate, endDate, filters.userId),
    getHallucinationMetrics(startDate, endDate, filters.userId),
    getHandoffMetrics(startDate, endDate, filters.userId),
    getFactCheckMetrics(startDate, endDate, filters.userId),
    getIntentClassificationMetrics(startDate, endDate, filters.userId),
    getComplianceMetrics(startDate, endDate, filters.userId),
    getRecentEvents(filters.userId)
  ]);

  return {
    overview,
    biasMetrics,
    hallucinationMetrics,
    handoffMetrics,
    factCheckMetrics,
    intentClassificationMetrics: intentMetrics,
    complianceMetrics,
    recentEvents
  };
}

/**
 * Get overview metrics
 */
async function getOverviewMetrics(startDate: Date, endDate: Date, userId?: number): Promise<any> {
  try {
    // Get total messages
    let messageQuery = supabase
      .from('audit_trail')
      .select('*', { count: 'exact', head: true })
      .eq('event_type', AuditEventType.USER_MESSAGE)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (userId) {
      messageQuery = messageQuery.eq('user_id', userId);
    }

    const { count: totalMessages } = await messageQuery;

    // Get total handoffs
    const { data: handoffs } = await queryAuditTrail({
      eventType: AuditEventType.HANDOFF_TRIGGERED,
      startDate,
      endDate,
      userId
    });

    // Get bias detection rate
    const { data: biasEvents } = await queryAuditTrail({
      eventType: AuditEventType.BIAS_DETECTION,
      startDate,
      endDate,
      userId
    });

    const biasDetected = biasEvents.filter((e: any) => JSON.parse(e.details).detected).length;
    const biasDetectionRate = totalMessages ? (biasDetected / totalMessages) * 100 : 0;

    // Get hallucination rate
    const { data: factCheckEvents } = await queryAuditTrail({
      eventType: AuditEventType.FACT_CHECK,
      startDate,
      endDate,
      userId
    });

    const highHallucinationRisk = factCheckEvents.filter((e: any) => {
      const details = JSON.parse(e.details);
      return details.hallucinationRisk > 0.6;
    }).length;
    const hallucinationRate = factCheckEvents.length ? (highHallucinationRisk / factCheckEvents.length) * 100 : 0;

    // Get average confidence
    const { data: intentEvents } = await queryAuditTrail({
      eventType: AuditEventType.INTENT_CLASSIFICATION,
      startDate,
      endDate,
      userId
    });

    const totalConfidence = intentEvents.reduce((sum: number, e: any) => {
      const details = JSON.parse(e.details);
      return sum + (details.confidence || 0);
    }, 0);
    const averageConfidence = intentEvents.length ? (totalConfidence / intentEvents.length) * 100 : 0;

    // Determine system health
    let systemHealth: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (hallucinationRate > 10 || biasDetectionRate > 20) {
      systemHealth = 'critical';
    } else if (hallucinationRate > 5 || biasDetectionRate > 10 || averageConfidence < 70) {
      systemHealth = 'warning';
    }

    return {
      totalMessages: totalMessages || 0,
      totalHandoffs: handoffs.length,
      biasDetectionRate: Math.round(biasDetectionRate * 10) / 10,
      hallucinationRate: Math.round(hallucinationRate * 10) / 10,
      averageConfidence: Math.round(averageConfidence * 10) / 10,
      systemHealth
    };
  } catch (err) {
    console.error('Error getting overview metrics:', err);
    return {
      totalMessages: 0,
      totalHandoffs: 0,
      biasDetectionRate: 0,
      hallucinationRate: 0,
      averageConfidence: 0,
      systemHealth: 'healthy'
    };
  }
}

/**
 * Get bias metrics
 */
async function getBiasMetrics(startDate: Date, endDate: Date, userId?: number): Promise<any> {
  const { data: biasEvents } = await queryAuditTrail({
    eventType: AuditEventType.BIAS_DETECTION,
    startDate,
    endDate,
    userId
  });

  const { data: correctionEvents } = await queryAuditTrail({
    eventType: AuditEventType.BIAS_CORRECTION,
    startDate,
    endDate,
    userId
  });

  const detected = biasEvents.filter((e: any) => JSON.parse(e.details).detected);

  // Count by type
  const byType: { [type: string]: number } = {};
  detected.forEach((e: any) => {
    const details = JSON.parse(e.details);
    details.biasTypes.forEach((type: string) => {
      byType[type] = (byType[type] || 0) + 1;
    });
  });

  // Count by severity
  const bySeverity: { [severity: string]: number } = {};
  detected.forEach((e: any) => {
    bySeverity[e.severity] = (bySeverity[e.severity] || 0) + 1;
  });

  // Generate trend data (last 7 days)
  const trend = generateTrendData(detected, 7);

  return {
    totalDetected: detected.length,
    totalCorrected: correctionEvents.length,
    byType,
    bySeverity,
    trend
  };
}

/**
 * Get hallucination metrics
 */
async function getHallucinationMetrics(startDate: Date, endDate: Date, userId?: number): Promise<any> {
  const { data: factCheckEvents } = await queryAuditTrail({
    eventType: AuditEventType.FACT_CHECK,
    startDate,
    endDate,
    userId
  });

  const { data: hallucinationEvents } = await queryAuditTrail({
    eventType: AuditEventType.HALLUCINATION_DETECTED,
    startDate,
    endDate,
    userId
  });

  const totalRisk = factCheckEvents.reduce((sum: number, e: any) => {
    const details = JSON.parse(e.details);
    return sum + (details.hallucinationRisk || 0);
  }, 0);
  const averageRisk = factCheckEvents.length ? (totalRisk / factCheckEvents.length) * 100 : 0;

  // Count by reliability
  const byReliability: { [reliability: string]: number } = {};
  factCheckEvents.forEach((e: any) => {
    const details = JSON.parse(e.details);
    const reliability = details.reliability || 'unknown';
    byReliability[reliability] = (byReliability[reliability] || 0) + 1;
  });

  // Generate trend
  const trend = generateTrendData(hallucinationEvents, 7);

  return {
    totalIncidents: hallucinationEvents.length,
    averageRisk: Math.round(averageRisk * 10) / 10,
    byReliability,
    preventedCount: hallucinationEvents.filter((e: any) => {
      const details = JSON.parse(e.details);
      return details.preventionAction !== 'none';
    }).length,
    trend
  };
}

/**
 * Get handoff metrics
 */
async function getHandoffMetrics(startDate: Date, endDate: Date, userId?: number): Promise<any> {
  const { data: handoffEvents } = await queryAuditTrail({
    eventType: AuditEventType.HANDOFF_TRIGGERED,
    startDate,
    endDate,
    userId
  });

  const { data: completedEvents } = await queryAuditTrail({
    eventType: AuditEventType.HANDOFF_COMPLETED,
    startDate,
    endDate,
    userId
  });

  // Count by reason
  const byReason: { [reason: string]: number } = {};
  handoffEvents.forEach((e: any) => {
    const details = JSON.parse(e.details);
    byReason[details.reason] = (byReason[details.reason] || 0) + 1;
  });

  // Count by priority
  const byPriority: { [priority: string]: number } = {};
  handoffEvents.forEach((e: any) => {
    const details = JSON.parse(e.details);
    byPriority[details.priority] = (byPriority[details.priority] || 0) + 1;
  });

  const completionRate = handoffEvents.length ? (completedEvents.length / handoffEvents.length) * 100 : 0;

  return {
    totalHandoffs: handoffEvents.length,
    byReason,
    byPriority,
    completionRate: Math.round(completionRate * 10) / 10
  };
}

/**
 * Get fact-check metrics
 */
async function getFactCheckMetrics(startDate: Date, endDate: Date, userId?: number): Promise<any> {
  const { data: factCheckEvents } = await queryAuditTrail({
    eventType: AuditEventType.FACT_CHECK,
    startDate,
    endDate,
    userId
  });

  const verified = factCheckEvents.filter((e: any) => JSON.parse(e.details).verified);
  const verificationRate = factCheckEvents.length ? (verified.length / factCheckEvents.length) * 100 : 0;

  // Count by reliability
  const byReliability: { [reliability: string]: number } = {};
  factCheckEvents.forEach((e: any) => {
    const details = JSON.parse(e.details);
    byReliability[details.reliability] = (byReliability[details.reliability] || 0) + 1;
  });

  const conflictsDetected = factCheckEvents.reduce((sum: number, e: any) => {
    const details = JSON.parse(e.details);
    return sum + (details.conflicts?.length || 0);
  }, 0);

  return {
    totalChecks: factCheckEvents.length,
    verifiedCount: verified.length,
    verificationRate: Math.round(verificationRate * 10) / 10,
    byReliability,
    conflictsDetected
  };
}

/**
 * Get intent classification metrics
 */
async function getIntentClassificationMetrics(startDate: Date, endDate: Date, userId?: number): Promise<any> {
  const { data: intentEvents } = await queryAuditTrail({
    eventType: AuditEventType.INTENT_CLASSIFICATION,
    startDate,
    endDate,
    userId
  });

  const totalConfidence = intentEvents.reduce((sum: number, e: any) => {
    const details = JSON.parse(e.details);
    return sum + (details.confidence || 0);
  }, 0);
  const averageConfidence = intentEvents.length ? (totalConfidence / intentEvents.length) * 100 : 0;

  const clarifications = intentEvents.filter((e: any) => JSON.parse(e.details).requiresClarification);
  const clarificationRate = intentEvents.length ? (clarifications.length / intentEvents.length) * 100 : 0;

  // Count by intent
  const byIntent: { [intent: string]: number } = {};
  intentEvents.forEach((e: any) => {
    const details = JSON.parse(e.details);
    byIntent[details.primaryIntent] = (byIntent[details.primaryIntent] || 0) + 1;
  });

  return {
    totalClassifications: intentEvents.length,
    averageConfidence: Math.round(averageConfidence * 10) / 10,
    clarificationRate: Math.round(clarificationRate * 10) / 10,
    byIntent
  };
}

/**
 * Get compliance metrics
 */
async function getComplianceMetrics(startDate: Date, endDate: Date, userId?: number): Promise<any> {
  let query = supabase
    .from('audit_trail')
    .select('*')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());

  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { data: allEvents } = await query;

  const flagsRaised = allEvents?.filter((e: any) => e.compliance_flags && e.compliance_flags.length > 0).length || 0;
  const reviewsPending = allEvents?.filter((e: any) => e.review_required && !e.reviewed_at).length || 0;
  const reviewsCompleted = allEvents?.filter((e: any) => e.review_required && e.reviewed_at).length || 0;
  const criticalIssues = allEvents?.filter((e: any) => e.severity === AuditSeverity.CRITICAL).length || 0;

  return {
    flagsRaised,
    reviewsPending,
    reviewsCompleted,
    criticalIssues
  };
}

/**
 * Get recent events
 */
async function getRecentEvents(userId?: number): Promise<any[]> {
  const { data: events } = await queryAuditTrail({
    userId,
    limit: 20
  });

  return events.map((e: any) => ({
    id: e.id,
    timestamp: new Date(e.created_at),
    eventType: e.event_type,
    severity: e.severity,
    message: e.message,
    userImpact: e.user_impact
  }));
}

/**
 * Generate trend data for the last N days
 */
function generateTrendData(events: any[], days: number): Array<{ date: string; count: number }> {
  const now = new Date();
  const trend: Array<{ date: string; count: number }> = [];

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().split('T')[0];

    const count = events.filter((e: any) => {
      const eventDate = new Date(e.created_at).toISOString().split('T')[0];
      return eventDate === dateStr;
    }).length;

    trend.push({ date: dateStr, count });
  }

  return trend;
}

/**
 * Export dashboard data as CSV
 */
export async function exportDashboardData(filters: {
  startDate?: Date;
  endDate?: Date;
  eventTypes?: AuditEventType[];
}): Promise<string> {
  const { data: events } = await queryAuditTrail({
    startDate: filters.startDate,
    endDate: filters.endDate,
    limit: 10000
  });

  if (filters.eventTypes && filters.eventTypes.length > 0) {
    const filtered = events.filter((e: any) => filters.eventTypes!.includes(e.event_type));
    return convertToCSV(filtered);
  }

  return convertToCSV(events);
}

function convertToCSV(data: any[]): string {
  if (!data || data.length === 0) {
    return '';
  }

  const headers = ['id', 'timestamp', 'event_type', 'severity', 'user_id', 'conversation_id', 'message', 'user_impact'];
  const rows = data.map((e: any) => [
    e.id,
    e.created_at,
    e.event_type,
    e.severity,
    e.user_id || '',
    e.conversation_id || '',
    e.message.replace(/,/g, ';'),
    e.user_impact || ''
  ]);

  const csv = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  return csv;
}
