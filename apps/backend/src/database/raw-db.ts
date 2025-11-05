/**
 * Raw Database Access (Deprecated)
 *
 * Provides raw SQLite database object for legacy code
 * This should only be used temporarily while migrating old code
 *
 * @deprecated Use async functions from database/client.ts instead
 */

import sqlite3 from 'sqlite3';
import path from 'path';
import { isSQLite } from './config';

let rawDb: sqlite3.Database | null = null;

if (isSQLite()) {
  const dbPath = process.env.SQLITE_DB_PATH || path.join(__dirname, '../../aldeia.db');
  rawDb = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Failed to open raw SQLite database:', err);
    }
  });
}

/**
 * Get raw SQLite database object
 * @deprecated Use async query/execute functions instead
 */
export function getRawDb(): sqlite3.Database {
  if (!rawDb) {
    throw new Error('Raw database not available (may be using PostgreSQL)');
  }
  return rawDb;
}

// Export for backward compatibility
export const db = rawDb || ({
  run: () => {
    throw new Error('Database not initialized or using PostgreSQL. Use async database client instead.');
  },
  get: () => {
    throw new Error('Database not initialized or using PostgreSQL. Use async database client instead.');
  },
  all: () => {
    throw new Error('Database not initialized or using PostgreSQL. Use async database client instead.');
  }
} as any as sqlite3.Database);

export default db;
