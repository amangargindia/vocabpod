import type { Metadata, Viewport } from "next";
import { Inter, Lora, Outfit } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "VocabPod - Master 150 Advanced English Words in 30 Days",
  description: "VocabPod uses spaced repetition + visual mnemonics to permanently encode vocabulary. Built for GRE, UPSC, CAT, and IELTS aspirants. 5 words a day. 2 minutes. No burnout.",
  openGraph: {
    title: "VocabPod - Master 150 Words in 30 Days",
    description: "Spaced repetition + visual mnemonics. Built for GRE/UPSC/CAT.",
    siteName: "VocabPod",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "VocabPod - The Smartest Way to Learn Vocabulary",
    description: "5 words/day × 30 days = 150 words permanently in memory. For GRE/UPSC.",
  },
  keywords: ["GRE vocabulary", "UPSC english", "vocabulary app India", "spaced repetition", "learn english words", "VocabPod"],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html
      lang="en"
      className={`${inter.variable} ${lora.variable} ${outfit.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <meta name="darkreader-lock" />
        <link rel="preconnect" href="https://checkout.razorpay.com" />
      </head>
      <body className={`flex flex-col md:flex-row min-h-full bg-absolute-black text-light-gray ${inter.className}`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}

