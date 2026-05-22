"use client";

import { useState } from "react";

export default function MobileWrapper({ children }: { children: React.ReactNode }) {
  const [isMobileMode, setIsMobileMode] = useState(false);

  return (
    <>
      <div className={isMobileMode ? "max-w-md mx-auto h-screen overflow-y-auto border-x border-white/10 shadow-2xl relative bg-absolute-black" : "min-h-full flex flex-col"}>
        {children}
      </div>
      
      <button
        onClick={() => setIsMobileMode(!isMobileMode)}
        className="fixed bottom-6 right-6 z-[9999] bg-terracotta text-light-gray w-14 h-14 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform border-4 border-absolute-black group"
        title="Toggle Mobile View"
      >
        {isMobileMode ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>
        )}
      </button>
    </>
  );
}
