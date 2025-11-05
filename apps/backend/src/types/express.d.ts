/**
 * Express Type Extensions
 *
 * Extends Express Request type to include custom properties
 */

import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        userId?: number;  // Alias for id (for backward compatibility)
        email: string;
        role: string;
        name?: string;
      };
    }
  }
}

export {};
