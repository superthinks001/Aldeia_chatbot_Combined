"use strict";
/**
 * Database Connection Manager
 *
 * Handles connection pooling for PostgreSQL and SQLite database connections
 * Provides a unified interface for both database types
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isPostgres = void 0;
exports.initConnection = initConnection;
exports.getPool = getPool;
exports.getSQLiteDb = getSQLiteDb;
exports.query = query;
exports.queryOne = queryOne;
exports.execute = execute;
exports.beginTransaction = beginTransaction;
exports.commitTransaction = commitTransaction;
exports.rollbackTransaction = rollbackTransaction;
exports.withTransaction = withTransaction;
exports.closeConnection = closeConnection;
exports.healthCheck = healthCheck;
const pg_1 = require("pg");
const sqlite3_1 = __importDefault(require("sqlite3"));
const util_1 = require("util");
const config_1 = require("./config");
// Re-export for convenience
var config_2 = require("./config");
Object.defineProperty(exports, "isPostgres", { enumerable: true, get: function () { return config_2.isPostgres; } });
let pgPool = null;
let sqliteDb = null;
/**
 * Initialize database connection
 */
function initConnection() {
    return __awaiter(this, void 0, void 0, function* () {
        const config = (0, config_1.getDatabaseConfig)();
        if (config.type === 'postgres' && config.postgres) {
            if (!pgPool) {
                // Use connection string if DATABASE_URL is available (better handling of special chars)
                const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
                if (connectionString) {
                    pgPool = new pg_1.Pool({
                        connectionString,
                        ssl: { rejectUnauthorized: false },
                        max: config.postgres.max,
                        idleTimeoutMillis: config.postgres.idleTimeoutMillis,
                        connectionTimeoutMillis: config.postgres.connectionTimeoutMillis
                    });
                }
                else {
                    pgPool = new pg_1.Pool({
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
                    const client = yield pgPool.connect();
                    console.log('✅ Connected to PostgreSQL database');
                    client.release();
                }
                catch (error) {
                    console.error('❌ Failed to connect to PostgreSQL:', error);
                    throw error;
                }
                // Error handling
                pgPool.on('error', (err) => {
                    console.error('Unexpected PostgreSQL pool error:', err);
                });
            }
        }
        else if (config.type === 'sqlite' && config.sqlite) {
            if (!sqliteDb) {
                sqliteDb = new sqlite3_1.default.Database(config.sqlite.path, (err) => {
                    if (err) {
                        console.error('❌ Failed to connect to SQLite:', err);
                        throw err;
                    }
                    console.log('✅ Connected to SQLite database:', config.sqlite.path);
                });
            }
        }
        else {
            throw new Error('Invalid database configuration');
        }
    });
}
/**
 * Get PostgreSQL pool
 */
function getPool() {
    if (!pgPool) {
        throw new Error('PostgreSQL pool not initialized. Call initConnection() first.');
    }
    return pgPool;
}
/**
 * Get SQLite database instance
 */
function getSQLiteDb() {
    if (!sqliteDb) {
        throw new Error('SQLite database not initialized. Call initConnection() first.');
    }
    return sqliteDb;
}
/**
 * Execute a query (unified interface for both databases)
 */
function query(text_1) {
    return __awaiter(this, arguments, void 0, function* (text, params = []) {
        if ((0, config_1.isPostgres)()) {
            const result = yield pgPool.query(text, params);
            return result.rows;
        }
        else {
            // SQLite
            const db = getSQLiteDb();
            const allAsync = (0, util_1.promisify)(db.all.bind(db));
            return yield allAsync(text, params);
        }
    });
}
/**
 * Execute a query and return a single row
 */
function queryOne(text_1) {
    return __awaiter(this, arguments, void 0, function* (text, params = []) {
        if ((0, config_1.isPostgres)()) {
            const result = yield pgPool.query(text, params);
            return result.rows[0] || null;
        }
        else {
            // SQLite
            const db = getSQLiteDb();
            const getAsync = (0, util_1.promisify)(db.get.bind(db));
            return (yield getAsync(text, params)) || null;
        }
    });
}
/**
 * Execute a query that modifies data (INSERT, UPDATE, DELETE)
 */
function execute(text_1) {
    return __awaiter(this, arguments, void 0, function* (text, params = []) {
        if ((0, config_1.isPostgres)()) {
            const result = yield pgPool.query(text, params);
            return {
                rowCount: result.rowCount || 0
            };
        }
        else {
            // SQLite
            const db = getSQLiteDb();
            const runAsync = (0, util_1.promisify)(db.run.bind(db));
            const result = yield runAsync(text, params);
            return {
                rowCount: result.changes || 0,
                lastId: result.lastID
            };
        }
    });
}
/**
 * Begin a transaction
 */
function beginTransaction() {
    return __awaiter(this, void 0, void 0, function* () {
        if ((0, config_1.isPostgres)()) {
            const client = yield pgPool.connect();
            yield client.query('BEGIN');
            return client;
        }
        else {
            const db = getSQLiteDb();
            const runAsync = (0, util_1.promisify)(db.run.bind(db));
            yield runAsync('BEGIN TRANSACTION');
            return db;
        }
    });
}
/**
 * Commit a transaction
 */
function commitTransaction(client) {
    return __awaiter(this, void 0, void 0, function* () {
        if ((0, config_1.isPostgres)()) {
            yield client.query('COMMIT');
            client.release();
        }
        else {
            const db = client;
            const runAsync = (0, util_1.promisify)(db.run.bind(db));
            yield runAsync('COMMIT');
        }
    });
}
/**
 * Rollback a transaction
 */
function rollbackTransaction(client) {
    return __awaiter(this, void 0, void 0, function* () {
        if ((0, config_1.isPostgres)()) {
            yield client.query('ROLLBACK');
            client.release();
        }
        else {
            const db = client;
            const runAsync = (0, util_1.promisify)(db.run.bind(db));
            yield runAsync('ROLLBACK');
        }
    });
}
/**
 * Execute a function within a transaction
 */
function withTransaction(fn) {
    return __awaiter(this, void 0, void 0, function* () {
        const client = yield beginTransaction();
        try {
            const result = yield fn(client);
            yield commitTransaction(client);
            return result;
        }
        catch (error) {
            yield rollbackTransaction(client);
            throw error;
        }
    });
}
/**
 * Close database connections
 */
function closeConnection() {
    return __awaiter(this, void 0, void 0, function* () {
        if (pgPool) {
            yield pgPool.end();
            console.log('PostgreSQL pool closed');
            pgPool = null;
        }
        if (sqliteDb) {
            yield new Promise((resolve, reject) => {
                sqliteDb.close((err) => {
                    if (err)
                        reject(err);
                    else
                        resolve();
                });
            });
            console.log('SQLite database closed');
            sqliteDb = null;
        }
    });
}
/**
 * Health check - verify database connection is working
 */
function healthCheck() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if ((0, config_1.isPostgres)()) {
                yield query('SELECT NOW()');
            }
            else {
                yield query('SELECT 1');
            }
            return true;
        }
        catch (error) {
            console.error('Database health check failed:', error);
            return false;
        }
    });
}
// Initialize connection when module is loaded
initConnection().catch((error) => {
    console.error('Failed to initialize database connection:', error);
    process.exit(1);
});
// Graceful shutdown
process.on('SIGTERM', () => __awaiter(void 0, void 0, void 0, function* () {
    yield closeConnection();
    process.exit(0);
}));
process.on('SIGINT', () => __awaiter(void 0, void 0, void 0, function* () {
    yield closeConnection();
    process.exit(0);
}));
