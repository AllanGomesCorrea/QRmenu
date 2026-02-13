import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import MenuPage from './pages/menu/MenuPage';
import TablesPage from './pages/tables/TablesPage';
import KitchenPage from './pages/kitchen/KitchenPage';
import CashierPage from './pages/cashier/CashierPage';
import UsersPage from './pages/users/UsersPage';
import ReportsPage from './pages/reports/ReportsPage';
import SettingsPage from './pages/settings/SettingsPage';
import Layout from './components/layout/Layout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { useAuthStore } from './stores/authStore';
import { usePermissions } from './hooks/usePermissions';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

function DefaultRedirect() {
  const { defaultRoute } = usePermissions();
  return <Navigate to={defaultRoute} replace />;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      
      <Route
        path="/*"
        element={
          <PrivateRoute>
            <Layout>
              <Routes>
                {/* Redirect to role-appropriate default page */}
                <Route path="/" element={<DefaultRedirect />} />
                
                {/* Dashboard - Admin, Manager */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute permission="dashboard:view">
                      <DashboardPage />
                    </ProtectedRoute>
                  }
                />
                
                {/* Kitchen - Kitchen, Admin, Manager */}
                <Route
                  path="/kitchen"
                  element={
                    <ProtectedRoute permission="kitchen:view">
                      <KitchenPage />
                    </ProtectedRoute>
                  }
                />
                
                {/* Cashier - Cashier, Admin, Manager */}
                <Route
                  path="/cashier"
                  element={
                    <ProtectedRoute permission="cashier:view">
                      <CashierPage />
                    </ProtectedRoute>
                  }
                />
                
                {/* Tables - Waiter, Cashier, Manager, Admin */}
                <Route
                  path="/tables"
                  element={
                    <ProtectedRoute permission="tables:view">
                      <TablesPage />
                    </ProtectedRoute>
                  }
                />
                
                {/* Menu - Admin, Manager */}
                <Route
                  path="/menu"
                  element={
                    <ProtectedRoute permission="menu:view">
                      <MenuPage />
                    </ProtectedRoute>
                  }
                />
                
                {/* Users - Admin, Manager */}
                <Route
                  path="/users"
                  element={
                    <ProtectedRoute permission="users:view">
                      <UsersPage />
                    </ProtectedRoute>
                  }
                />
                
                {/* Reports - Admin, Manager */}
                <Route
                  path="/reports"
                  element={
                    <ProtectedRoute permission="reports:view">
                      <ReportsPage />
                    </ProtectedRoute>
                  }
                />
                
                {/* Settings - Admin, Manager */}
                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute permission="settings:view">
                      <SettingsPage />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </Layout>
          </PrivateRoute>
        }
      />
    </Routes>
  );
}

export default App;
