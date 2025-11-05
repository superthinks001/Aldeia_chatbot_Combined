import { supabase } from '../config/database';
import { logger } from '../utils/logger';

export interface Conversation {
  id: string; // UUID
  user_id: number;
  title?: string;
  status?: string; // 'active', 'archived', 'deleted'
  language?: string;
  created_at: string;
  updated_at?: string;
}

export interface ConversationMessage {
  id: number;
  conversation_id: string; // UUID
  sender: 'user' | 'bot';
  message: string;
  intent?: string;
  confidence?: number;
  bias?: boolean;
  ambiguous?: boolean;
  metadata?: Record<string, any>;
  created_at: string;
}

export class ConversationsService {
  /**
   * Create or get existing conversation for a user
   */
  static async createOrGetConversation(
    userId: number,
    conversationId?: string,
    title?: string,
    language?: string
  ): Promise<Conversation | null> {
    try {
      // If conversationId provided, fetch existing conversation
      if (conversationId) {
        const { data, error } = await supabase
          .from('conversations')
          .select('*')
          .eq('id', conversationId) // UUID - use as string
          .eq('user_id', userId)
          .single();

        if (!error && data) {
          return data as Conversation;
        }
      }

      // Create new conversation
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          user_id: userId,
          title: title || null,
          status: 'active',
          language: language || 'en'
          // created_at and updated_at set by default
        })
        .select()
        .single();

      if (error) {
        logger.error('Failed to create conversation:', error);
        return null;
      }

      return data as Conversation;
    } catch (error) {
      logger.error('Error in createOrGetConversation:', error);
      return null;
    }
  }

  /**
   * Add message to conversation
   */
  static async addMessage(
    conversationId: string, // UUID
    sender: 'user' | 'bot',
    message: string,
    metadata?: {
      intent?: string;
      confidence?: number;
      bias?: boolean;
      ambiguous?: boolean;
      [key: string]: any;
    }
  ): Promise<ConversationMessage | null> {
    try {
      const { data, error } = await supabase
        .from('conversation_messages')
        .insert({
          conversation_id: conversationId,
          sender,
          message,
          intent: metadata?.intent,
          confidence: metadata?.confidence,
          bias: metadata?.bias,
          ambiguous: metadata?.ambiguous,
          metadata: metadata ? JSON.stringify(metadata) : null
        })
        .select()
        .single();

      if (error) {
        logger.error('Failed to add message:', error);
        return null;
      }

      // Update conversation's updated_at timestamp (trigger handles this automatically)
      // No need to manually update - PostgreSQL trigger updates updated_at on any conversation update

      return data as ConversationMessage;
    } catch (error) {
      logger.error('Error in addMessage:', error);
      return null;
    }
  }

  /**
   * Get conversation history
   */
  static async getConversationHistory(
    conversationId: string, // UUID
    limit: number = 10
  ): Promise<ConversationMessage[]> {
    try {
      const { data, error } = await supabase
        .from('conversation_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(limit);

      if (error) {
        logger.error('Failed to get conversation history:', error);
        return [];
      }

      return (data as ConversationMessage[]) || [];
    } catch (error) {
      logger.error('Error in getConversationHistory:', error);
      return [];
    }
  }

  /**
   * Get user's conversations
   */
  static async getUserConversations(
    userId: number,
    limit: number = 20
  ): Promise<Conversation[]> {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        logger.error('Failed to get user conversations:', error);
        return [];
      }

      return (data as Conversation[]) || [];
    } catch (error) {
      logger.error('Error in getUserConversations:', error);
      return [];
    }
  }

  /**
   * Archive a conversation (change status to 'archived')
   */
  static async archiveConversation(conversationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('conversations')
        .update({ status: 'archived' })
        .eq('id', conversationId);

      if (error) {
        logger.error('Failed to archive conversation:', error);
        return false;
      }

      return true;
    } catch (error) {
      logger.error('Error in archiveConversation:', error);
      return false;
    }
  }

  /**
   * Update conversation details (title, status, language)
   */
  static async updateConversation(
    conversationId: string,
    updates: {
      title?: string;
      status?: 'active' | 'archived' | 'deleted';
      language?: string;
    }
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('conversations')
        .update(updates)
        .eq('id', conversationId);

      if (error) {
        logger.error('Failed to update conversation:', error);
        return false;
      }

      return true;
    } catch (error) {
      logger.error('Error in updateConversation:', error);
      return false;
    }
  }
}

export default ConversationsService;
