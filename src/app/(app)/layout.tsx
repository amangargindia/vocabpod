import { ReactNode } from "react";
import AuthGuard from "@/components/AuthGuard";
import ClientSidebar from "@/components/ClientSidebar";
import NavigationProgress from "@/components/NavigationProgress";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <NavigationProgress />
      <ClientSidebar />
      <div className="flex-1 min-w-0 w-full flex flex-col">
        {children}
      </div>
    </AuthGuard>
  );
}
