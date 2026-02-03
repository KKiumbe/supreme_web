import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "./store/authStore";

/**
 * Protected Route Component
 * Ensures user is authenticated before allowing access to routes
 * Redirects to login if not authenticated
 */
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, currentUser } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated || !currentUser) {
    // Redirect to login while saving the attempted location
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
