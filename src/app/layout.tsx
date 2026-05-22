import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import MobileWrapper from "@/components/MobileWrapper";
import ClientSidebar from "@/components/ClientSidebar";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Vocabpod",
  description: "A minimalistic and modern approach to memory and learning.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <meta name="darkreader-lock" />
      </head>
      <body className={`flex flex-col md:flex-row min-h-full bg-absolute-black text-light-gray ${inter.className}`} suppressHydrationWarning>
        <AuthProvider>
          <ClientSidebar />
          <div className="flex-1 min-w-0 w-full flex flex-col">
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
