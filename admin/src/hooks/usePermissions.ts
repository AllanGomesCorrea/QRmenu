import { useMemo } from 'react';
import { useAuthStore } from '../stores/authStore';
import { 
  Permission, 
  UserRole, 
  ROLE_PERMISSIONS, 
  MENU_ITEMS,
  getDefaultRoute,
  ROLE_LABELS,
} from '../config/permissions';

export function usePermissions() {
  const user = useAuthStore((state) => state.user);
  
  const role = (user?.role as UserRole) || 'WAITER';
  const permissions = useMemo(() => ROLE_PERMISSIONS[role] || [], [role]);
  
  /**
   * Check if the user has a specific permission
   */
  const hasPermission = (permission: Permission): boolean => {
    return permissions.includes(permission);
  };

  /**
   * Check if the user has any of the given permissions
   */
  const hasAnyPermission = (perms: Permission[]): boolean => {
    return perms.some(p => permissions.includes(p));
  };

  /**
   * Check if the user has all of the given permissions
   */
  const hasAllPermissions = (perms: Permission[]): boolean => {
    return perms.every(p => permissions.includes(p));
  };

  /**
   * Get menu items the user can access
   */
  const allowedMenuItems = useMemo(() => {
    return MENU_ITEMS.filter(item => hasPermission(item.permission));
  }, [permissions]);

  /**
   * Get the default route for the user's role
   */
  const defaultRoute = useMemo(() => getDefaultRoute(role), [role]);

  /**
   * Get the role label in Portuguese
   */
  const roleLabel = useMemo(() => ROLE_LABELS[role] || role, [role]);

  /**
   * Check if user can manage (edit/create/delete) a resource
   */
  const canManage = (resource: 'kitchen' | 'cashier' | 'tables' | 'menu' | 'users' | 'settings'): boolean => {
    return hasPermission(`${resource}:manage` as Permission);
  };

  return {
    role,
    roleLabel,
    permissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    allowedMenuItems,
    defaultRoute,
    canManage,
    isAdmin: role === 'ADMIN' || role === 'SUPER_ADMIN',
    isSuperAdmin: role === 'SUPER_ADMIN',
  };
}

