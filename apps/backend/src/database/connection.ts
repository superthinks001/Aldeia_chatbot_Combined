/**
 * Database Connection Manager
 *
 * Handles connection pooling for PostgreSQL and SQLite database connections
 * Provides a unified interface for both database types
 */

import { Pool, PoolClient, QueryResult } from 'pg';
import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import { getDatabaseConfig, isPostgres as checkIsPostgres } from './config';

// Re-export for convenience
export { isPostgres } from './config';

let pgPool: Pool | null = null;
let sqliteDb: sqlite3.Database | null = null;

/**
 * Initialize database connection
 */
export async function initConnection(): Promise<void> {
  const config = getDatabaseConfig();

  if (config.type === 'postgres' && config.postgres) {
    if (!pgPool) {
      // Use connection string if DATABASE_URL is available (better handling of special chars)
      const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

      if (connectionString) {
        pgPool = new Pool({
          connectionString,
          ssl: { rejectUnauthorized: false },
          max: config.postgres.max,
          idleTimeoutMillis: config.postgres.idleTimeoutMillis,
          connectionTimeoutMillis: config.postgres.connectionTimeoutMillis
        });
      } else {
        pgPool = new Pool({
          host: config.postgres.host,
          port: config.postgres.port,
          database: config.postgres.database,
          user: config.postgres.user,
          password: config.postgres.password,
          ssl: config.postgres.ssl ? { rejectUnauthorized: false } : false,
          max: config.postgres.max,
          idleTimeoutMillis: config.postgres.idleTimeoutMillis,
          connectionTimeoutMillis: config.postgres.connectionTimeoutMillis
        });
      }

      // Test connection
      try {
        const client = await pgPool.connect();
        console.log('✅ Connected to PostgreSQL database');
        client.release();
      } catch (error) {
        console.error('❌ Failed to connect to PostgreSQL:', error);
        throw error;
      }

      // Error handling
      pgPool.on('error', (err) => {
        console.error('Unexpected PostgreSQL pool error:', err);
      });
    }
  } else if (config.type === 'sqlite' && config.sqlite) {
    if (!sqliteDb) {
      sqliteDb = new sqlite3.Database(config.sqlite.path, (err) => {
        if (err) {
          console.error('❌ Failed to connect to SQLite:', err);
          throw err;
        }
        console.log('✅ Connected to SQLite database:', config.sqlite!.path);
      });
    }
  } else {
    throw new Error('Invalid database configuration');
  }
}

/**
 * Get PostgreSQL pool
 */
export function getPool(): Pool {
  if (!pgPool) {
    throw new Error('PostgreSQL pool not initialized. Call initConnection() first.');
  }
  return pgPool;
}

/**
 * Get SQLite database instance
 */
export function getSQLiteDb(): sqlite3.Database {
  if (!sqliteDb) {
    throw new Error('SQLite database not initialized. Call initConnection() first.');
  }
  return sqliteDb;
}

/**
 * Execute a query (unified interface for both databases)
 */
export async function query<T = any>(
  text: string,
  params: any[] = []
): Promise<T[]> {
  if (checkIsPostgres()) {
    const result = await pgPool!.query(text, params);
    return result.rows as T[];
  } else {
    // SQLite
    const db = getSQLiteDb();
    const allAsync = promisify(db.all.bind(db)) as (sql: string, params?: any[]) => Promise<T[]>;
    return await allAsync(text, params);
  }
}

/**
 * Execute a query and return a single row
 */
export async function queryOne<T = any>(
  text: string,
  params: any[] = []
): Promise<T | null> {
  if (checkIsPostgres()) {
    const result = await pgPool!.query(text, params);
    return result.rows[0] || null;
  } else {
    // SQLite
    const db = getSQLiteDb();
    const getAsync = promisify(db.get.bind(db)) as (sql: string, params?: any[]) => Promise<T | undefined>;
    return (await getAsync(text, params)) || null;
  }
}

/**
 * Execute a query that modifies data (INSERT, UPDATE, DELETE)
 */
export async function execute(
  text: string,
  params: any[] = []
): Promise<{ rowCount: number; lastId?: number }> {
  if (checkIsPostgres()) {
    const result = await pgPool!.query(text, params);
    return {
      rowCount: result.rowCount || 0
    };
  } else {
    // SQLite
    const db = getSQLiteDb();
    const runAsync = promisify(db.run.bind(db)) as (sql: string, params?: any[]) => Promise<sqlite3.RunResult>;
    const result: sqlite3.RunResult = await runAsync(text, params);
    return {
      rowCount: result.changes || 0,
      lastId: result.lastID
    };
  }
}

/**
 * Begin a transaction
 */
export async function beginTransaction(): Promise<PoolClient | sqlite3.Database> {
  if (checkIsPostgres()) {
    const client = await pgPool!.connect();
    await client.query('BEGIN');
    return client;
  } else {
    const db = getSQLiteDb();
    const runAsync = promisify(db.run.bind(db));
    await runAsync('BEGIN TRANSACTION');
    return db;
  }
}

/**
 * Commit a transaction
 */
export async function commitTransaction(
  client: PoolClient | sqlite3.Database
): Promise<void> {
  if (checkIsPostgres()) {
    await (client as PoolClient).query('COMMIT');
    (client as PoolClient).release();
  } else {
    const db = client as sqlite3.Database;
    const runAsync = promisify(db.run.bind(db));
    await runAsync('COMMIT');
  }
}

/**
 * Rollback a transaction
 */
export async function rollbackTransaction(
  client: PoolClient | sqlite3.Database
): Promise<void> {
  if (checkIsPostgres()) {
    await (client as PoolClient).query('ROLLBACK');
    (client as PoolClient).release();
  } else {
    const db = client as sqlite3.Database;
    const runAsync = promisify(db.run.bind(db));
    await runAsync('ROLLBACK');
  }
}

/**
 * Execute a function within a transaction
 */
export async function withTransaction<T>(
  fn: (client: PoolClient | sqlite3.Database) => Promise<T>
): Promise<T> {
  const client = await beginTransaction();
  try {
    const result = await fn(client);
    await commitTransaction(client);
    return result;
  } catch (error) {
    await rollbackTransaction(client);
    throw error;
  }
}

/**
 * Close database connections
 */
export async function closeConnection(): Promise<void> {
  if (pgPool) {
    await pgPool.end();
    console.log('PostgreSQL pool closed');
    pgPool = null;
  }

  if (sqliteDb) {
    await new Promise<void>((resolve, reject) => {
      sqliteDb!.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    console.log('SQLite database closed');
    sqliteDb = null;
  }
}

/**
 * Health check - verify database connection is working
 */
export async function healthCheck(): Promise<boolean> {
  try {
    if (checkIsPostgres()) {
      await query('SELECT NOW()');
    } else {
      await query('SELECT 1');
    }
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

// Initialize connection when module is loaded
initConnection().catch((error) => {
  console.error('Failed to initialize database connection:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  await closeConnection();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await closeConnection();
  process.exit(0);
});
