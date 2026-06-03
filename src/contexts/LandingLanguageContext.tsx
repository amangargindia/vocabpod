"use client";

import { createContext, useContext, useState, ReactNode } from "react";

type Language = "en" | "hi";

interface LandingLanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
}

const LandingLanguageContext = createContext<LandingLanguageContextType | undefined>(undefined);

export function LandingLanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("hi");
  
  return (
    <LandingLanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LandingLanguageContext.Provider>
  );
}

export function useLandingLanguage() {
  const context = useContext(LandingLanguageContext);
  if (!context) {
    throw new Error("useLandingLanguage must be used within a LandingLanguageProvider");
  }
  return context;
}
