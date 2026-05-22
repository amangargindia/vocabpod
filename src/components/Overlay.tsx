"use client";

import Link from "next/link";

interface OverlayProps {
  /** Set to true to show the paywall overlay */
  isLocked: boolean;
  /** The content rendered underneath the overlay */
  children: React.ReactNode;
  /** Word slug for analytics / upgrade redirects */
  wordSlug?: string;
  /** Elegant short text describing what is locked */
  lockedText?: string;
}

/**
 * Overlay — Paywall wrapper component.
 */
export default function Overlay({ isLocked, children, wordSlug, lockedText = "Premium Feature" }: OverlayProps) {
  if (!isLocked) return <>{children}</>;

  return (
    <div className="relative select-none h-full w-full min-h-[160px] overflow-hidden rounded-2xl">
      {/* Blurred content underneath — visible but inaccessible */}
      <div className="pointer-events-none blur-md opacity-20 saturate-0 h-full w-full">
        {children}
      </div>

      {/* The Overlay itself — edit this block to customize appearance */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-4 md:p-8 text-center bg-absolute-black/40 rounded-inherit">
        
        {/* Content */}
        <div className="relative z-10 flex flex-col items-center space-y-3 md:space-y-4">
          {/* Lock icon */}
          <div className="w-10 h-10 md:w-12 md:h-12 shrink-0 rounded-full bg-dark-blush border border-terracotta/30 flex items-center justify-center shadow-[0_0_30px_rgba(224,75,53,0.15)]">
            <svg viewBox="0 0 24 24" fill="none" stroke="#E04B35" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 md:w-5 md:h-5">
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
          </div>

          <div className="space-y-1">
            <h3 className="text-base md:text-lg font-black text-light-gray tracking-tight uppercase">
              {lockedText}
            </h3>
            <p className="text-[10px] md:text-xs text-muted-ash max-w-xs leading-relaxed">
              Available in Premium
            </p>
          </div>

          <Link
            href="/features"
            className="bg-white/10 text-light-gray font-bold px-4 py-1.5 md:px-5 md:py-2 rounded-full text-[9px] md:text-[10px] uppercase tracking-widest hover:bg-white/20 transition-all shrink-0 mt-2"
          >
            Learn More
          </Link>
        </div>
      </div>
    </div>
  );
}
