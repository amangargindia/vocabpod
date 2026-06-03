import type { Metadata } from "next";
import { LandingLanguageProvider } from "@/contexts/LandingLanguageContext";
import LandingNav from "@/components/landing/LandingNav";
import type { SalesConfig } from "@/components/landing/useSalesConfig";

import HeroSection from "@/components/landing/HeroSection";
import ProofBar from "@/components/landing/ProofBar";
import DemoSection from "@/components/landing/DemoSection";
import ScienceSection from "@/components/landing/ScienceSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import MnemonicsSection from "@/components/landing/MnemonicsSection";
import FlashcardShowcase from "@/components/landing/FlashcardShowcase";
import ScreenshotSection from "@/components/landing/ScreenshotSection";
import CredibilitySection from "@/components/landing/CredibilitySection";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import ComparisonSection from "@/components/landing/ComparisonSection";
import PricingSection from "@/components/landing/PricingSection";
import FAQSection from "@/components/landing/FAQSection";
import FinalCTASection from "@/components/landing/FinalCTASection";
import LandingFooter from "@/components/landing/LandingFooter";

export const metadata: Metadata = {};

// Revalidate page every 60 s so server always serves fresh sales config
export const revalidate = 60;

async function getSalesConfig(): Promise<SalesConfig | null> {
  try {
    const base =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000";
    const res = await fetch(`${base}/api/landing/sales-config`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.config ?? null;
  } catch {
    return null;
  }
}

export default async function LandingPage() {
  const salesConfig = await getSalesConfig();

  return (
    <LandingLanguageProvider>
      <main className="min-h-screen bg-absolute-black flex flex-col font-sans selection:bg-terracotta/20 selection:text-terracotta overflow-x-hidden">
        <LandingNav />

        <HeroSection />
        <ProofBar />
        <DemoSection initialData={salesConfig} />
        <MnemonicsSection initialData={salesConfig} />
        <FlashcardShowcase initialData={salesConfig} />
        <ScienceSection />
        <FeaturesSection />
        <ScreenshotSection initialData={salesConfig} />
        <CredibilitySection initialData={salesConfig} />
        <TestimonialsSection initialData={salesConfig} />
        <ComparisonSection />
        <PricingSection />
        <FAQSection initialData={salesConfig} />
        <FinalCTASection />

        <LandingFooter />
      </main>
    </LandingLanguageProvider>
  );
}
