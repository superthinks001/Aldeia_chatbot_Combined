import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, AuthTokens, AuthState, LoginCredentials, RegisterData } from '../types/auth';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// ============================================
// AUTH CONTEXT INTERFACE
// ============================================

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================
// TOKEN STORAGE HELPERS
// ============================================

const TOKEN_KEY = 'aldeia_access_token';
const REFRESH_TOKEN_KEY = 'aldeia_refresh_token';
const USER_KEY = 'aldeia_user';

const storage = {
  getAccessToken: (): string | null => localStorage.getItem(TOKEN_KEY),
  getRefreshToken: (): string | null => localStorage.getItem(REFRESH_TOKEN_KEY),
  getUser: (): User | null => {
    const userStr = localStorage.getItem(USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  },
  setTokens: (tokens: AuthTokens) => {
    localStorage.setItem(TOKEN_KEY, tokens.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
  },
  setUser: (user: User) => {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
};

// ============================================
// AUTH PROVIDER COMPONENT
// ============================================

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    tokens: null,
    isAuthenticated: false,
    isLoading: true,
    error: null
  });

  // ============================================
  // INITIALIZE AUTH STATE FROM STORAGE
  // ============================================

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const accessToken = storage.getAccessToken();
        const refreshToken = storage.getRefreshToken();
        const user = storage.getUser();

        if (accessToken && refreshToken && user) {
          setState({
            user,
            tokens: { accessToken, refreshToken },
            isAuthenticated: true,
            isLoading: false,
            error: null
          });

          // Verify token is still valid
          try {
            const response = await fetch(`${API_URL}/auth/verify`, {
              headers: {
                'Authorization': `Bearer ${accessToken}`
              }
            });

            if (!response.ok) {
              // Token invalid, try to refresh
              await handleRefreshToken();
            }
          } catch (error) {
            // Token validation failed, try refresh
            await handleRefreshToken();
          }
        } else {
          setState(prev => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        storage.clear();
        setState({
          user: null,
          tokens: null,
          isAuthenticated: false,
          isLoading: false,
          error: null
        });
      }
    };

    initializeAuth();
  }, []);

  // ============================================
  // LOGIN
  // ============================================

  const login = async (credentials: LoginCredentials): Promise<void> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentials)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Login failed');
      }

      // Store tokens and user
      storage.setTokens(data.data.tokens);
      storage.setUser(data.data.user);

      setState({
        user: data.data.user,
        tokens: data.data.tokens,
        isAuthenticated: true,
        isLoading: false,
        error: null
      });
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Login failed'
      }));
      throw error;
    }
  };

  // ============================================
  // REGISTER
  // ============================================

  const register = async (data: RegisterData): Promise<void> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || result.error || 'Registration failed');
      }

      // Store tokens and user from registration response
      storage.setTokens(result.data.tokens);
      storage.setUser(result.data.user);

      setState({
        user: result.data.user,
        tokens: result.data.tokens,
        isAuthenticated: true,
        isLoading: false,
        error: null
      });
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Registration failed'
      }));
      throw error;
    }
  };

  // ============================================
  // LOGOUT
  // ============================================

  const logout = async (): Promise<void> => {
    try {
      const refreshToken = storage.getRefreshToken();
      const accessToken = storage.getAccessToken();

      if (refreshToken && accessToken) {
        // Call logout endpoint (don't wait for response)
        fetch(`${API_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({ refreshToken })
        }).catch(() => {
          // Ignore errors, we're logging out anyway
        });
      }

      // Clear local storage
      storage.clear();

      // Update state
      setState({
        user: null,
        tokens: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      });
    } catch (error) {
      console.error('Logout error:', error);
      // Always clear state on logout, even if API call fails
      storage.clear();
      setState({
        user: null,
        tokens: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      });
    }
  };

  // ============================================
  // REFRESH TOKEN
  // ============================================

  const handleRefreshToken = async (): Promise<boolean> => {
    try {
      const refreshToken = storage.getRefreshToken();

      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refreshToken })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      // Store new tokens and user
      storage.setTokens(data.data.tokens);
      storage.setUser(data.data.user);

      setState(prev => ({
        ...prev,
        user: data.data.user,
        tokens: data.data.tokens,
        isAuthenticated: true
      }));

      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      // Refresh failed, log out user
      await logout();
      return false;
    }
  };

  // ============================================
  // CLEAR ERROR
  // ============================================

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // ============================================
  // CONTEXT VALUE
  // ============================================

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    refreshToken: handleRefreshToken,
    clearError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// ============================================
// CUSTOM HOOK
// ============================================

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
};

export default AuthContext;
