/**
 * Database Interface
 *
 * Unified database interface supporting both SQLite and PostgreSQL
 * Automatically switches based on environment configuration
 *
 * For new code, prefer using async/await functions from './database/client'
 * This file maintains backward compatibility with callback-based API
 */

// Re-export everything from db-legacy for backward compatibility
export * from './db-legacy';

// Export raw db object for legacy code (deprecated)
export { db } from './database/raw-db';

// Also export the modern async API for new code
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
