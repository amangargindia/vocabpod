"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { getUser, getUserSubscription, supabase } from "@/lib/supabase";

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
    // Unregister any stale service workers and clear Cache Storage to fix Chrome navigation
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.unregister();
          console.log("Stale Service Worker unregistered successfully:", registration);
        }
      }).catch(err => {
        console.warn("Failed to unregister service worker:", err);
      });

      // Also clear all Cache Storage entries to prevent stale cached responses
      if ("caches" in window) {
        caches.keys().then((cacheNames) => {
          for (const cacheName of cacheNames) {
            caches.delete(cacheName);
            console.log("Cleared cache:", cacheName);
          }
        }).catch(err => {
          console.warn("Failed to clear caches:", err);
        });
      }
    }

    loadAuth();
    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
          loadAuth();
        } else if (event === "SIGNED_OUT") {
          setUser(null);
          setIsPremium(false);
        }
      });
      return () => {
        subscription.unsubscribe();
      };
    }
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
