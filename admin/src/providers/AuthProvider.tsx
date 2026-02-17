import { useEffect, useState, createContext, useContext, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import api from '../services/api';

interface AuthContextType {
  isLoading: boolean;
  isValidating: boolean;
  validateSession: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [isValidating, setIsValidating] = useState(false);
  
  const { isAuthenticated, accessToken, setAuth, logout } = useAuthStore();

  const validateSession = async (): Promise<boolean> => {
    if (!accessToken) {
      return false;
    }

    setIsValidating(true);
    try {
      const response = await api.get('/auth/me');
      
      // Update store with fresh data from server
      const { user, restaurant } = response.data;
      const currentState = useAuthStore.getState();
      
      if (currentState.refreshToken) {
        setAuth({
          user,
          restaurant,
          accessToken: currentState.accessToken!,
          refreshToken: currentState.refreshToken,
        });
      }
      
      return true;
    } catch (error) {
      // Token invalid or expired (and refresh failed)
      logout();
      return false;
    } finally {
      setIsValidating(false);
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      // Skip validation for login page
      if (location.pathname === '/login') {
        setIsLoading(false);
        return;
      }

      // If no token, redirect to login
      if (!accessToken) {
        setIsLoading(false);
        navigate('/login', { replace: true });
        return;
      }

      // Validate session with server
      const isValid = await validateSession();
      
      if (!isValid) {
        navigate('/login', { replace: true });
      }
      
      setIsLoading(false);
    };

    checkAuth();
  }, [location.pathname]);

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-primary-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Verificando sessão...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ isLoading, isValidating, validateSession }}>
      {children}
    </AuthContext.Provider>
  );
}

