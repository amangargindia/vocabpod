"use client";

import Link from "next/link";
import BugReportModal from "./BugReportModal";

export default function Footer() {
  return (
    <footer className="mt-10 bg-terracotta rounded-2xl mx-0 overflow-hidden">
      <div className="px-6 py-5 flex flex-col items-center space-y-4">
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
          <Link href="/about" className="text-[11px] font-black uppercase tracking-widest text-black/80 hover:text-black transition-colors whitespace-nowrap">
            About
          </Link>
          <span className="text-black/30 text-xs">·</span>
          <Link href="/contact" className="text-[11px] font-black uppercase tracking-widest text-black/80 hover:text-black transition-colors whitespace-nowrap">
            Contact Us
          </Link>
          <span className="text-black/30 text-xs">·</span>
          <Link href="/privacy" className="text-[11px] font-black uppercase tracking-widest text-black/80 hover:text-black transition-colors whitespace-nowrap">
            Privacy Policy
          </Link>
          <span className="text-black/30 text-xs">·</span>
          <div className="[&_button]:text-[11px] [&_button]:font-black [&_button]:uppercase [&_button]:tracking-widest [&_button]:text-black/80 [&_button]:hover:text-black [&_button]:transition-colors">
            <BugReportModal />
          </div>
        </div>
        <p className="text-[10px] font-bold text-black/50 uppercase tracking-widest text-center">
          © {new Date().getFullYear()} Vocabpod · All rights reserved.
        </p>
      </div>
    </footer>
  );
}
