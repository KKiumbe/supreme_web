export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  [key: string]: any;
}

export interface AuthState {
  currentUser: AuthUser | null;
  setCurrentUser: (user: AuthUser | null) => void;
  logout: () => void;
  [key: string]: any;
}

export declare function useAuthStore(selector: (state: AuthState) => any): any;
