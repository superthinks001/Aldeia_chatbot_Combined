import express from 'express';
import chatRoutes from './chat';
import documentRoutes from './documents';
import rebuildRoutes from './rebuild';
import authRoutes from './auth';
import { logger } from '../utils/logger';

const router = express.Router();

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
router.use('/chat', chatRoutes);
router.use('/documents', documentRoutes);
router.use('/rebuild', rebuildRoutes);
router.use('/auth', authRoutes);

// 404 handler for API routes
router.use('*', (req, res) => {
  logger.warn(`API endpoint not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    error: 'API endpoint not found',
    availableEndpoints: '/api/docs'
  });
});

export default router;