import { UserRole, Permission } from '../../types/auth.types';

// Role-Permission mapping
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
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
  ],

  [UserRole.MODERATOR]: [
    Permission.READ_USER,
    Permission.UPDATE_USER,
    Permission.CREATE_CONVERSATION,
    Permission.READ_CONVERSATION,
    Permission.DELETE_CONVERSATION,
    Permission.READ_ANALYTICS,
    Permission.MODERATE_CONTENT,
    Permission.API_ACCESS
  ],

  [UserRole.USER]: [
    Permission.CREATE_CONVERSATION,
    Permission.READ_CONVERSATION,
    Permission.API_ACCESS
  ],

  [UserRole.VIEWER]: [
    Permission.READ_CONVERSATION,
    Permission.API_ACCESS
  ]
};

export class RBACService {
  // Check if user has specific permission
  static hasPermission(userRole: UserRole, permission: Permission): boolean {
    const rolePermissions = ROLE_PERMISSIONS[userRole];
    return rolePermissions.includes(permission);
  }

  // Check if user has any of the specified permissions
  static hasAnyPermission(userRole: UserRole, permissions: Permission[]): boolean {
    return permissions.some(permission => this.hasPermission(userRole, permission));
  }

  // Check if user has all specified permissions
  static hasAllPermissions(userRole: UserRole, permissions: Permission[]): boolean {
    return permissions.every(permission => this.hasPermission(userRole, permission));
  }

  // Get all permissions for a role
  static getPermissions(userRole: UserRole): Permission[] {
    return ROLE_PERMISSIONS[userRole] || [];
  }

  // Check if a role can access another role's data
  static canAccessRole(actorRole: UserRole, targetRole: UserRole): boolean {
    const roleHierarchy = {
      [UserRole.ADMIN]: 4,
      [UserRole.MODERATOR]: 3,
      [UserRole.USER]: 2,
      [UserRole.VIEWER]: 1
    };

    return roleHierarchy[actorRole] >= roleHierarchy[targetRole];
  }
}

export default RBACService;
