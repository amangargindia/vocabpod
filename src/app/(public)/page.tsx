import type { Metadata } from "next";
import { LandingLanguageProvider } from "@/contexts/LandingLanguageContext";
import LandingNav from "@/components/landing/LandingNav";

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

export const metadata: Metadata = {
  // Metadata is already inherited from root layout, but we can override if needed.
};

export default function LandingPage() {
  return (
    <LandingLanguageProvider>
      <main className="min-h-screen bg-absolute-black flex flex-col font-sans selection:bg-terracotta/20 selection:text-terracotta overflow-x-hidden">
        <LandingNav />
      
      <HeroSection />
      <ProofBar />
      <DemoSection />
      <MnemonicsSection />
      <FlashcardShowcase />
      <ScienceSection />
      <FeaturesSection />
      <ScreenshotSection />
      <CredibilitySection />
      <TestimonialsSection />
      <ComparisonSection />
      <PricingSection />
      <FAQSection />
      <FinalCTASection />
      
        <LandingFooter />
      </main>
    </LandingLanguageProvider>
  );
}
