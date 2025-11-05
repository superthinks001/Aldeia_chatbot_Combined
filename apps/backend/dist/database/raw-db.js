"use strict";
/**
 * Raw Database Access (Deprecated)
 *
 * Provides raw SQLite database object for legacy code
 * This should only be used temporarily while migrating old code
 *
 * @deprecated Use async functions from database/client.ts instead
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
exports.getRawDb = getRawDb;
const sqlite3_1 = __importDefault(require("sqlite3"));
const path_1 = __importDefault(require("path"));
const config_1 = require("./config");
let rawDb = null;
if ((0, config_1.isSQLite)()) {
    const dbPath = process.env.SQLITE_DB_PATH || path_1.default.join(__dirname, '../../aldeia.db');
    rawDb = new sqlite3_1.default.Database(dbPath, (err) => {
        if (err) {
            console.error('Failed to open raw SQLite database:', err);
        }
    });
}
/**
 * Get raw SQLite database object
 * @deprecated Use async query/execute functions instead
 */
function getRawDb() {
    if (!rawDb) {
        throw new Error('Raw database not available (may be using PostgreSQL)');
    }
    return rawDb;
}
// Export for backward compatibility
exports.db = rawDb || {
    run: () => {
        throw new Error('Database not initialized or using PostgreSQL. Use async database client instead.');
    },
    get: () => {
        throw new Error('Database not initialized or using PostgreSQL. Use async database client instead.');
    },
    all: () => {
        throw new Error('Database not initialized or using PostgreSQL. Use async database client instead.');
    }
};
exports.default = exports.db;
