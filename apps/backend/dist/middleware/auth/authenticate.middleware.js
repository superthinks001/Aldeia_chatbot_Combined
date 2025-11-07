"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuthenticate = exports.authenticate = void 0;
const auth_service_1 = require("../../services/auth/auth.service");
// ============================================
// AUTHENTICATION MIDDLEWARE
// ============================================
/**
 * Middleware to authenticate requests using JWT access tokens
 * Extracts token from Authorization header and verifies it
 * Adds user payload to request object if valid
 */
const authenticate = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Get token from Authorization header (Bearer TOKEN)
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({
                success: false,
                error: 'Access token required'
            });
            return;
        }
        const token = authHeader.substring(7); // Remove 'Bearer ' prefix
        // Verify token
        const payload = yield auth_service_1.AuthService.verifyAccessToken(token);
        if (!payload) {
            res.status(401).json({
                success: false,
                error: 'Invalid or expired token'
            });
            return;
        }
        // Attach user to request
        req.user = payload;
        next();
    }
    catch (error) {
        res.status(401).json({
            success: false,
            error: 'Authentication failed'
        });
    }
});
exports.authenticate = authenticate;
/**
 * Optional authentication middleware
 * Adds user to request if token is valid, but doesn't block if invalid
 */
const optionalAuthenticate = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            const payload = yield auth_service_1.AuthService.verifyAccessToken(token);
            if (payload) {
                req.user = payload;
            }
        }
        next();
    }
    catch (error) {
        // Silently continue without authentication
        next();
    }
});
exports.optionalAuthenticate = optionalAuthenticate;
exports.default = exports.authenticate;
