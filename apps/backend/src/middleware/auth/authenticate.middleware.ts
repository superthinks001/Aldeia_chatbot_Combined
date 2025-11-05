import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../../services/auth/auth.service';
import { JWTPayload } from '../../types/auth.types';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

// ============================================
// AUTHENTICATION MIDDLEWARE
// ============================================

/**
 * Middleware to authenticate requests using JWT access tokens
 * Extracts token from Authorization header and verifies it
 * Adds user payload to request object if valid
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
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
    const payload = await AuthService.verifyAccessToken(token);

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
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Authentication failed'
    });
  }
};

/**
 * Optional authentication middleware
 * Adds user to request if token is valid, but doesn't block if invalid
 */
export const optionalAuthenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const payload = await AuthService.verifyAccessToken(token);

      if (payload) {
        req.user = payload;
      }
    }

    next();
  } catch (error) {
    // Silently continue without authentication
    next();
  }
};

export default authenticate;
