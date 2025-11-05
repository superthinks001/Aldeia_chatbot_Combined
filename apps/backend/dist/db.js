"use strict";
/**
 * Database Interface
 *
 * Unified database interface supporting both SQLite and PostgreSQL
 * Automatically switches based on environment configuration
 *
 * For new code, prefer using async/await functions from './database/client'
 * This file maintains backward compatibility with callback-based API
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDatabaseType = exports.isSQLite = exports.isPostgres = exports.withTransaction = exports.execute = exports.queryOne = exports.query = exports.countAnalyticsByType = exports.getRecentAnalytics = exports.updateUser = exports.deleteUser = exports.getAnalyticsByConversation = exports.getAnalyticsByUser = exports.getUserByEmail = exports.getUserById = exports.getUsersAsync = exports.getAnalyticsSummaryAsync = exports.logAnalyticsAsync = exports.addOrUpdateUserAsync = exports.initDbAsync = exports.db = void 0;
// Re-export everything from db-legacy for backward compatibility
__exportStar(require("./db-legacy"), exports);
// Export raw db object for legacy code (deprecated)
var raw_db_1 = require("./database/raw-db");
Object.defineProperty(exports, "db", { enumerable: true, get: function () { return raw_db_1.db; } });
// Also export the modern async API for new code
var client_1 = require("./database/client");
Object.defineProperty(exports, "initDbAsync", { enumerable: true, get: function () { return client_1.initDb; } });
Object.defineProperty(exports, "addOrUpdateUserAsync", { enumerable: true, get: function () { return client_1.addOrUpdateUser; } });
Object.defineProperty(exports, "logAnalyticsAsync", { enumerable: true, get: function () { return client_1.logAnalytics; } });
Object.defineProperty(exports, "getAnalyticsSummaryAsync", { enumerable: true, get: function () { return client_1.getAnalyticsSummary; } });
Object.defineProperty(exports, "getUsersAsync", { enumerable: true, get: function () { return client_1.getUsers; } });
Object.defineProperty(exports, "getUserById", { enumerable: true, get: function () { return client_1.getUserById; } });
Object.defineProperty(exports, "getUserByEmail", { enumerable: true, get: function () { return client_1.getUserByEmail; } });
Object.defineProperty(exports, "getAnalyticsByUser", { enumerable: true, get: function () { return client_1.getAnalyticsByUser; } });
Object.defineProperty(exports, "getAnalyticsByConversation", { enumerable: true, get: function () { return client_1.getAnalyticsByConversation; } });
Object.defineProperty(exports, "deleteUser", { enumerable: true, get: function () { return client_1.deleteUser; } });
Object.defineProperty(exports, "updateUser", { enumerable: true, get: function () { return client_1.updateUser; } });
Object.defineProperty(exports, "getRecentAnalytics", { enumerable: true, get: function () { return client_1.getRecentAnalytics; } });
Object.defineProperty(exports, "countAnalyticsByType", { enumerable: true, get: function () { return client_1.countAnalyticsByType; } });
Object.defineProperty(exports, "query", { enumerable: true, get: function () { return client_1.query; } });
Object.defineProperty(exports, "queryOne", { enumerable: true, get: function () { return client_1.queryOne; } });
Object.defineProperty(exports, "execute", { enumerable: true, get: function () { return client_1.execute; } });
Object.defineProperty(exports, "withTransaction", { enumerable: true, get: function () { return client_1.withTransaction; } });
Object.defineProperty(exports, "isPostgres", { enumerable: true, get: function () { return client_1.isPostgres; } });
Object.defineProperty(exports, "isSQLite", { enumerable: true, get: function () { return client_1.isSQLite; } });
Object.defineProperty(exports, "getDatabaseType", { enumerable: true, get: function () { return client_1.getDatabaseType; } });
