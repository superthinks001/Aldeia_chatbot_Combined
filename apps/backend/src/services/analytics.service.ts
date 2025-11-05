import { supabase } from '../config/database';
import { logger } from '../utils/logger';

export interface AnalyticsEvent {
  id?: number;
  user_id: number;
  conversation_id?: string; // UUID
  event_type: string;
  message?: string;
  metadata?: Record<string, any>;
  created_at?: string;
}

export class AnalyticsService {
  /**
   * Log an analytics event
   */
  static async logEvent(event: AnalyticsEvent): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('analytics')
        .insert({
          user_id: event.user_id,
          conversation_id: event.conversation_id,
          event_type: event.event_type,
          message: event.message,
          metadata: event.metadata ? JSON.stringify(event.metadata) : null
        });

      if (error) {
        logger.error('Failed to log analytics event:', error);
        return false;
      }

      return true;
    } catch (error) {
      logger.error('Error in logEvent:', error);
      return false;
    }
  }

  /**
   * Get analytics summary for a user
   */
  static async getUserAnalyticsSummary(userId: number): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('analytics')
        .select('event_type, metadata')
        .eq('user_id', userId);

      if (error) {
        logger.error('Failed to get user analytics summary:', error);
        return null;
      }

      // Count events by type
      const summary: Record<string, number> = {};
      data?.forEach((row: any) => {
        summary[row.event_type] = (summary[row.event_type] || 0) + 1;
      });

      return {
        userId,
        totalEvents: data?.length || 0,
        eventCounts: summary
      };
    } catch (error) {
      logger.error('Error in getUserAnalyticsSummary:', error);
      return null;
    }
  }

  /**
   * Get overall analytics summary
   */
  static async getOverallSummary(): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('analytics')
        .select('event_type, user_id');

      if (error) {
        logger.error('Failed to get overall analytics summary:', error);
        return null;
      }

      // Count events by type
      const eventCounts: Record<string, number> = {};
      const uniqueUsers = new Set<number>();

      data?.forEach((row: any) => {
        eventCounts[row.event_type] = (eventCounts[row.event_type] || 0) + 1;
        uniqueUsers.add(row.user_id);
      });

      return {
        totalEvents: data?.length || 0,
        totalUsers: uniqueUsers.size,
        eventCounts
      };
    } catch (error) {
      logger.error('Error in getOverallSummary:', error);
      return null;
    }
  }

  /**
   * Get recent analytics events
   */
  static async getRecentEvents(
    limit: number = 100,
    userId?: number
  ): Promise<AnalyticsEvent[]> {
    try {
      let query = supabase
        .from('analytics')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('Failed to get recent events:', error);
        return [];
      }

      return (data as AnalyticsEvent[]) || [];
    } catch (error) {
      logger.error('Error in getRecentEvents:', error);
      return [];
    }
  }

  /**
   * Get analytics by conversation
   */
  static async getConversationAnalytics(
    conversationId: number
  ): Promise<AnalyticsEvent[]> {
    try {
      const { data, error } = await supabase
        .from('analytics')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        logger.error('Failed to get conversation analytics:', error);
        return [];
      }

      return (data as AnalyticsEvent[]) || [];
    } catch (error) {
      logger.error('Error in getConversationAnalytics:', error);
      return [];
    }
  }

  /**
   * Count events by type for a user
   */
  static async countEventsByType(
    userId: number,
    eventType: string
  ): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('analytics')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('event_type', eventType);

      if (error) {
        logger.error('Failed to count events by type:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      logger.error('Error in countEventsByType:', error);
      return 0;
    }
  }
}

export default AnalyticsService;
