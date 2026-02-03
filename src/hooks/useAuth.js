/**
 * Custom Hook for Authentication Protection
 * Use this in pages that need authentication
 * @module hooks/useAuth
 */

import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { toast } from "react-toastify";

/**
 * Hook to ensure user is authenticated
 * Redirects to login if not authenticated
 * @param {Object} options - Configuration options
 * @param {boolean} options.requireAuth - Whether to require authentication (default: true)
 * @param {string} options.redirectTo - Where to redirect if not authenticated (default: '/login')
 * @returns {Object} Auth state and functions
 */
export const useAuth = (options = {}) => {
  const { requireAuth = true, redirectTo = "/login" } = options;

  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, currentUser, token, checkAuth, logout } =
    useAuthStore();

  useEffect(() => {
    if (requireAuth) {
      const isAuth = checkAuth();

      if (!isAuth || !currentUser || !token) {
        toast.warning("Please login to continue");
        navigate(redirectTo, {
          state: { from: location },
          replace: true,
        });
      }
    }
  }, [
    requireAuth,
    currentUser,
    token,
    isAuthenticated,
    navigate,
    redirectTo,
    location,
    checkAuth,
  ]);

  return {
    isAuthenticated,
    currentUser,
    token,
    logout,
    checkAuth,
  };
};

/**
 * Hook to check if user has specific role
 * @param {string|string[]} requiredRoles - Role(s) required
 * @returns {boolean} Whether user has required role
 */
export const useHasRole = (requiredRoles) => {
  const { currentUser } = useAuthStore();

  if (!currentUser || !currentUser.roles) {
    return false;
  }

  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];

  return roles.some(
    (role) =>
      currentUser.roles.includes(role) ||
      currentUser.roles.includes("super_admin"),
  );
};

export default useAuth;
