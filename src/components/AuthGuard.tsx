"use client";

import { useEffect, ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { usePathname, useRouter } from "next/navigation";

export default function AuthGuard({ children }: { children: ReactNode }) {
  const { user, isLoadingAuth } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const publicPaths = ["/sale", "/login", "/signup", "/upgrade", "/api"];

  useEffect(() => {
    if (isLoadingAuth) return;
    
    const isPublic = publicPaths.some(p => pathname?.startsWith(p));
    if (!user && !isPublic) {
      router.push("/");
    }
  }, [isLoadingAuth, user, pathname, router]);

  // Optionally show a loading screen while checking auth
  if (isLoadingAuth) {
    return <div className="min-h-screen bg-absolute-black flex items-center justify-center"></div>;
  }

  return <>{children}</>;
}
