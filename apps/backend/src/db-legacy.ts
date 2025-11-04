/**
 * Legacy Database Interface (Backward Compatibility)
 *
 * This file maintains the old callback-based API for backward compatibility
 * while using the new database client underneath.
 *
 * DEPRECATED: Use apps/backend/src/database/client.ts for new code
 */

import * as dbClient from './database/client';

/**
 * Initialize database
 * @deprecated Use async initDb from database/client.ts
 */
export function initDb(): void {
  dbClient.initDb().catch((err) => {
    console.error('Error initializing database:', err);
  });
}

/**
 * Add or update user (callback-based)
 * @deprecated Use async addOrUpdateUser from database/client.ts
 */
export function addOrUpdateUser(
  profile: { name?: string; county?: string; email?: string; language?: string },
  cb: (err: Error | null, userId?: number) => void
): void {
  dbClient
    .addOrUpdateUser(profile)
    .then((userId) => cb(null, userId))
    .catch((err) => cb(err));
}

/**
 * Log analytics event (callback-based)
 * @deprecated Use async logAnalytics from database/client.ts
 */
export function logAnalytics(
  event: {
    user_id?: number;
    conversation_id?: string;
    event_type: string;
    message?: string;
    meta?: any;
  },
  cb?: (err: Error | null) => void
): void {
  dbClient
    .logAnalytics(event)
    .then(() => cb?.(null))
    .catch((err) => cb?.(err || new Error('Unknown error')));
}

/**
 * Get analytics summary (callback-based)
 * @deprecated Use async getAnalyticsSummary from database/client.ts
 */
export function getAnalyticsSummary(
  cb: (err: Error | null, summary?: any) => void
): void {
  dbClient
    .getAnalyticsSummary()
    .then((summary) => cb(null, summary))
    .catch((err) => cb(err));
}

/**
 * Get all users (callback-based)
 * @deprecated Use async getUsers from database/client.ts
 */
export function getUsers(cb: (err: Error | null, users?: any[]) => void): void {
  dbClient
    .getUsers()
    .then((users) => cb(null, users))
    .catch((err) => cb(err));
}

// Also export the new async API for gradual migration
export {
  initDb as initDbAsync,
  addOrUpdateUser as addOrUpdateUserAsync,
  logAnalytics as logAnalyticsAsync,
  getAnalyticsSummary as getAnalyticsSummaryAsync,
  getUsers as getUsersAsync,
  getUserById,
  getUserByEmail,
  getAnalyticsByUser,
  getAnalyticsByConversation,
  deleteUser,
  updateUser,
  getRecentAnalytics,
  countAnalyticsByType,
  query,
  queryOne,
  execute,
  withTransaction,
  isPostgres,
  isSQLite,
  getDatabaseType
} from './database/client';
