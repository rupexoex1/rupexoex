import { Navigate, useLocation } from "react-router-dom";
import { useAppContext } from "../context/AppContext";

export default function RequireAuth({ children }) {
  const { token, loading } = useAppContext();
  const location = useLocation();

  if (loading) return null; // ya spinner / skeleton

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return children;
}
