"use client";

import Link from "next/link";
import BugReportModal from "./BugReportModal";

export default function Footer() {
  return (
    <footer className="mt-12 py-8 border-t border-white/5 flex flex-col items-center justify-center space-y-4">
      <div className="flex items-center space-x-6 text-sm font-bold uppercase tracking-widest text-muted-ash">
        <Link href="/about" className="hover:text-light-gray transition-colors">
          About
        </Link>
        <Link href="/contact" className="hover:text-terracotta transition-colors">
          Contact Us
        </Link>
        <Link href="/privacy" className="hover:text-terracotta transition-colors">
          Privacy Policy
        </Link>
        <BugReportModal />
      </div>
      <p className="text-[10px] text-muted-ash/50 uppercase tracking-widest">
        © {new Date().getFullYear()} Vocabpod. All rights reserved.
      </p>
    </footer>
  );
}
