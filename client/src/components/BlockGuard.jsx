import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";

export default function BlockGuard() {
  const { isBlocked, token } = useAppContext();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (token && isBlocked && location.pathname !== "/blocked") {
      navigate("/blocked", { replace: true });
    }
  }, [token, isBlocked, location.pathname, navigate]);

  return null;
}
