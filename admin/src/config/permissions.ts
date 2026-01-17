/**
 * Role-Based Access Control (RBAC) Configuration
 * 
 * Defines which features each role can access
 */

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'KITCHEN' | 'WAITER' | 'CASHIER';

export type Permission = 
  | 'dashboard:view'
  | 'kitchen:view'
  | 'kitchen:manage'
  | 'cashier:view'
  | 'cashier:manage'
  | 'tables:view'
  | 'tables:manage'
  | 'menu:view'
  | 'menu:manage'
  | 'users:view'
  | 'users:manage'
  | 'reports:view'
  | 'settings:view'
  | 'settings:manage';

/**
 * Permissions matrix by role
 */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  SUPER_ADMIN: [
    'dashboard:view',
    'kitchen:view', 'kitchen:manage',
    'cashier:view', 'cashier:manage',
    'tables:view', 'tables:manage',
    'menu:view', 'menu:manage',
    'users:view', 'users:manage',
    'reports:view',
    'settings:view', 'settings:manage',
  ],
  
  ADMIN: [
    'dashboard:view',
    'kitchen:view', 'kitchen:manage',
    'cashier:view', 'cashier:manage',
    'tables:view', 'tables:manage',
    'menu:view', 'menu:manage',
    'users:view', 'users:manage',
    'reports:view',
    'settings:view', 'settings:manage',
  ],
  
  MANAGER: [
    'dashboard:view',
    'kitchen:view',
    'cashier:view',
    'tables:view',
    'menu:view',
  ],
  
  KITCHEN: [
    'kitchen:view', 'kitchen:manage',
  ],
  
  WAITER: [
    'tables:view',
    'kitchen:view', // Can see order status
  ],
  
  CASHIER: [
    'cashier:view', 'cashier:manage',
    'tables:view', // Can see table status for billing
  ],
};

/**
 * Menu items configuration with required permissions
 */
export interface MenuItem {
  icon: string;
  label: string;
  path: string;
  permission: Permission;
}

export const MENU_ITEMS: MenuItem[] = [
  { icon: 'LayoutDashboard', label: 'Dashboard', path: '/dashboard', permission: 'dashboard:view' },
  { icon: 'ChefHat', label: 'Cozinha', path: '/kitchen', permission: 'kitchen:view' },
  { icon: 'CreditCard', label: 'Caixa', path: '/cashier', permission: 'cashier:view' },
  { icon: 'QrCode', label: 'Mesas', path: '/tables', permission: 'tables:view' },
  { icon: 'UtensilsCrossed', label: 'Cardápio', path: '/menu', permission: 'menu:view' },
  { icon: 'Users', label: 'Usuários', path: '/users', permission: 'users:view' },
  { icon: 'BarChart3', label: 'Relatórios', path: '/reports', permission: 'reports:view' },
  { icon: 'Settings', label: 'Configurações', path: '/settings', permission: 'settings:view' },
];

/**
 * Get default landing page for a role
 */
export function getDefaultRoute(role: UserRole): string {
  switch (role) {
    case 'KITCHEN':
      return '/kitchen';
    case 'CASHIER':
      return '/cashier';
    case 'WAITER':
      return '/tables';
    default:
      return '/dashboard';
  }
}

/**
 * Role display names in Portuguese
 */
export const ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Administrador',
  MANAGER: 'Gerente',
  KITCHEN: 'Cozinha',
  WAITER: 'Garçom',
  CASHIER: 'Caixa',
};

