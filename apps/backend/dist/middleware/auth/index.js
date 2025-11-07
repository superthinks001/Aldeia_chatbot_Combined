"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRolePermissions = exports.hasPermission = exports.requireSelfOrAdmin = exports.requireAllPermissions = exports.requireAnyPermission = exports.requirePermission = exports.requireRole = exports.optionalAuthenticate = exports.authenticate = void 0;
// Authentication Middleware Exports
var authenticate_middleware_1 = require("./authenticate.middleware");
Object.defineProperty(exports, "authenticate", { enumerable: true, get: function () { return authenticate_middleware_1.authenticate; } });
Object.defineProperty(exports, "optionalAuthenticate", { enumerable: true, get: function () { return authenticate_middleware_1.optionalAuthenticate; } });
// Authorization Middleware Exports
var authorize_middleware_1 = require("./authorize.middleware");
Object.defineProperty(exports, "requireRole", { enumerable: true, get: function () { return authorize_middleware_1.requireRole; } });
Object.defineProperty(exports, "requirePermission", { enumerable: true, get: function () { return authorize_middleware_1.requirePermission; } });
Object.defineProperty(exports, "requireAnyPermission", { enumerable: true, get: function () { return authorize_middleware_1.requireAnyPermission; } });
Object.defineProperty(exports, "requireAllPermissions", { enumerable: true, get: function () { return authorize_middleware_1.requireAllPermissions; } });
Object.defineProperty(exports, "requireSelfOrAdmin", { enumerable: true, get: function () { return authorize_middleware_1.requireSelfOrAdmin; } });
Object.defineProperty(exports, "hasPermission", { enumerable: true, get: function () { return authorize_middleware_1.hasPermission; } });
Object.defineProperty(exports, "getRolePermissions", { enumerable: true, get: function () { return authorize_middleware_1.getRolePermissions; } });
