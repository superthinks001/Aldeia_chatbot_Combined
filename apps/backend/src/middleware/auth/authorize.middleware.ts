import { Request, Response, NextFunction } from 'express';
import { UserRole, Permission } from '../../types/auth.types';

// ============================================
// ROLE-BASED ACCESS CONTROL (RBAC)
// ============================================

/**
 * Role hierarchy for authorization checks
 * Higher roles inherit permissions from lower roles
 */
const ROLE_HIERARCHY: Record<UserRole, number> = {
  [UserRole.VIEWER]: 1,
  [UserRole.USER]: 2,
  [UserRole.MODERATOR]: 3,
  [UserRole.ADMIN]: 4
};

/**
 * Permission mappings for each role
 * Defines which permissions each role has access to
 */
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.VIEWER]: [
    Permission.READ_USER,
    Permission.READ_CONVERSATION,
    Permission.READ_ANALYTICS,
    Permission.API_ACCESS
  ],
  [UserRole.USER]: [
    Permission.READ_USER,
    Permission.CREATE_CONVERSATION,
    Permission.READ_CONVERSATION,
    Permission.DELETE_CONVERSATION,
    Permission.READ_ANALYTICS,
    Permission.API_ACCESS
  ],
  [UserRole.MODERATOR]: [
    Permission.READ_USER,
    Permission.CREATE_CONVERSATION,
    Permission.READ_CONVERSATION,
    Permission.DELETE_CONVERSATION,
    Permission.READ_ANALYTICS,
    Permission.READ_ADVANCED_ANALYTICS,
    Permission.EXPORT_DATA,
    Permission.MODERATE_CONTENT,
    Permission.MANAGE_CONTENT,
    Permission.API_ACCESS
  ],
  [UserRole.ADMIN]: [
    Permission.CREATE_USER,
    Permission.READ_USER,
    Permission.UPDATE_USER,
    Permission.DELETE_USER,
    Permission.CREATE_CONVERSATION,
    Permission.READ_CONVERSATION,
    Permission.DELETE_CONVERSATION,
    Permission.READ_ANALYTICS,
    Permission.READ_ADVANCED_ANALYTICS,
    Permission.EXPORT_DATA,
    Permission.MANAGE_SYSTEM,
    Permission.VIEW_SYSTEM_LOGS,
    Permission.MANAGE_PERMISSIONS,
    Permission.MANAGE_CONTENT,
    Permission.MODERATE_CONTENT,
    Permission.API_ACCESS,
    Permission.ADMIN_API_ACCESS
  ]
};

// ============================================
// AUTHORIZATION MIDDLEWARE
// ============================================

/**
 * Middleware to check if user has required role
 * @param requiredRole - Minimum role required to access the route
 */
export const requireRole = (requiredRole: UserRole) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return;
    }

    const userRole = req.user.role;
    const userRoleLevel = ROLE_HIERARCHY[userRole];
    const requiredRoleLevel = ROLE_HIERARCHY[requiredRole];

    if (userRoleLevel < requiredRoleLevel) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        details: `Requires ${requiredRole} role or higher`
      });
      return;
    }

    next();
  };
};

/**
 * Middleware to check if user has specific permission
 * @param requiredPermission - Permission required to access the route
 */
export const requirePermission = (requiredPermission: Permission) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return;
    }

    const userRole = req.user.role;
    const userPermissions = ROLE_PERMISSIONS[userRole];

    if (!userPermissions.includes(requiredPermission)) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        details: `Requires ${requiredPermission} permission`
      });
      return;
    }

    next();
  };
};

/**
 * Middleware to check if user has any of the specified permissions
 * @param permissions - Array of permissions (user needs at least one)
 */
export const requireAnyPermission = (permissions: Permission[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return;
    }

    const userRole = req.user.role;
    const userPermissions = ROLE_PERMISSIONS[userRole];

    const hasPermission = permissions.some(permission =>
      userPermissions.includes(permission)
    );

    if (!hasPermission) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        details: `Requires one of: ${permissions.join(', ')}`
      });
      return;
    }

    next();
  };
};

/**
 * Middleware to check if user has all of the specified permissions
 * @param permissions - Array of permissions (user needs all of them)
 */
export const requireAllPermissions = (permissions: Permission[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return;
    }

    const userRole = req.user.role;
    const userPermissions = ROLE_PERMISSIONS[userRole];

    const hasAllPermissions = permissions.every(permission =>
      userPermissions.includes(permission)
    );

    if (!hasAllPermissions) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        details: `Requires all of: ${permissions.join(', ')}`
      });
      return;
    }

    next();
  };
};

/**
 * Middleware to check if user is accessing their own resource
 * @param userIdParam - Name of the route parameter containing user ID (default: 'userId')
 */
export const requireSelfOrAdmin = (userIdParam: string = 'userId') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return;
    }

    const requestedUserId = req.params[userIdParam];
    const isAdmin = req.user.role === UserRole.ADMIN;
    const isSelf = req.user.userId === requestedUserId;

    if (!isSelf && !isAdmin) {
      res.status(403).json({
        success: false,
        error: 'Access denied',
        details: 'You can only access your own resources'
      });
      return;
    }

    next();
  };
};

/**
 * Helper function to check if a user has a specific permission
 * @param role - User's role
 * @param permission - Permission to check
 * @returns boolean indicating if user has permission
 */
export const hasPermission = (role: UserRole, permission: Permission): boolean => {
  return ROLE_PERMISSIONS[role]?.includes(permission) || false;
};

/**
 * Helper function to get all permissions for a role
 * @param role - User's role
 * @returns Array of permissions
 */
export const getRolePermissions = (role: UserRole): Permission[] => {
  return ROLE_PERMISSIONS[role] || [];
};

export default {
  requireRole,
  requirePermission,
  requireAnyPermission,
  requireAllPermissions,
  requireSelfOrAdmin,
  hasPermission,
  getRolePermissions
};
