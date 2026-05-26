"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

export default function NavigationProgress() {
  const pathname = usePathname();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevPathname = useRef(pathname);

  useEffect(() => {
    if (prevPathname.current === pathname) return;
    prevPathname.current = pathname;

    // Navigation just completed — finish the bar
    setProgress(100);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);

    timerRef.current = setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 300);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [pathname]);

  // Start bar on link click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest("a[href]");
      if (!anchor) return;
      const href = anchor.getAttribute("href") ?? "";
      if (href.startsWith("/") && !href.startsWith("//")) {
        setVisible(true);
        setProgress(15);
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = setInterval(() => {
          setProgress(p => {
            if (p >= 85) {
              clearInterval(intervalRef.current!);
              return 85;
            }
            return p + Math.random() * 10;
          });
        }, 200);
      }
    };

    document.addEventListener("click", handleClick, true);
    return () => {
      document.removeEventListener("click", handleClick, true);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  if (!visible && progress === 0) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9999] h-[2px] pointer-events-none"
      style={{ opacity: visible || progress > 0 ? 1 : 0 }}
    >
      <div
        className="h-full bg-terracotta -[0_0_8px_rgba(224,75,53,0.7)]"
        style={{
          width: `${progress}%`,
          transition: progress === 100
            ? "width 0.15s ease-out"
            : "width 0.2s ease-in",
        }}
      />
    </div>
  );
}
