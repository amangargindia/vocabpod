"use client";

import Link from "next/link";
import BugReportModal from "./BugReportModal";

export default function Footer() {
  return (
    <footer className="mt-12 py-8 border-t border-white/5 flex flex-col items-center justify-center space-y-4">
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-xs md:text-sm font-bold uppercase tracking-widest text-muted-ash px-4">
        <Link href="/about" className="hover:text-light-gray transition-colors whitespace-nowrap">
          About
        </Link>
        <Link href="/contact" className="hover:text-terracotta transition-colors whitespace-nowrap">
          Contact Us
        </Link>
        <Link href="/privacy" className="hover:text-terracotta transition-colors whitespace-nowrap">
          Privacy Policy
        </Link>
        <BugReportModal />
      </div>
      <p className="text-[10px] text-muted-ash/50 uppercase tracking-widest text-center px-4">
        © {new Date().getFullYear()} Vocabpod. All rights reserved.
      </p>
    </footer>
  );
}
