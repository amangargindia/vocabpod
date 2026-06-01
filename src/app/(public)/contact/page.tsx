"use client";

import Link from "next/link";
import Logo from "@/components/Logo";

export default function ContactPage() {
  return (
    <div className="flex min-h-screen bg-absolute-black text-light-gray font-sans selection:bg-terracotta/20 selection:text-terracotta">
<div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 backdrop-blur-md bg-absolute-black/80 border-b border-white/5 px-6 py-4 flex items-center justify-between">
          <div className="flex-1">
            <h1 className="text-sm font-bold uppercase tracking-widest text-muted-ash">Support</h1>
          </div>
          <div className="flex-1 flex justify-center">
            <Logo className="w-40 h-14" />
          </div>
          <div className="flex-1 flex justify-end">
            <Link href="/" className="text-xs font-bold uppercase tracking-widest text-muted-ash hover:text-light-gray transition-colors">
              Close ✕
            </Link>
          </div>
        </header>

        <main className="flex-1 px-6 py-12 md:py-20 max-w-3xl w-full mx-auto space-y-12">
          <div className="text-center space-y-6">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-light-gray uppercase">
              Get in Touch
            </h1>
            <p className="text-lg text-muted-ash leading-relaxed max-w-xl mx-auto">
              Whether you have a question about a feature, need help upgrading, or just want to tell us how your vocabulary journey is going, we are here to listen.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* WhatsApp Card */}
            <a 
              href="https://wa.me/916267454456" 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-card-gray border border-white/5 rounded-3xl p-8 shadow-xl hover:-translate-y-1 hover:border-emerald-500/30 transition-all group flex flex-col items-center text-center space-y-4"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-950/30 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500 group-hover:text-absolute-black transition-colors">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-light-gray tracking-tight">WhatsApp</h2>
                <p className="text-sm text-muted-ash mt-1">Chat directly with the creator.</p>
              </div>
              <span className="mt-4 text-xs font-bold uppercase tracking-widest text-emerald-400 group-hover:text-emerald-300">
                +91 62674 54456 &rarr;
              </span>
            </a>

            {/* Instagram Card */}
            <a 
              href="https://www.instagram.com/vocabpod/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-card-gray border border-white/5 rounded-3xl p-8 shadow-xl hover:-translate-y-1 hover:border-rose-500/30 transition-all group flex flex-col items-center text-center space-y-4"
            >
              <div className="w-16 h-16 rounded-full bg-rose-950/30 border border-rose-500/20 flex items-center justify-center text-rose-400 group-hover:bg-gradient-to-tr group-hover:from-amber-500 group-hover:via-rose-500 group-hover:to-purple-600 group-hover:border-transparent group-hover:text-white transition-all">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-light-gray tracking-tight">Instagram</h2>
                <p className="text-sm text-muted-ash mt-1">Daily tips and updates.</p>
              </div>
              <span className="mt-4 text-xs font-bold uppercase tracking-widest text-rose-400 group-hover:text-purple-400 transition-colors">
                @vocabpod &rarr;
              </span>
            </a>
          </div>
        </main>
      </div>
    </div>
  );
}
