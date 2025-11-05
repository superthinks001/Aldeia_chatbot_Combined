// ============================================
// Authentication & Authorization Types
// ============================================

export enum UserRole {
  ADMIN = 'admin',
  MODERATOR = 'moderator',
  USER = 'user',
  VIEWER = 'viewer'
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface UserResponse {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  created_at: string;
}

export interface AuthResponse {
  user: UserResponse;
  tokens: AuthTokens;
}

export enum Permission {
  // User management
  CREATE_USER = 'create_user',
  READ_USER = 'read_user',
  UPDATE_USER = 'update_user',
  DELETE_USER = 'delete_user',

  // Chat and conversation
  CREATE_CONVERSATION = 'create_conversation',
  READ_CONVERSATION = 'read_conversation',
  DELETE_CONVERSATION = 'delete_conversation',

  // Analytics
  READ_ANALYTICS = 'read_analytics',
  READ_ADVANCED_ANALYTICS = 'read_advanced_analytics',
  EXPORT_DATA = 'export_data',

  // System administration
  MANAGE_SYSTEM = 'manage_system',
  VIEW_SYSTEM_LOGS = 'view_system_logs',
  MANAGE_PERMISSIONS = 'manage_permissions',

  // Content management
  MANAGE_CONTENT = 'manage_content',
  MODERATE_CONTENT = 'moderate_content',

  // API access
  API_ACCESS = 'api_access',
  ADMIN_API_ACCESS = 'admin_api_access'
}
