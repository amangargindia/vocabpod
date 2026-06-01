import { ReactNode } from "react";
import { GoogleAnalytics } from "@next/third-parties/google";
import { MessageCircle } from "lucide-react";
import Link from "next/link";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {/* TODO: Replace G-XXXXXXXXXX with real GA4 Measurement ID */}
      <GoogleAnalytics gaId="G-XXXXXXXXXX" />
      <div className="flex-1 min-w-0 w-full flex flex-col pb-20 md:pb-0">
        {children}
      </div>

      {/* Persistent WhatsApp Button */}
      <a
        href="https://wa.me/916267454456"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-24 right-6 md:bottom-8 md:right-8 z-50 bg-[#25D366] text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-transform flex items-center justify-center"
        aria-label="Chat on WhatsApp"
      >
        <MessageCircle className="w-6 h-6" />
      </a>

      <div className="fixed bottom-0 left-0 w-full bg-absolute-black/90 backdrop-blur-md border-t border-white/10 p-4 z-50 flex gap-3 md:hidden">
        <a href="#demo" className="flex-1 border border-white/20 text-light-gray font-bold py-3 rounded-xl text-center text-sm uppercase tracking-widest hover:bg-white/5 transition-colors">
          Try Free Word
        </a>
        <Link href="/checkout" className="flex-1 bg-terracotta text-light-gray font-bold py-3 rounded-xl text-center text-sm uppercase tracking-widest shadow-[0_0_20px_rgba(224,75,53,0.3)]">
          Buy Now
        </Link>
      </div>
    </>
  );
}
