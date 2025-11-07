"use strict";
// ============================================
// Authentication & Authorization Types
// ============================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.Permission = exports.UserRole = void 0;
var UserRole;
(function (UserRole) {
    UserRole["ADMIN"] = "admin";
    UserRole["MODERATOR"] = "moderator";
    UserRole["USER"] = "user";
    UserRole["VIEWER"] = "viewer";
})(UserRole || (exports.UserRole = UserRole = {}));
var Permission;
(function (Permission) {
    // User management
    Permission["CREATE_USER"] = "create_user";
    Permission["READ_USER"] = "read_user";
    Permission["UPDATE_USER"] = "update_user";
    Permission["DELETE_USER"] = "delete_user";
    // Chat and conversation
    Permission["CREATE_CONVERSATION"] = "create_conversation";
    Permission["READ_CONVERSATION"] = "read_conversation";
    Permission["DELETE_CONVERSATION"] = "delete_conversation";
    // Analytics
    Permission["READ_ANALYTICS"] = "read_analytics";
    Permission["READ_ADVANCED_ANALYTICS"] = "read_advanced_analytics";
    Permission["EXPORT_DATA"] = "export_data";
    // System administration
    Permission["MANAGE_SYSTEM"] = "manage_system";
    Permission["VIEW_SYSTEM_LOGS"] = "view_system_logs";
    Permission["MANAGE_PERMISSIONS"] = "manage_permissions";
    // Content management
    Permission["MANAGE_CONTENT"] = "manage_content";
    Permission["MODERATE_CONTENT"] = "moderate_content";
    // API access
    Permission["API_ACCESS"] = "api_access";
    Permission["ADMIN_API_ACCESS"] = "admin_api_access";
})(Permission || (exports.Permission = Permission = {}));
