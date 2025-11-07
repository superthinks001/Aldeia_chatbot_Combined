"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RBACService = void 0;
const auth_types_1 = require("../../types/auth.types");
// Role-Permission mapping
const ROLE_PERMISSIONS = {
    [auth_types_1.UserRole.ADMIN]: [
        auth_types_1.Permission.CREATE_USER,
        auth_types_1.Permission.READ_USER,
        auth_types_1.Permission.UPDATE_USER,
        auth_types_1.Permission.DELETE_USER,
        auth_types_1.Permission.CREATE_CONVERSATION,
        auth_types_1.Permission.READ_CONVERSATION,
        auth_types_1.Permission.DELETE_CONVERSATION,
        auth_types_1.Permission.READ_ANALYTICS,
        auth_types_1.Permission.READ_ADVANCED_ANALYTICS,
        auth_types_1.Permission.EXPORT_DATA,
        auth_types_1.Permission.MANAGE_SYSTEM,
        auth_types_1.Permission.VIEW_SYSTEM_LOGS,
        auth_types_1.Permission.MANAGE_PERMISSIONS,
        auth_types_1.Permission.MANAGE_CONTENT,
        auth_types_1.Permission.MODERATE_CONTENT,
        auth_types_1.Permission.API_ACCESS,
        auth_types_1.Permission.ADMIN_API_ACCESS
    ],
    [auth_types_1.UserRole.MODERATOR]: [
        auth_types_1.Permission.READ_USER,
        auth_types_1.Permission.UPDATE_USER,
        auth_types_1.Permission.CREATE_CONVERSATION,
        auth_types_1.Permission.READ_CONVERSATION,
        auth_types_1.Permission.DELETE_CONVERSATION,
        auth_types_1.Permission.READ_ANALYTICS,
        auth_types_1.Permission.MODERATE_CONTENT,
        auth_types_1.Permission.API_ACCESS
    ],
    [auth_types_1.UserRole.USER]: [
        auth_types_1.Permission.CREATE_CONVERSATION,
        auth_types_1.Permission.READ_CONVERSATION,
        auth_types_1.Permission.API_ACCESS
    ],
    [auth_types_1.UserRole.VIEWER]: [
        auth_types_1.Permission.READ_CONVERSATION,
        auth_types_1.Permission.API_ACCESS
    ]
};
class RBACService {
    // Check if user has specific permission
    static hasPermission(userRole, permission) {
        const rolePermissions = ROLE_PERMISSIONS[userRole];
        return rolePermissions.includes(permission);
    }
    // Check if user has any of the specified permissions
    static hasAnyPermission(userRole, permissions) {
        return permissions.some(permission => this.hasPermission(userRole, permission));
    }
    // Check if user has all specified permissions
    static hasAllPermissions(userRole, permissions) {
        return permissions.every(permission => this.hasPermission(userRole, permission));
    }
    // Get all permissions for a role
    static getPermissions(userRole) {
        return ROLE_PERMISSIONS[userRole] || [];
    }
    // Check if a role can access another role's data
    static canAccessRole(actorRole, targetRole) {
        const roleHierarchy = {
            [auth_types_1.UserRole.ADMIN]: 4,
            [auth_types_1.UserRole.MODERATOR]: 3,
            [auth_types_1.UserRole.USER]: 2,
            [auth_types_1.UserRole.VIEWER]: 1
        };
        return roleHierarchy[actorRole] >= roleHierarchy[targetRole];
    }
}
exports.RBACService = RBACService;
exports.default = RBACService;
