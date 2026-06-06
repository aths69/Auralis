import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api, getToken, setToken, type User } from "./api";

type AuthState = {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (form: FormData) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
  setUser: (u: User | null) => void;
};

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTok] = useState<string | null>(() => getToken());
  const [loading, setLoading] = useState<boolean>(!!getToken());

  const refresh = useCallback(async () => {
    if (!getToken()) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const me = await api<User>("/profile/");
      setUser(me);
    } catch {
      // token invalid or backend unreachable — keep token but clear user
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const login = useCallback(
    async (email: string, password: string) => {
      const form = new FormData();
      form.append("username", email);
      form.append("password", password);

      const res = await api<{ token?: string; access_token?: string; user?: User }>(
        "/login",
        { method: "POST", form, auth: false },
      );
      const t = res.token ?? res.access_token ?? null;
      if (!t) throw new Error("No token returned from server.");
      setToken(t);
      setTok(t);
      if (res.user) setUser(res.user);
      else await refresh();
    },
    [refresh],
  );

  const signup = useCallback(async (form: FormData) => {
    await api("/signup", { method: "POST", form, auth: false });
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setTok(null);
    setUser(null);
  }, []);

  const value = useMemo<AuthState>(
    () => ({ user, token, loading, login, signup, logout, refresh, setUser }),
    [user, token, loading, login, signup, logout, refresh],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used within AuthProvider");
  return v;
}
