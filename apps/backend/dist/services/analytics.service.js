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
exports.AnalyticsService = void 0;
const database_1 = require("../config/database");
const logger_1 = require("../utils/logger");
class AnalyticsService {
    /**
     * Log an analytics event
     */
    static logEvent(event) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { error } = yield database_1.supabase
                    .from('analytics')
                    .insert({
                    user_id: event.user_id,
                    conversation_id: event.conversation_id,
                    event_type: event.event_type,
                    message: event.message,
                    metadata: event.metadata ? JSON.stringify(event.metadata) : null
                });
                if (error) {
                    logger_1.logger.error('Failed to log analytics event:', error);
                    return false;
                }
                return true;
            }
            catch (error) {
                logger_1.logger.error('Error in logEvent:', error);
                return false;
            }
        });
    }
    /**
     * Get analytics summary for a user
     */
    static getUserAnalyticsSummary(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { data, error } = yield database_1.supabase
                    .from('analytics')
                    .select('event_type, metadata')
                    .eq('user_id', userId);
                if (error) {
                    logger_1.logger.error('Failed to get user analytics summary:', error);
                    return null;
                }
                // Count events by type
                const summary = {};
                data === null || data === void 0 ? void 0 : data.forEach((row) => {
                    summary[row.event_type] = (summary[row.event_type] || 0) + 1;
                });
                return {
                    userId,
                    totalEvents: (data === null || data === void 0 ? void 0 : data.length) || 0,
                    eventCounts: summary
                };
            }
            catch (error) {
                logger_1.logger.error('Error in getUserAnalyticsSummary:', error);
                return null;
            }
        });
    }
    /**
     * Get overall analytics summary
     */
    static getOverallSummary() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { data, error } = yield database_1.supabase
                    .from('analytics')
                    .select('event_type, user_id');
                if (error) {
                    logger_1.logger.error('Failed to get overall analytics summary:', error);
                    return null;
                }
                // Count events by type
                const eventCounts = {};
                const uniqueUsers = new Set();
                data === null || data === void 0 ? void 0 : data.forEach((row) => {
                    eventCounts[row.event_type] = (eventCounts[row.event_type] || 0) + 1;
                    uniqueUsers.add(row.user_id);
                });
                return {
                    totalEvents: (data === null || data === void 0 ? void 0 : data.length) || 0,
                    totalUsers: uniqueUsers.size,
                    eventCounts
                };
            }
            catch (error) {
                logger_1.logger.error('Error in getOverallSummary:', error);
                return null;
            }
        });
    }
    /**
     * Get recent analytics events
     */
    static getRecentEvents() {
        return __awaiter(this, arguments, void 0, function* (limit = 100, userId) {
            try {
                let query = database_1.supabase
                    .from('analytics')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(limit);
                if (userId) {
                    query = query.eq('user_id', userId);
                }
                const { data, error } = yield query;
                if (error) {
                    logger_1.logger.error('Failed to get recent events:', error);
                    return [];
                }
                return data || [];
            }
            catch (error) {
                logger_1.logger.error('Error in getRecentEvents:', error);
                return [];
            }
        });
    }
    /**
     * Get analytics by conversation
     */
    static getConversationAnalytics(conversationId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { data, error } = yield database_1.supabase
                    .from('analytics')
                    .select('*')
                    .eq('conversation_id', conversationId)
                    .order('created_at', { ascending: true });
                if (error) {
                    logger_1.logger.error('Failed to get conversation analytics:', error);
                    return [];
                }
                return data || [];
            }
            catch (error) {
                logger_1.logger.error('Error in getConversationAnalytics:', error);
                return [];
            }
        });
    }
    /**
     * Count events by type for a user
     */
    static countEventsByType(userId, eventType) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { count, error } = yield database_1.supabase
                    .from('analytics')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', userId)
                    .eq('event_type', eventType);
                if (error) {
                    logger_1.logger.error('Failed to count events by type:', error);
                    return 0;
                }
                return count || 0;
            }
            catch (error) {
                logger_1.logger.error('Error in countEventsByType:', error);
                return 0;
            }
        });
    }
}
exports.AnalyticsService = AnalyticsService;
exports.default = AnalyticsService;
