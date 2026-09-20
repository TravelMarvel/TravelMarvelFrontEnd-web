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

import { logout as logoutApi, withdraw as withdrawApi } from "@/api/auth";
import { clearAllTokens, getAppAccessToken } from "@/lib/auth-storage";
import { signOutFromGoogle } from "@/lib/google-auth";

type AuthContextValue = {
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  signIn: () => void;
  signOut: () => Promise<void>;
  withdraw: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    getAppAccessToken()
      .then((token) => {
        if (token) {
          setIsAuthenticated(true);
        }
      })
      .finally(() => {
        setIsAuthLoading(false);
      });
  }, []);

  const signIn = useCallback(() => {
    setIsAuthenticated(true);
  }, []);

  const clearLocalSession = useCallback(async () => {
    await signOutFromGoogle();
    await clearAllTokens();
    setIsAuthenticated(false);
  }, []);

  const signOut = useCallback(async () => {
    try {
      const accessToken = await getAppAccessToken();
      if (accessToken) {
        await logoutApi();
      }
    } catch (error) {
      console.warn("[auth] logout api failed:", error);
    } finally {
      await clearLocalSession();
    }
  }, [clearLocalSession]);

  const withdraw = useCallback(async () => {
    await withdrawApi();
    await clearLocalSession();
  }, [clearLocalSession]);

  const value = useMemo(
    () => ({ isAuthenticated, isAuthLoading, signIn, signOut, withdraw }),
    [isAuthenticated, isAuthLoading, signIn, signOut, withdraw],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
