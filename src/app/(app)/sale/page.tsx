"use client";

import Link from "next/link";
import Logo from "@/components/Logo";

export default function SalePage() {
  return (
    <div className="min-h-screen bg-absolute-black flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full space-y-8">
        <Logo className="w-48 h-16 mx-auto" />
        <h1 className="text-4xl font-black text-light-gray">Master Vocabulary</h1>
        <p className="text-muted-ash">Join Vocabpod to unlock your full potential.</p>
        
        <div className="space-y-4 pt-8">
          <Link href="/login" className="block w-full bg-terracotta text-light-gray font-bold py-4 rounded-xl hover:shadow-[0_0_20px_rgba(224,75,53,0.4)] transition-all uppercase tracking-wider text-sm">
            Log In
          </Link>
          <Link href="/upgrade" className="block w-full bg-white/5 border border-white/10 text-light-gray font-bold py-4 rounded-xl hover:bg-white/10 transition-all uppercase tracking-wider text-sm">
            Buy Subscription
          </Link>
        </div>
      </div>
    </div>
  );
}
