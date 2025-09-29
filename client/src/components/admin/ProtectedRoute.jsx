import { Navigate, Outlet } from "react-router-dom";
import { useAppContext } from "../../context/AppContext";

const ProtectedRoute = ({ allowedRoles }) => {
  const { token, role, loading } = useAppContext();

  if (loading) return null; // Or a spinner

  if (!token) return <Navigate to="/login" />;
  if (!allowedRoles.includes(role)) return <Navigate to="/" />;

  return <Outlet />;
};

export default ProtectedRoute;
