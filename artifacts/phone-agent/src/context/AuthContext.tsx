import { createContext, useCallback, useEffect, useState, type ReactNode } from 'react';
import { fetchCurrentUser, logout as apiLogout, type AuthUser } from '@/lib/api/auth';

export type AuthContextValue = {
  user: AuthUser | null;
  /** True once the mount fetch has completed and a valid session exists. */
  isSigned: boolean;
  /** True while the initial auth check is in flight. */
  loading: boolean;
  /** Re-fetch the current user from the server (call after OAuth redirect). */
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  // isSigned is only flipped to true after the fetch resolves with a real user,
  // so it's never optimistically true on first render.
  const [isSigned, setIsSigned] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const u = await fetchCurrentUser();
      console.log('[AuthContext] fetchCurrentUser result:', u);
      setUser(u);
      setIsSigned(u !== null);
    } catch (err) {
      console.log('[AuthContext] fetchCurrentUser error:', err);
      setUser(null);
      setIsSigned(false);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch auth state once on mount
  useEffect(() => {
    void refresh();
  }, [refresh]);

  const logout = useCallback(async () => {
    await apiLogout();
    setUser(null);
    setIsSigned(false);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isSigned, loading, refresh, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
