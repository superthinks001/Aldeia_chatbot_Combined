import { Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

export interface AuthenticatedSocket extends Socket {
  userId?: number;
  userEmail?: string;
  conversationId?: string;
}

export class WebSocketServer {
  private io: Server;
  private connectedUsers: Map<number, string[]> = new Map(); // userId -> array of socket IDs

  constructor(httpServer: HTTPServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: ['http://localhost:3000', 'http://localhost:4000', 'http://localhost:8080'],
        methods: ['GET', 'POST'],
        credentials: true,
      },
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  /**
   * Setup authentication middleware for WebSocket connections
   */
  private setupMiddleware() {
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');

        if (!token) {
          return next(new Error('Authentication token required'));
        }

        // Verify JWT token
        const decoded = jwt.verify(token, JWT_SECRET) as {
          userId: string;
          email: string;
        };

        // Attach user info to socket
        socket.userId = parseInt(decoded.userId);
        socket.userEmail = decoded.email;

        logger.info(`WebSocket authenticated: User ${socket.userId} (${socket.userEmail})`);
        next();
      } catch (error) {
        logger.error('WebSocket authentication error:', error);
        next(new Error('Invalid authentication token'));
      }
    });
  }

  /**
   * Setup WebSocket event handlers
   */
  private setupEventHandlers() {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      logger.info(`Client connected: ${socket.id} (User: ${socket.userId})`);

      // Track connected users
      this.trackUser(socket);

      // Handle user joining a conversation room
      socket.on('join_conversation', (conversationId: string) => {
        this.handleJoinConversation(socket, conversationId);
      });

      // Handle user leaving a conversation room
      socket.on('leave_conversation', (conversationId: string) => {
        this.handleLeaveConversation(socket, conversationId);
      });

      // Handle typing indicator
      socket.on('typing_start', (data: { conversationId: string }) => {
        this.handleTypingStart(socket, data.conversationId);
      });

      socket.on('typing_stop', (data: { conversationId: string }) => {
        this.handleTypingStop(socket, data.conversationId);
      });

      // Handle message acknowledgment
      socket.on('message_read', (data: { messageId: number; conversationId: string }) => {
        this.handleMessageRead(socket, data);
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });

      // Handle errors
      socket.on('error', (error) => {
        logger.error(`Socket error for user ${socket.userId}:`, error);
      });
    });
  }

  /**
   * Track user connection
   */
  private trackUser(socket: AuthenticatedSocket) {
    if (!socket.userId) return;

    const existingSockets = this.connectedUsers.get(socket.userId) || [];
    existingSockets.push(socket.id);
    this.connectedUsers.set(socket.userId, existingSockets);

    // Emit user online status to relevant users
    this.io.emit('user_status', {
      userId: socket.userId,
      status: 'online',
    });
  }

  /**
   * Handle user joining a conversation room
   */
  private handleJoinConversation(socket: AuthenticatedSocket, conversationId: string) {
    socket.conversationId = conversationId;
    socket.join(`conversation:${conversationId}`);

    logger.info(`User ${socket.userId} joined conversation ${conversationId}`);

    // Notify other users in the conversation
    socket.to(`conversation:${conversationId}`).emit('user_joined', {
      userId: socket.userId,
      userEmail: socket.userEmail,
      conversationId,
    });
  }

  /**
   * Handle user leaving a conversation room
   */
  private handleLeaveConversation(socket: AuthenticatedSocket, conversationId: string) {
    socket.leave(`conversation:${conversationId}`);

    logger.info(`User ${socket.userId} left conversation ${conversationId}`);

    // Notify other users in the conversation
    socket.to(`conversation:${conversationId}`).emit('user_left', {
      userId: socket.userId,
      conversationId,
    });
  }

  /**
   * Handle typing start indicator
   */
  private handleTypingStart(socket: AuthenticatedSocket, conversationId: string) {
    socket.to(`conversation:${conversationId}`).emit('user_typing', {
      userId: socket.userId,
      userEmail: socket.userEmail,
      conversationId,
      isTyping: true,
    });
  }

  /**
   * Handle typing stop indicator
   */
  private handleTypingStop(socket: AuthenticatedSocket, conversationId: string) {
    socket.to(`conversation:${conversationId}`).emit('user_typing', {
      userId: socket.userId,
      userEmail: socket.userEmail,
      conversationId,
      isTyping: false,
    });
  }

  /**
   * Handle message read acknowledgment
   */
  private handleMessageRead(
    socket: AuthenticatedSocket,
    data: { messageId: number; conversationId: string }
  ) {
    socket.to(`conversation:${data.conversationId}`).emit('message_read', {
      messageId: data.messageId,
      userId: socket.userId,
      conversationId: data.conversationId,
    });
  }

  /**
   * Handle client disconnection
   */
  private handleDisconnect(socket: AuthenticatedSocket) {
    logger.info(`Client disconnected: ${socket.id} (User: ${socket.userId})`);

    if (!socket.userId) return;

    // Remove socket from user's connections
    const userSockets = this.connectedUsers.get(socket.userId) || [];
    const updatedSockets = userSockets.filter((id) => id !== socket.id);

    if (updatedSockets.length === 0) {
      // User has no more active connections
      this.connectedUsers.delete(socket.userId);

      // Emit user offline status
      this.io.emit('user_status', {
        userId: socket.userId,
        status: 'offline',
      });
    } else {
      this.connectedUsers.set(socket.userId, updatedSockets);
    }
  }

  /**
   * Emit a new message to all users in a conversation
   */
  public emitNewMessage(
    conversationId: string,
    message: {
      id: number;
      sender: 'user' | 'bot';
      text: string;
      timestamp: Date;
      userId?: number;
    }
  ) {
    this.io.to(`conversation:${conversationId}`).emit('new_message', {
      conversationId,
      message,
    });
  }

  /**
   * Emit a conversation update
   */
  public emitConversationUpdate(
    conversationId: string,
    update: {
      title?: string;
      status?: string;
      language?: string;
    }
  ) {
    this.io.to(`conversation:${conversationId}`).emit('conversation_updated', {
      conversationId,
      update,
    });
  }

  /**
   * Send a direct message to a specific user
   */
  public sendToUser(userId: number, event: string, data: any) {
    const socketIds = this.connectedUsers.get(userId);
    if (socketIds) {
      socketIds.forEach((socketId) => {
        this.io.to(socketId).emit(event, data);
      });
    }
  }

  /**
   * Broadcast admin message to all connected users
   */
  public broadcastAdminMessage(message: string) {
    this.io.emit('admin_broadcast', {
      message,
      timestamp: new Date(),
    });
  }

  /**
   * Get number of connected users
   */
  public getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }

  /**
   * Check if a user is online
   */
  public isUserOnline(userId: number): boolean {
    return this.connectedUsers.has(userId);
  }

  /**
   * Get all online users
   */
  public getOnlineUsers(): number[] {
    return Array.from(this.connectedUsers.keys());
  }

  /**
   * Get the Socket.IO server instance
   */
  public getIO(): Server {
    return this.io;
  }
}

// Singleton instance
let websocketServer: WebSocketServer | null = null;

export function initializeWebSocket(httpServer: HTTPServer): WebSocketServer {
  if (!websocketServer) {
    websocketServer = new WebSocketServer(httpServer);
    logger.info('WebSocket server initialized');
  }
  return websocketServer;
}

export function getWebSocketServer(): WebSocketServer | null {
  return websocketServer;
}

export default { initializeWebSocket, getWebSocketServer, WebSocketServer };
