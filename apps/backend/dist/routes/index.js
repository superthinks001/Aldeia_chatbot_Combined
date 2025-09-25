"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const chat_1 = __importDefault(require("./chat"));
const documents_1 = __importDefault(require("./documents"));
const rebuild_1 = __importDefault(require("./rebuild"));
const auth_1 = __importDefault(require("./auth"));
const logger_1 = require("../utils/logger");
const router = express_1.default.Router();
// Health check endpoint
router.get('/health', (req, res) => {
    res.json({
        success: true,
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});
// API Documentation endpoint
router.get('/docs', (req, res) => {
    res.json({
        success: true,
        endpoints: {
            chat: {
                'POST /api/chat': 'Send chat message',
                'POST /api/chat/search': 'Search rebuild resources',
                'GET /api/chat/history/:sessionId': 'Get chat history'
            },
            documents: {
                'GET /api/documents': 'List documents',
                'POST /api/documents': 'Upload document',
                'GET /api/documents/:id': 'Get specific document'
            },
            rebuild: {
                'GET /api/rebuild/projects': 'Get user projects',
                'POST /api/rebuild/projects': 'Create new project',
                'GET /api/rebuild/designs': 'Get design matches',
                'POST /api/rebuild/preferences': 'Save user preferences'
            },
            auth: {
                'POST /api/auth/login': 'User login',
                'POST /api/auth/register': 'User registration',
                'POST /api/auth/logout': 'User logout',
                'GET /api/auth/profile': 'Get user profile'
            }
        }
    });
});
// Mount route modules
router.use('/chat', chat_1.default);
router.use('/documents', documents_1.default);
router.use('/rebuild', rebuild_1.default);
router.use('/auth', auth_1.default);
// 404 handler for API routes
router.use('*', (req, res) => {
    logger_1.logger.warn(`API endpoint not found: ${req.method} ${req.originalUrl}`);
    res.status(404).json({
        success: false,
        error: 'API endpoint not found',
        availableEndpoints: '/api/docs'
    });
});
exports.default = router;
