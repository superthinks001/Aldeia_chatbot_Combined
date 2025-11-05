"use strict";
/**
 * Legacy Database Interface (Backward Compatibility)
 *
 * This file maintains the old callback-based API for backward compatibility
 * while using the new database client underneath.
 *
 * DEPRECATED: Use apps/backend/src/database/client.ts for new code
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
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDatabaseType = exports.isSQLite = exports.isPostgres = exports.withTransaction = exports.execute = exports.queryOne = exports.query = exports.countAnalyticsByType = exports.getRecentAnalytics = exports.updateUser = exports.deleteUser = exports.getAnalyticsByConversation = exports.getAnalyticsByUser = exports.getUserByEmail = exports.getUserById = exports.getUsersAsync = exports.getAnalyticsSummaryAsync = exports.logAnalyticsAsync = exports.addOrUpdateUserAsync = exports.initDbAsync = void 0;
exports.initDb = initDb;
exports.addOrUpdateUser = addOrUpdateUser;
exports.logAnalytics = logAnalytics;
exports.getAnalyticsSummary = getAnalyticsSummary;
exports.getUsers = getUsers;
const dbClient = __importStar(require("./database/client"));
/**
 * Initialize database
 * @deprecated Use async initDb from database/client.ts
 */
function initDb() {
    dbClient.initDb().catch((err) => {
        console.error('Error initializing database:', err);
    });
}
/**
 * Add or update user (callback-based)
 * @deprecated Use async addOrUpdateUser from database/client.ts
 */
function addOrUpdateUser(profile, cb) {
    dbClient
        .addOrUpdateUser(profile)
        .then((userId) => cb(null, userId))
        .catch((err) => cb(err));
}
/**
 * Log analytics event (callback-based)
 * @deprecated Use async logAnalytics from database/client.ts
 */
function logAnalytics(event, cb) {
    dbClient
        .logAnalytics(event)
        .then(() => cb === null || cb === void 0 ? void 0 : cb(null))
        .catch((err) => cb === null || cb === void 0 ? void 0 : cb(err || new Error('Unknown error')));
}
/**
 * Get analytics summary (callback-based)
 * @deprecated Use async getAnalyticsSummary from database/client.ts
 */
function getAnalyticsSummary(cb) {
    dbClient
        .getAnalyticsSummary()
        .then((summary) => cb(null, summary))
        .catch((err) => cb(err));
}
/**
 * Get all users (callback-based)
 * @deprecated Use async getUsers from database/client.ts
 */
function getUsers(cb) {
    dbClient
        .getUsers()
        .then((users) => cb(null, users))
        .catch((err) => cb(err));
}
// Also export the new async API for gradual migration
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
