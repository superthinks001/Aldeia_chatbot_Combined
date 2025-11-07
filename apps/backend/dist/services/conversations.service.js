"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConversationsService = void 0;
const database_1 = require("../config/database");
const logger_1 = require("../utils/logger");
class ConversationsService {
    /**
     * Create or get existing conversation for a user
     */
    static createOrGetConversation(userId, conversationId, title, language) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // If conversationId provided, fetch existing conversation
                if (conversationId) {
                    const { data, error } = yield database_1.supabase
                        .from('conversations')
                        .select('*')
                        .eq('id', conversationId) // UUID - use as string
                        .eq('user_id', userId)
                        .single();
                    if (!error && data) {
                        return data;
                    }
                }
                // Create new conversation
                const { data, error } = yield database_1.supabase
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
                    logger_1.logger.error('Failed to create conversation:', error);
                    return null;
                }
                return data;
            }
            catch (error) {
                logger_1.logger.error('Error in createOrGetConversation:', error);
                return null;
            }
        });
    }
    /**
     * Add message to conversation
     */
    static addMessage(conversationId, // UUID
    sender, message, metadata) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { data, error } = yield database_1.supabase
                    .from('conversation_messages')
                    .insert({
                    conversation_id: conversationId,
                    sender,
                    message,
                    intent: metadata === null || metadata === void 0 ? void 0 : metadata.intent,
                    confidence: metadata === null || metadata === void 0 ? void 0 : metadata.confidence,
                    bias: metadata === null || metadata === void 0 ? void 0 : metadata.bias,
                    ambiguous: metadata === null || metadata === void 0 ? void 0 : metadata.ambiguous,
                    metadata: metadata ? JSON.stringify(metadata) : null
                })
                    .select()
                    .single();
                if (error) {
                    logger_1.logger.error('Failed to add message:', error);
                    return null;
                }
                // Update conversation's updated_at timestamp (trigger handles this automatically)
                // No need to manually update - PostgreSQL trigger updates updated_at on any conversation update
                return data;
            }
            catch (error) {
                logger_1.logger.error('Error in addMessage:', error);
                return null;
            }
        });
    }
    /**
     * Get conversation history
     */
    static getConversationHistory(conversationId_1) {
        return __awaiter(this, arguments, void 0, function* (conversationId, // UUID
        limit = 10) {
            try {
                const { data, error } = yield database_1.supabase
                    .from('conversation_messages')
                    .select('*')
                    .eq('conversation_id', conversationId)
                    .order('created_at', { ascending: true })
                    .limit(limit);
                if (error) {
                    logger_1.logger.error('Failed to get conversation history:', error);
                    return [];
                }
                return data || [];
            }
            catch (error) {
                logger_1.logger.error('Error in getConversationHistory:', error);
                return [];
            }
        });
    }
    /**
     * Get user's conversations
     */
    static getUserConversations(userId_1) {
        return __awaiter(this, arguments, void 0, function* (userId, limit = 20) {
            try {
                const { data, error } = yield database_1.supabase
                    .from('conversations')
                    .select('*')
                    .eq('user_id', userId)
                    .order('created_at', { ascending: false })
                    .limit(limit);
                if (error) {
                    logger_1.logger.error('Failed to get user conversations:', error);
                    return [];
                }
                return data || [];
            }
            catch (error) {
                logger_1.logger.error('Error in getUserConversations:', error);
                return [];
            }
        });
    }
    /**
     * Archive a conversation (change status to 'archived')
     */
    static archiveConversation(conversationId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { error } = yield database_1.supabase
                    .from('conversations')
                    .update({ status: 'archived' })
                    .eq('id', conversationId);
                if (error) {
                    logger_1.logger.error('Failed to archive conversation:', error);
                    return false;
                }
                return true;
            }
            catch (error) {
                logger_1.logger.error('Error in archiveConversation:', error);
                return false;
            }
        });
    }
    /**
     * Update conversation details (title, status, language)
     */
    static updateConversation(conversationId, updates) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { error } = yield database_1.supabase
                    .from('conversations')
                    .update(updates)
                    .eq('id', conversationId);
                if (error) {
                    logger_1.logger.error('Failed to update conversation:', error);
                    return false;
                }
                return true;
            }
            catch (error) {
                logger_1.logger.error('Error in updateConversation:', error);
                return false;
            }
        });
    }
}
exports.ConversationsService = ConversationsService;
exports.default = ConversationsService;
