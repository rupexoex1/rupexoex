import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAppContext } from "../../context/AppContext";

const ProtectedRoute = ({ allowedRoles = [] }) => {
  const { token, role, loading, isBlocked } = useAppContext();
  const location = useLocation();

  if (loading) return null; // or a spinner

  // hard stop for blocked users
  if (isBlocked) return <Navigate to="/blocked" replace />;

  // not logged in → send to login, remember where they came from
  if (!token) return <Navigate to="/login" replace state={{ from: location }} />;

  // role not allowed
  if (allowedRoles.length && !allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;