import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../features/auth/hooks/useAuth';

export function ProtectedRoute() {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-gray-950">
        <p className="text-sm text-gray-500 dark:text-gray-400">Chargement...</p>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/connexion" replace />;
  }

  return <Outlet />;
}
