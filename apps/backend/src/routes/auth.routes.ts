import express, { Request, Response } from 'express';
import { AuthService } from '../services/auth/auth.service';
import { authenticate, requireRole } from '../middleware/auth';
import { UserRole } from '../types/auth.types';
import { logger } from '../utils/logger';

const router = express.Router();

// ====================================================================
// USER REGISTRATION
// ====================================================================

interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  county?: string;
}

router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, name, county }: RegisterRequest = req.body;

    // Validation
    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        error: 'Email, password, and name are required'
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }

    // Password validation (minimum 8 characters)
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters long'
      });
    }

    // Register user
    const user = await AuthService.registerUser(email, password, name, county);

    // Generate tokens for auto-login after registration
    const tokens = {
      accessToken: AuthService.generateAccessToken(user),
      refreshToken: AuthService.generateRefreshToken(user)
    };

    // Store refresh token
    await AuthService.storeRefreshToken(
      user.id,
      tokens.refreshToken,
      req.ip,
      req.headers['user-agent']
    );

    logger.info(`New user registered: ${user.email}`);

    res.status(201).json({
      success: true,
      data: {
        user,
        tokens
      },
      message: 'User registered successfully'
    });
  } catch (error: any) {
    logger.error('Registration error:', error);

    // Handle specific errors
    if (error.message.includes('already exists')) {
      return res.status(409).json({
        success: false,
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: 'Registration failed'
    });
  }
});

// ====================================================================
// USER LOGIN
// ====================================================================

interface LoginRequest {
  email: string;
  password: string;
}

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password }: LoginRequest = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    // Authenticate user
    const result = await AuthService.authenticateUser(email, password);

    if (!result) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    logger.info(`User logged in: ${result.user.email}`);

    res.json({
      success: true,
      data: result,
      message: 'Login successful'
    });
  } catch (error: any) {
    logger.error('Login error:', error);

    // Handle specific errors
    if (error.message.includes('deactivated')) {
      return res.status(403).json({
        success: false,
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: 'Login failed'
    });
  }
});

// ====================================================================
// REFRESH ACCESS TOKEN
// ====================================================================

interface RefreshRequest {
  refreshToken: string;
}

router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken }: RefreshRequest = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token is required'
      });
    }

    const result = await AuthService.refreshAccessToken(refreshToken);

    if (!result) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired refresh token'
      });
    }

    logger.info(`Token refreshed for user: ${result.user.email}`);

    res.json({
      success: true,
      data: result,
      message: 'Token refreshed successfully'
    });
  } catch (error: any) {
    logger.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to refresh token'
    });
  }
});

// ====================================================================
// GET USER PROFILE (Protected)
// ====================================================================

router.get('/profile', authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    res.json({
      success: true,
      data: {
        id: req.user.userId,
        email: req.user.email,
        role: req.user.role
      }
    });
  } catch (error: any) {
    logger.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user profile'
    });
  }
});

// ====================================================================
// CHANGE PASSWORD (Protected)
// ====================================================================

interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

router.post('/change-password', authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const { currentPassword, newPassword }: ChangePasswordRequest = req.body;

    // Validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'New password must be at least 8 characters long'
      });
    }

    // Change password
    const success = await AuthService.changePassword(
      req.user.userId,
      currentPassword,
      newPassword
    );

    if (!success) {
      return res.status(401).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }

    logger.info(`Password changed for user: ${req.user.email}`);

    res.json({
      success: true,
      message: 'Password changed successfully. Please log in again.'
    });
  } catch (error: any) {
    logger.error('Change password error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to change password'
    });
  }
});

// ====================================================================
// LOGOUT (Protected)
// ====================================================================

interface LogoutRequest {
  refreshToken: string;
}

router.post('/logout', authenticate, async (req: Request, res: Response) => {
  try {
    const { refreshToken }: LogoutRequest = req.body;

    if (refreshToken) {
      await AuthService.logout(refreshToken);
    }

    if (req.user) {
      logger.info(`User logged out: ${req.user.email}`);
    }

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error: any) {
    logger.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to logout'
    });
  }
});

// ====================================================================
// LOGOUT ALL SESSIONS (Protected)
// ====================================================================

router.post('/logout-all', authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    await AuthService.logoutAllSessions(req.user.userId);

    logger.info(`All sessions logged out for user: ${req.user.email}`);

    res.json({
      success: true,
      message: 'Logged out from all sessions successfully'
    });
  } catch (error: any) {
    logger.error('Logout all sessions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to logout from all sessions'
    });
  }
});

// ====================================================================
// VERIFY TOKEN (Utility endpoint for clients)
// ====================================================================

router.get('/verify', authenticate, async (req: Request, res: Response) => {
  try {
    // If middleware passes, token is valid
    res.json({
      success: true,
      data: {
        valid: true,
        user: req.user
      }
    });
  } catch (error: any) {
    logger.error('Verify token error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify token'
    });
  }
});

export default router;
