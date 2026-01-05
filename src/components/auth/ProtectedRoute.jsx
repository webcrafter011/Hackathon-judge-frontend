import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

function ProtectedRoute({ children, allowedRoles = [] }) {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  // Not authenticated - redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role authorization if roles are specified
  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    // Redirect to appropriate dashboard based on role
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default ProtectedRoute;
