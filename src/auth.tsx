import * as SecureStore from "expo-secure-store";
import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { api, setToken, setUnauthorizedHandler } from "./api";

type User = { id: string; name: string; email: string; notifyEmail?: boolean };
type AuthValue = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
};

const KEY = "unirent_token";
const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(async () => {
    setToken(null);
    setUser(null);
    await SecureStore.deleteItemAsync(KEY).catch(() => {});
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      logout();
    });

    (async () => {
      try {
        const saved = await SecureStore.getItemAsync(KEY);
        if (saved) {
          setToken(saved);
          const me = await api<{ user: User }>("/me");
          setUser(me.user);
        }
      } catch {
        // Offline or a bad token: show the login screen
      } finally {
        setLoading(false);
      }
    })();

    return () => setUnauthorizedHandler(null);
  }, [logout]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api<{ token: string; user: User }>("/login", {
      body: { email, password },
    });
    setToken(res.token);
    await SecureStore.setItemAsync(KEY, res.token);
    setUser(res.user);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, logout, setUser }),
    [user, loading, login, logout],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
