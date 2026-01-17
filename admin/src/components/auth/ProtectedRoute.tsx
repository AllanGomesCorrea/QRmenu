import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { Permission } from '../../config/permissions';
import { usePermissions } from '../../hooks/usePermissions';

interface ProtectedRouteProps {
  children: ReactNode;
  permission: Permission;
  fallback?: 'redirect' | 'forbidden';
}

export function ProtectedRoute({ 
  children, 
  permission, 
  fallback = 'forbidden' 
}: ProtectedRouteProps) {
  const { hasPermission, defaultRoute } = usePermissions();

  if (!hasPermission(permission)) {
    if (fallback === 'redirect') {
      return <Navigate to={defaultRoute} replace />;
    }

    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-amber-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Acesso Restrito
          </h1>
          <p className="text-gray-600 mb-6">
            Você não tem permissão para acessar esta página. 
            Entre em contato com o administrador se precisar de acesso.
          </p>
          <a
            href={defaultRoute}
            className="btn-primary inline-flex"
          >
            Voltar ao Início
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

