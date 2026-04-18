"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AuthUser } from "@/lib/auth-api";
import {
  fetchCurrentUser,
  getStoredToken,
  loginAccount,
  registerAccount,
  setStoredToken,
} from "@/lib/auth-api";
import type { RegisterFormValues } from "@/lib/validation/auth-forms";

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  /** Caterer self-serve signup — completes only after email verification. */
  register: (values: RegisterFormValues) => Promise<{ email: string; subdomain: string | null }>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const logout = useCallback(() => {
    setStoredToken(null);
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const t = getStoredToken();
    if (!t) {
      setReady(true);
      return;
    }
    setToken(t);
    fetchCurrentUser(t)
      .then((u) => {
        if (!cancelled) setUser(u);
      })
      .catch(() => {
        if (!cancelled) logout();
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [logout]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await loginAccount({ email, password });
    setStoredToken(res.accessToken);
    setToken(res.accessToken);
    setUser(res.user);
    return res.user;
  }, []);

  const register = useCallback(async (values: RegisterFormValues) => {
    const res = await registerAccount({
      fullName: values.fullName,
      email: values.email,
      businessName: values.businessName,
      phoneCountryCode: values.phoneCountryCode,
      phoneNumber: values.phoneNumber,
      password: values.password,
    });
    return { email: res.email, subdomain: res.subdomain };
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      ready,
      login,
      register,
      logout,
    }),
    [user, token, ready, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
