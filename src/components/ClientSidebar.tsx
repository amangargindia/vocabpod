"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";

export default function ClientSidebar() {
  const pathname = usePathname();
  const hiddenPaths = ["/login", "/signup", "/upgrade", "/upgrade/success"];

  const isLesson = pathname.startsWith("/lesson/");
  
  if (hiddenPaths.includes(pathname) || isLesson) {
    return null;
  }

  return <Sidebar />;
}
