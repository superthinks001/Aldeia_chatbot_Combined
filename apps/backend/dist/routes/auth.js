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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateToken = void 0;
const express_1 = __importDefault(require("express"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const db_1 = require("../db");
const logger_1 = require("../utils/logger");
const sanitizeInput_1 = require("../middleware/sanitizeInput");
const utils_1 = require("@aldeia/utils");
const router = express_1.default.Router();
// Apply input sanitization middleware
router.use(sanitizeInput_1.sanitizeInput);
const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
// ====================================================================
// AUTH MIDDLEWARE - Used by protected routes
// ====================================================================
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    if (!token) {
        return res.status(401).json({
            success: false,
            error: 'Access token required'
        });
    }
    jsonwebtoken_1.default.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({
                success: false,
                error: 'Invalid or expired token'
            });
        }
        req.user = user;
        next();
    });
};
exports.authenticateToken = authenticateToken;
router.post('/register', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, email, password, confirmPassword } = req.body;
        // Validation
        if (!utils_1.validation.required(name) || !utils_1.validation.required(email) || !utils_1.validation.required(password)) {
            return res.status(400).json({
                success: false,
                error: 'Name, email, and password are required'
            });
        }
        if (!utils_1.validation.email(email)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid email format'
            });
        }
        if (!utils_1.validation.minLength(password, 8)) {
            return res.status(400).json({
                success: false,
                error: 'Password must be at least 8 characters long'
            });
        }
        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                error: 'Passwords do not match'
            });
        }
        // Check if user already exists
        const existingUser = yield getUserByEmail(email);
        if (existingUser) {
            return res.status(409).json({
                success: false,
                error: 'User with this email already exists'
            });
        }
        // Hash password
        const saltRounds = 12;
        const hashedPassword = yield bcrypt_1.default.hash(password, saltRounds);
        // Create user
        const userId = utils_1.stringUtils.generateId();
        const user = yield createUser({
            id: userId,
            name: utils_1.stringUtils.sanitize(name),
            email: email.toLowerCase(),
            password: hashedPassword,
            role: 'user'
        });
        // Generate JWT token
        const token = jsonwebtoken_1.default.sign({
            userId: user.id,
            email: user.email,
            role: user.role
        }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
        logger_1.logger.info(`New user registered: ${user.email}`);
        res.status(201).json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    createdAt: user.createdAt
                },
                token
            },
            message: 'User registered successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Registration error:', error);
        res.status(500).json({
            success: false,
            error: 'Registration failed'
        });
    }
}));
router.post('/login', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        // Validation
        if (!utils_1.validation.required(email) || !utils_1.validation.required(password)) {
            return res.status(400).json({
                success: false,
                error: 'Email and password are required'
            });
        }
        if (!utils_1.validation.email(email)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid email format'
            });
        }
        // Get user from database
        const user = yield getUserByEmail(email.toLowerCase());
        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Invalid email or password'
            });
        }
        // Verify password
        const isValidPassword = yield bcrypt_1.default.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                error: 'Invalid email or password'
            });
        }
        // Generate JWT token
        const token = jsonwebtoken_1.default.sign({
            userId: user.id,
            email: user.email,
            role: user.role
        }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
        // Update last login
        yield updateLastLogin(user.id);
        logger_1.logger.info(`User logged in: ${user.email}`);
        res.json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    createdAt: user.createdAt
                },
                token
            },
            message: 'Login successful'
        });
    }
    catch (error) {
        logger_1.logger.error('Login error:', error);
        res.status(500).json({
            success: false,
            error: 'Login failed'
        });
    }
}));
// ====================================================================
// GET USER PROFILE (Protected Route)
// ====================================================================
router.get('/profile', exports.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.userId;
        const user = yield getUserById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }
        res.json({
            success: true,
            data: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                createdAt: user.createdAt
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get user profile'
        });
    }
}));
router.put('/profile', exports.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.userId;
        const { name, email, currentPassword, newPassword } = req.body;
        const user = yield getUserById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }
        const updates = {};
        // Update name
        if (name && name !== user.name) {
            updates.name = utils_1.stringUtils.sanitize(name);
        }
        // Update email
        if (email && email !== user.email) {
            if (!utils_1.validation.email(email)) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid email format'
                });
            }
            // Check if new email is already taken
            const existingUser = yield getUserByEmail(email.toLowerCase());
            if (existingUser && existingUser.id !== userId) {
                return res.status(409).json({
                    success: false,
                    error: 'Email already in use'
                });
            }
            updates.email = email.toLowerCase();
        }
        // Update password
        if (newPassword) {
            if (!currentPassword) {
                return res.status(400).json({
                    success: false,
                    error: 'Current password required to set new password'
                });
            }
            const isValidCurrentPassword = yield bcrypt_1.default.compare(currentPassword, user.password);
            if (!isValidCurrentPassword) {
                return res.status(401).json({
                    success: false,
                    error: 'Current password is incorrect'
                });
            }
            if (!utils_1.validation.minLength(newPassword, 8)) {
                return res.status(400).json({
                    success: false,
                    error: 'New password must be at least 8 characters long'
                });
            }
            const saltRounds = 12;
            updates.password = yield bcrypt_1.default.hash(newPassword, saltRounds);
        }
        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No valid updates provided'
            });
        }
        // Update user
        yield updateUser(userId, updates);
        logger_1.logger.info(`User profile updated: ${user.email}`);
        res.json({
            success: true,
            message: 'Profile updated successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update profile'
        });
    }
}));
// ====================================================================
// LOGOUT (Client-side token invalidation)
// ====================================================================
router.post('/logout', exports.authenticateToken, (req, res) => {
    // In a stateless JWT system, logout is handled client-side by removing the token
    // For more security, you could implement a token blacklist
    logger_1.logger.info(`User logged out: ${req.user.email}`);
    res.json({
        success: true,
        message: 'Logged out successfully'
    });
});
function createUser(userData) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            db_1.db.run(`INSERT INTO users (id, name, email, password, role, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))`, [userData.id, userData.name, userData.email, userData.password, userData.role], function (err) {
                if (err) {
                    reject(err);
                }
                else {
                    resolve({
                        id: userData.id,
                        name: userData.name,
                        email: userData.email,
                        role: userData.role,
                        createdAt: new Date()
                    });
                }
            });
        });
    });
}
function getUserByEmail(email) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            db_1.db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(row);
                }
            });
        });
    });
}
function getUserById(id) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            db_1.db.get('SELECT * FROM users WHERE id = ?', [id], (err, row) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(row);
                }
            });
        });
    });
}
function updateUser(id, updates) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
            const values = [...Object.values(updates), id];
            db_1.db.run(`UPDATE users SET ${fields}, updated_at = datetime('now') WHERE id = ?`, values, function (err) {
                if (err) {
                    reject(err);
                }
                else {
                    resolve();
                }
            });
        });
    });
}
function updateLastLogin(id) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            db_1.db.run('UPDATE users SET last_login = datetime(\'now\') WHERE id = ?', [id], function (err) {
                if (err) {
                    reject(err);
                }
                else {
                    resolve();
                }
            });
        });
    });
}
exports.default = router;
