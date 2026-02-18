import { create } from "zustand";

// Helper function to safely parse user from localStorage
const getUserFromStorage = () => {
  try {
    const userStr = localStorage.getItem("currentUser");
    if (!userStr) {
      return null;
    }
    return JSON.parse(userStr);
  } catch (error) {
    console.error("Error parsing currentUser from localStorage:", error);
    return null;
  }
};

// ✅ Authentication Store (Zustand)
export const useAuthStore = create((set, get) => ({
  currentUser: getUserFromStorage(),
  token: localStorage.getItem("token") || null,
  isAuthenticated:
    !!localStorage.getItem("token") && !!localStorage.getItem("currentUser"),

  login: (user, token) => {
    localStorage.setItem("currentUser", JSON.stringify(user));
    localStorage.setItem("token", token);
    set({ currentUser: user, token, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem("currentUser");
    localStorage.removeItem("token");
    set({ currentUser: null, token: null, isAuthenticated: false });
  },

  // Update user without affecting token
  updateUser: (user) => {
    localStorage.setItem("currentUser", JSON.stringify(user));
    set({ currentUser: user });
  },

  // Check if authenticated and sync state with localStorage
  checkAuth: () => {
    const token = localStorage.getItem("token");
    const currentUserStr = localStorage.getItem("currentUser");

    // If both exist, sync state
    if (token && currentUserStr) {
      const user = getUserFromStorage();

      if (!user) {
        // Invalid user data, logout
        get().logout();
        return false;
      }

      const state = get();

      // Only update if state is out of sync
      if (!state.isAuthenticated || !state.currentUser || !state.token) {
        set({
          currentUser: user,
          token,
          isAuthenticated: true,
        });
      }
      return true;
    }

    // If missing, update state only (don't clear localStorage)
    if (get().isAuthenticated) {
      set({ currentUser: null, token: null, isAuthenticated: false });
    }
    return false;
  },
}));
