import jwt, { SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { supabase } from '../../config/database';
import { UserRole, JWTPayload, AuthTokens, UserResponse } from '../../types/auth.types';

export class AuthService {
  private static JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-me';
  private static JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret';
  private static JWT_EXPIRATION = process.env.JWT_EXPIRATION || '24h';
  private static JWT_REFRESH_EXPIRATION = process.env.JWT_REFRESH_EXPIRATION || '30d';

  // ============================================
  // USER REGISTRATION
  // ============================================

  static async registerUser(
    email: string,
    password: string,
    name: string,
    county?: string
  ): Promise<UserResponse> {
    try {
      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 12);

      // Create user in database
      const { data: user, error } = await supabase
        .from('users')
        .insert({
          email,
          password_hash: passwordHash,
          name,
          county: county || null,
          role: UserRole.USER,
          is_active: true
        })
        .select()
        .single();

      if (error) {
        console.error('Registration error:', error);
        throw new Error('Failed to create user');
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        created_at: user.created_at
      };
    } catch (error: any) {
      throw new Error(error.message || 'Registration failed');
    }
  }

  // ============================================
  // USER AUTHENTICATION
  // ============================================

  static async authenticateUser(
    email: string,
    password: string
  ): Promise<{ user: UserResponse; tokens: AuthTokens } | null> {
    try {
      // Get user from database
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (error || !user) {
        return null;
      }

      // Check if user is active
      if (!user.is_active) {
        throw new Error('Account is deactivated');
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        return null;
      }

      // Generate tokens
      const accessToken = this.generateAccessToken(user);
      const refreshToken = this.generateRefreshToken(user);

      // Store refresh token in database
      await this.storeRefreshToken(user.id, refreshToken);

      // Update last login
      await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', user.id);

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          created_at: user.created_at
        },
        tokens: {
          accessToken,
          refreshToken
        }
      };
    } catch (error: any) {
      throw new Error(error.message || 'Authentication failed');
    }
  }

  // ============================================
  // TOKEN GENERATION
  // ============================================

  static generateAccessToken(user: any): string {
    const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
      userId: user.id,
      email: user.email,
      role: user.role
    };

    return jwt.sign(
      payload,
      this.JWT_SECRET,
      { expiresIn: this.JWT_EXPIRATION } as SignOptions
    );
  }

  static generateRefreshToken(user: any): string {
    return jwt.sign(
      { userId: user.id },
      this.JWT_REFRESH_SECRET,
      { expiresIn: this.JWT_REFRESH_EXPIRATION } as SignOptions
    );
  }

  // ============================================
  // TOKEN VERIFICATION
  // ============================================

  static async verifyAccessToken(token: string): Promise<JWTPayload | null> {
    try {
      const payload = jwt.verify(token, this.JWT_SECRET) as JWTPayload;
      return payload;
    } catch (error) {
      return null;
    }
  }

  static async verifyRefreshToken(token: string): Promise<any | null> {
    try {
      const payload = jwt.verify(token, this.JWT_REFRESH_SECRET) as any;
      return payload;
    } catch (error) {
      return null;
    }
  }

  // ============================================
  // REFRESH TOKEN MANAGEMENT
  // ============================================

  static async storeRefreshToken(
    userId: string,
    token: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days from now

    await supabase.from('sessions').insert({
      user_id: userId,
      refresh_token: token,
      expires_at: expiresAt.toISOString(),
      ip_address: ipAddress,
      user_agent: userAgent
    });
  }

  static async refreshAccessToken(
    refreshToken: string
  ): Promise<{ user: UserResponse; tokens: AuthTokens } | null> {
    try {
      // Verify refresh token
      const payload = await this.verifyRefreshToken(refreshToken);
      if (!payload) {
        return null;
      }

      // Check if refresh token exists and is active
      const { data: session } = await supabase
        .from('sessions')
        .select('*')
        .eq('refresh_token', refreshToken)
        .single();

      if (!session) {
        return null;
      }

      // Check if token expired
      if (new Date(session.expires_at) < new Date()) {
        await this.invalidateRefreshToken(refreshToken);
        return null;
      }

      // Get user
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', payload.userId)
        .single();

      if (error || !user || !user.is_active) {
        return null;
      }

      // Generate new tokens
      const newAccessToken = this.generateAccessToken(user);
      const newRefreshToken = this.generateRefreshToken(user);

      // Invalidate old refresh token
      await this.invalidateRefreshToken(refreshToken);

      // Store new refresh token
      await this.storeRefreshToken(user.id, newRefreshToken);


      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          created_at: user.created_at
        },
        tokens: {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken
        }
      };
    } catch (error) {
      return null;
    }
  }

  static async invalidateRefreshToken(token: string): Promise<void> {
    await supabase
      .from('sessions')
      .delete()
      .eq('refresh_token', token);
  }

  // ============================================
  // LOGOUT
  // ============================================

  static async logout(refreshToken: string): Promise<void> {
    await this.invalidateRefreshToken(refreshToken);
  }

  static async logoutAllSessions(userId: string): Promise<void> {
    await supabase
      .from('sessions')
      .delete()
      .eq('user_id', userId);
  }

  // ============================================
  // PASSWORD MANAGEMENT
  // ============================================

  static async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<boolean> {
    try {
      // Get user
      const { data: user } = await supabase
        .from('users')
        .select('password_hash')
        .eq('id', userId)
        .single();

      if (!user) {
        return false;
      }

      // Verify current password
      const isValid = await bcrypt.compare(currentPassword, user.password_hash);
      if (!isValid) {
        return false;
      }

      // Hash new password
      const newPasswordHash = await bcrypt.hash(newPassword, 12);

      // Update password
      const { error } = await supabase
        .from('users')
        .update({ password_hash: newPasswordHash })
        .eq('id', userId);

      if (error) {
        return false;
      }

      // Invalidate all sessions (force re-login)
      await this.logoutAllSessions(userId);

      return true;
    } catch (error) {
      return false;
    }
  }
}

export default AuthService;
