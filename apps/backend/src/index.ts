import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { testConnection } from './config/database';

// Import routes
import authRoutes from './routes/auth.routes';
import chatRoutes from './routes/chat';

// Import middleware
import { authenticate } from './middleware/auth/authenticate.middleware';

// Load environment
dotenv.config({ path: path.join(__dirname, '../../.env.merge') });

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;

// ============================================
// MIDDLEWARE
// ============================================

// Security headers
app.use(helmet());

// CORS
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3002',
  process.env.FRONTEND_CHAT_URL,
  process.env.FRONTEND_REBUILD_URL
].filter((origin): origin is string => Boolean(origin));

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later'
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================
// PUBLIC ROUTES (No authentication required)
// ============================================

app.get('/api/health', async (req, res) => {
  const dbConnected = await testConnection();

  res.json({
    status: dbConnected ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    database: dbConnected ? 'connected' : 'disconnected',
    version: '2.0.0-auth'
  });
});

// Authentication routes (public)
app.use('/api/auth', authRoutes);

// ============================================
// PROTECTED ROUTES (Authentication required)
// ============================================

// Apply authentication middleware to all routes below
app.use('/api/chat', authenticate, chatRoutes);

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.method} ${req.path} not found`
  });
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, async () => {
  console.log(`\n🚀 Aldeia Chatbot Backend v2.0.0-auth`);
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);

  // Test database connection
  const dbConnected = await testConnection();
  if (!dbConnected) {
    console.error('⚠️  WARNING: Database connection failed!');
  }

  console.log(`\n🔐 Authentication enabled`);
  console.log(`   Public routes: /api/health, /api/auth/*`);
  console.log(`   Protected routes: /api/chat/* (requires Bearer token)`);
  console.log(`\n✅ Ready to accept requests`);
  console.log(`   Health check: http://localhost:${PORT}/api/health\n`);
});

export default app;
