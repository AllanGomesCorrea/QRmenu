import { describe, it, expect } from 'vitest';
import {
  ROLE_PERMISSIONS,
  ROLE_LABELS,
  MENU_ITEMS,
  getDefaultRoute,
  type UserRole,
  type Permission,
} from './permissions';

describe('permissions', () => {
  describe('ROLE_PERMISSIONS', () => {
    it('SUPER_ADMIN should have all permissions', () => {
      const allPermissions: Permission[] = [
        'dashboard:view',
        'kitchen:view', 'kitchen:manage',
        'cashier:view', 'cashier:manage',
        'tables:view', 'tables:manage',
        'menu:view', 'menu:manage',
        'users:view', 'users:manage',
        'reports:view',
        'settings:view', 'settings:manage',
      ];

      allPermissions.forEach((perm) => {
        expect(ROLE_PERMISSIONS.SUPER_ADMIN).toContain(perm);
      });
    });

    it('ADMIN should have all permissions', () => {
      expect(ROLE_PERMISSIONS.ADMIN.length).toBe(ROLE_PERMISSIONS.SUPER_ADMIN.length);
    });

    it('KITCHEN role should only have kitchen permissions', () => {
      expect(ROLE_PERMISSIONS.KITCHEN).toContain('kitchen:view');
      expect(ROLE_PERMISSIONS.KITCHEN).toContain('kitchen:manage');
      expect(ROLE_PERMISSIONS.KITCHEN).not.toContain('dashboard:view');
      expect(ROLE_PERMISSIONS.KITCHEN).not.toContain('settings:manage');
    });

    it('WAITER role should have tables and kitchen view', () => {
      expect(ROLE_PERMISSIONS.WAITER).toContain('tables:view');
      expect(ROLE_PERMISSIONS.WAITER).toContain('kitchen:view');
      expect(ROLE_PERMISSIONS.WAITER).not.toContain('cashier:view');
    });

    it('CASHIER role should have cashier and tables view', () => {
      expect(ROLE_PERMISSIONS.CASHIER).toContain('cashier:view');
      expect(ROLE_PERMISSIONS.CASHIER).toContain('cashier:manage');
      expect(ROLE_PERMISSIONS.CASHIER).toContain('tables:view');
      expect(ROLE_PERMISSIONS.CASHIER).not.toContain('menu:manage');
    });

    it('MANAGER role should have view-only permissions for main areas', () => {
      expect(ROLE_PERMISSIONS.MANAGER).toContain('dashboard:view');
      expect(ROLE_PERMISSIONS.MANAGER).toContain('kitchen:view');
      expect(ROLE_PERMISSIONS.MANAGER).toContain('cashier:view');
      expect(ROLE_PERMISSIONS.MANAGER).not.toContain('users:manage');
      expect(ROLE_PERMISSIONS.MANAGER).not.toContain('settings:manage');
    });
  });

  describe('ROLE_LABELS', () => {
    it('should have labels for all roles', () => {
      const roles: UserRole[] = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'KITCHEN', 'WAITER', 'CASHIER'];
      roles.forEach((role) => {
        expect(ROLE_LABELS[role]).toBeDefined();
        expect(typeof ROLE_LABELS[role]).toBe('string');
      });
    });

    it('should have correct Portuguese labels', () => {
      expect(ROLE_LABELS.ADMIN).toBe('Administrador');
      expect(ROLE_LABELS.KITCHEN).toBe('Cozinha');
      expect(ROLE_LABELS.WAITER).toBe('Garçom');
      expect(ROLE_LABELS.CASHIER).toBe('Caixa');
    });
  });

  describe('MENU_ITEMS', () => {
    it('should contain expected menu items', () => {
      const paths = MENU_ITEMS.map((item) => item.path);
      expect(paths).toContain('/dashboard');
      expect(paths).toContain('/kitchen');
      expect(paths).toContain('/cashier');
      expect(paths).toContain('/tables');
      expect(paths).toContain('/menu');
      expect(paths).toContain('/users');
      expect(paths).toContain('/reports');
      expect(paths).toContain('/settings');
    });

    it('each menu item should have required fields', () => {
      MENU_ITEMS.forEach((item) => {
        expect(item.icon).toBeDefined();
        expect(item.label).toBeDefined();
        expect(item.path).toBeDefined();
        expect(item.permission).toBeDefined();
      });
    });
  });

  describe('getDefaultRoute', () => {
    it('should return /kitchen for KITCHEN role', () => {
      expect(getDefaultRoute('KITCHEN')).toBe('/kitchen');
    });

    it('should return /cashier for CASHIER role', () => {
      expect(getDefaultRoute('CASHIER')).toBe('/cashier');
    });

    it('should return /tables for WAITER role', () => {
      expect(getDefaultRoute('WAITER')).toBe('/tables');
    });

    it('should return /dashboard for ADMIN role', () => {
      expect(getDefaultRoute('ADMIN')).toBe('/dashboard');
    });

    it('should return /dashboard for SUPER_ADMIN role', () => {
      expect(getDefaultRoute('SUPER_ADMIN')).toBe('/dashboard');
    });

    it('should return /dashboard for MANAGER role', () => {
      expect(getDefaultRoute('MANAGER')).toBe('/dashboard');
    });
  });
});
