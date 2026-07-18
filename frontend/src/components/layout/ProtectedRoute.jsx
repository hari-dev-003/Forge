import { useSelector } from 'react-redux';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Spinner } from '../ui/index.jsx';

/** Gate routes behind authentication (and optionally specific roles). */
export default function ProtectedRoute({ roles }) {
  const { user, token, bootstrapping } = useSelector((s) => s.auth);
  const location = useLocation();

  if (bootstrapping) return <Spinner label="Loading your workspace…" />;
  if (!token || !user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;

  return <Outlet />;
}
