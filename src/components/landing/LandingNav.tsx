"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";
import { useAuth } from "@/contexts/AuthContext";
import { Menu, X } from "lucide-react";
import { useLandingLanguage } from "@/contexts/LandingLanguageContext";

export default function LandingNav() {
  const { user } = useAuth();
  const { language } = useLandingLanguage();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 80);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { href: "#demo", label_en: "How It Works", label_hi: "Kaise Kaam Karta Hai" },
    { href: "#science", label_en: "Science", label_hi: "Science" },
    { href: "#pricing", label_en: "Pricing", label_hi: "Pricing" },
    { href: "#faq", label_en: "FAQ", label_hi: "Sawal Jawab" },
  ];

  return (
    <>
      <nav
        className={`fixed top-0 w-full z-50 backdrop-blur-md bg-absolute-black/80 transition-all duration-300 ${
          isScrolled ? "border-b border-terracotta/10 shadow-lg" : "border-b border-white/5"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          {/* Left: Logo */}
          <Link href="/" className="flex items-center">
            <Logo className="w-32 h-10" />
          </Link>

          {/* Center: Desktop Links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-xs font-bold uppercase tracking-widest text-muted-ash hover:text-light-gray transition-colors"
              >
                {language === 'hi' ? link.label_hi : link.label_en}
              </a>
            ))}
          </div>

          {/* Right: Auth / CTA */}
          <div className="hidden md:flex items-center gap-6">
            {user ? (
              <Link
                href="/dashboard"
                className="text-sm font-bold text-light-gray hover:text-terracotta transition-colors"
              >
                {language === 'hi' ? "Dashboard Par Jayein →" : "Go to Dashboard →"}
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-xs font-bold uppercase tracking-widest text-muted-ash hover:text-light-gray transition-colors"
                >
                  Login
                </Link>
                <a
                  href="#pricing"
                  className="bg-terracotta text-light-gray px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(224,75,53,0.3)] transition-all"
                >
                  {language === 'hi' ? "Subscribe Karein" : "Subscribe"}
                </a>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden text-light-gray"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu size={24} />
          </button>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-absolute-black/90 backdrop-blur-xl flex flex-col p-6 animate-[fadeIn_0.2s_ease_both]">
          <div className="flex justify-between items-center mb-12">
            <Logo className="w-32 h-10" />
            <button
              className="text-light-gray hover:text-terracotta transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              <X size={32} />
            </button>
          </div>

          <div className="flex flex-col gap-8 flex-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-2xl font-black text-light-gray tracking-tight uppercase"
              >
                {language === 'hi' ? link.label_hi : link.label_en}
              </a>
            ))}
          </div>

          <div className="mt-auto flex flex-col gap-6 pb-8">
            {user ? (
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full bg-terracotta text-center text-light-gray px-6 py-4 rounded-full text-sm font-bold uppercase tracking-widest"
              >
                {language === 'hi' ? "Dashboard Par Jayein" : "Go to Dashboard"}
              </Link>
            ) : (
              <>
                <a
                  href="#pricing"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full bg-terracotta text-center text-light-gray px-6 py-4 rounded-full text-sm font-bold uppercase tracking-widest"
                >
                  {language === 'hi' ? "Subscribe Karein" : "Subscribe"}
                </a>
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center text-muted-ash py-4 text-sm font-bold uppercase tracking-widest border border-white/10 rounded-full"
                >
                  Login
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
