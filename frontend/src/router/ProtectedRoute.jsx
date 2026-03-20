import { Navigate, Outlet } from 'react-router-dom';
import { getDashboardPath } from '../config/roles';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ allowedRoles }) {
  const { isAuthenticated, isLoading, role } = useAuth();

  if (isLoading) {
    return (
      <div className="screen-state">
        <div className="screen-state__card">
          <p className="eyebrow">Secure Workspace</p>
          <h2>Loading your role-aware dashboard...</h2>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to={getDashboardPath(role)} replace />;
  }

  return <Outlet />;
}
