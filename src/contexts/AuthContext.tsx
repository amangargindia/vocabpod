"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { getUser, getUserSubscription } from "@/lib/supabase";

interface AuthContextType {
  user: { id?: string; email?: string } | null;
  isPremium: boolean;
  isLoadingAuth: boolean;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isPremium: false,
  isLoadingAuth: true,
  refreshAuth: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<{ id?: string; email?: string } | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  const loadAuth = async () => {
    setIsLoadingAuth(true);
    try {
      const [currentUser, subscription] = await Promise.all([
        getUser(),
        getUserSubscription()
      ]);
      setUser(currentUser);
      setIsPremium(subscription.is_premium);
    } catch (e) {
      console.error("Auth context load error:", e);
    } finally {
      setIsLoadingAuth(false);
    }
  };

  useEffect(() => {
    loadAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, isPremium, isLoadingAuth, refreshAuth: loadAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
