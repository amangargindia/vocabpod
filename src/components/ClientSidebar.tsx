"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";

export default function ClientSidebar() {
  const pathname = usePathname();
  const hiddenPaths = ["/login", "/signup", "/upgrade", "/upgrade/success"];

  if (hiddenPaths.includes(pathname)) {
    return null;
  }

  return <Sidebar />;
}
