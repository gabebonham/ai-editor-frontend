import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { ReactNode } from 'react';
import { getToken, setToken as persistToken, clearToken, setOnUnauthorized } from '../lib/api';
import type { User } from '../lib/api';
import { api } from '../lib/api';

interface AuthContextValue {
  isAuth: boolean;
  user: User | null;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  isAuth: false,
  user: null,
  login: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuth, setIsAuth] = useState(() => !!getToken());
  const [user, setUser] = useState<User | null>(null);

  const logout = useCallback(() => {
    clearToken();
    setIsAuth(false);
    setUser(null);
  }, []);

  const login = useCallback((token: string) => {
    persistToken(token);
    setIsAuth(true);
  }, []);

  // Register the 401 handler — clears auth state, no imperative navigate
  useEffect(() => {
    setOnUnauthorized(logout);
  }, [logout]);

  // Fetch user info once when authenticated (best-effort, never triggers logout)
  useEffect(() => {
    if (!isAuth) return;
    api.auth.me()
      .then(setUser)
      .catch(() => {
        // Silently ignore — user display is optional
      });
  }, [isAuth]);

  return (
    <AuthContext.Provider value={{ isAuth, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
