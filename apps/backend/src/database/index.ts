/**
 * Database Module - Main Entry Point
 *
 * This module provides a unified database interface supporting both SQLite and PostgreSQL.
 * It automatically switches between databases based on environment configuration.
 *
 * Usage:
 *   import { initDb, addOrUpdateUser, logAnalytics } from './database';
 *
 * Configuration:
 *   Set USE_SQLITE=false to use PostgreSQL
 *   Set DATABASE_URL or SUPABASE_DB_URL for PostgreSQL connection
 */

// Export database client functions
export {
  initDb,
  addOrUpdateUser,
  logAnalytics,
  getAnalyticsSummary,
  getUsers,
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
} from './client';

// Export configuration utilities
export {
  getDatabaseConfig,
  validateConfig,
  type DatabaseConfig
} from './config';

// Export connection utilities
export {
  initConnection,
  closeConnection,
  healthCheck
} from './connection';
