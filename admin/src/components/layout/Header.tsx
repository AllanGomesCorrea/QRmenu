import { LogOut, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import NotificationsDropdown from './NotificationsDropdown';
import RestaurantSelector from './RestaurantSelector';

export default function Header() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const effectiveRestaurant = useAuthStore((s) => s.getEffectiveRestaurant());

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="h-16 bg-white border-b border-gray-100 px-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        {/* Super Admin restaurant selector */}
        <RestaurantSelector />
        {/* Show current restaurant name for non-Super Admin */}
        {!user?.isSuperAdmin && effectiveRestaurant && (
          <span className="text-sm text-gray-500 font-medium">
            {effectiveRestaurant.name}
          </span>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* Notifications Dropdown */}
        <NotificationsDropdown />

        {/* User menu */}
        <div className="flex items-center gap-3 pl-4 border-l border-gray-100">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">{user?.name}</p>
            <p className="text-xs text-gray-500">{user?.role}</p>
          </div>
          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-primary-600" />
          </div>
          <button
            onClick={handleLogout}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 hover:text-error-500"
            title="Sair"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
