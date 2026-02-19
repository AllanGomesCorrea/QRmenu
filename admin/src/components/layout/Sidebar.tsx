import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ChefHat,
  CreditCard,
  UtensilsCrossed,
  Users,
  QrCode,
  BarChart3,
  Settings,
  LucideIcon,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { usePermissions } from '../../hooks/usePermissions';

// Icon mapping
const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard,
  ChefHat,
  CreditCard,
  UtensilsCrossed,
  Users,
  QrCode,
  BarChart3,
  Settings,
};

export default function Sidebar() {
  const location = useLocation();
  const restaurant = useAuthStore((state) => state.restaurant);
  const { allowedMenuItems, roleLabel } = usePermissions();

  return (
    <aside className="w-64 bg-white border-r border-gray-100 flex flex-col">
      {/* Logo */}
      <div className="h-16 px-6 flex items-center border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
            <QrCode className="w-5 h-5 text-white" />
          </div>
          <span className="font-heading font-bold text-xl">QRMenu</span>
        </div>
      </div>

      {/* Restaurant name & Role */}
      {restaurant && (
        <div className="px-6 py-4 border-b border-gray-100">
          <p className="text-sm text-gray-500">Restaurante</p>
          <p className="font-medium text-gray-900 truncate">{restaurant.name}</p>
          <span className="inline-block mt-2 px-2 py-0.5 bg-primary-100 text-primary-700 text-xs font-medium rounded-full">
            {roleLabel}
          </span>
        </div>
      )}

      {/* Navigation - Only show allowed items */}
      <nav className="flex-1 p-4 space-y-1">
        {allowedMenuItems.map((item) => {
          const Icon = iconMap[item.icon] || LayoutDashboard;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`sidebar-link ${isActive ? 'active' : ''}`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-100">
        <p className="text-xs text-gray-400 text-center">
          QRMenu v1.0.0
        </p>
      </div>
    </aside>
  );
}
