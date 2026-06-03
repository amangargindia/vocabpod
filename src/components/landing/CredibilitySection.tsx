"use client";

import { useLandingLanguage } from "@/contexts/LandingLanguageContext";
import { useSalesConfig, type SalesConfig } from "./useSalesConfig";
import Image from "next/image";

function getYouTubeEmbedUrl(url: string): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    // youtu.be/ID
    if (u.hostname === "youtu.be") {
      return `https://www.youtube.com/embed${u.pathname}`;
    }
    // youtube.com/watch?v=ID
    const v = u.searchParams.get("v");
    if (v) return `https://www.youtube.com/embed/${v}`;
    // Already an embed URL
    if (u.pathname.startsWith("/embed/")) return url;
  } catch {}
  return null;
}

interface Props { initialData?: SalesConfig | null; }
export default function CredibilitySection({ initialData }: Props) {
  const { language } = useLandingLanguage();
  const { config, isLoading } = useSalesConfig(initialData ?? undefined);

  const embedUrl =
    !config.intro_video_hidden && config.intro_video_url
      ? getYouTubeEmbedUrl(config.intro_video_url)
      : null;

  return (
    <section className="py-24 px-6 bg-absolute-black">
      <div className="max-w-6xl mx-auto flex flex-col items-center">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-terracotta border border-terracotta/20 rounded-full px-4 py-1">
            {language === "hi" ? "VOCABPOD KYU BANAYA GAYA" : "WHY VOCABPOD EXISTS"}
          </span>
        </div>

        {/* Founder Story */}
        <div className="flex flex-col md:flex-row items-center gap-12 max-w-4xl w-full mb-24">
          <div className="flex-1 order-2 md:order-1">
            <blockquote className="border-l-4 border-terracotta pl-6 text-xl italic text-light-gray mb-8">
              {language === "hi"
                ? `"Maine English aur Russian seekhne mein bohot struggle kiya. VocabPod usi frustration ko dur karne ke liye banaya gaya hai!"`
                : `"I struggled endlessly to remember words in English and Russian. VocabPod was built to end that frustration."`}
            </blockquote>

            <div className="space-y-4 text-muted-ash text-sm leading-relaxed">
              <p>
                {language === "hi"
                  ? "Maine traditional methods se words seekhne me mahino lagaye, par kuch kaam nahi aaya. Ye ek leaky bucket (ched wali balti) jaisa tha."
                  : "I spent months learning words with traditional methods. Nothing worked. It felt like trying to fill a leaky bucket."}
              </p>
              <p>
                {language === "hi"
                  ? "Cognitive science ne solution diya: brain stories aur visuals ko yaad rakhta hai, plain text ko nahi. Spaced Repetition (SRS) aur visual mnemonics se leak band ho gaya."
                  : "Cognitive science provided the cure: the brain remembers stories, visuals, and emotions, not raw text. Spaced Repetition (SRS) combined with visual mnemonics plugged the leak."}
              </p>
              <p>
                {language === "hi"
                  ? "Aaj VocabPod thousands of logo ko bina burnout ke vocabulary permanently yaad rakhne me help karta hai."
                  : "Today, VocabPod helps thousands encode vocabulary permanently, without the burnout."}
              </p>
            </div>

            <div className="mt-8">
              <p className="font-bold text-light-gray uppercase tracking-widest text-sm">
                Aman Garg
              </p>
              <p className="text-xs text-terracotta uppercase tracking-widest">
                Founder, Fluency Bridge (parent of VocabPod)
              </p>
            </div>
          </div>

          <div className="shrink-0 order-1 md:order-2">
            <div className="w-48 h-48 md:w-64 md:h-64 rounded-full bg-card-gray border border-white/5 flex items-center justify-center overflow-hidden shadow-2xl relative">
              <div className="absolute inset-0 bg-gradient-to-br from-terracotta/10 to-transparent pointer-events-none" />
              {config.founder_photo_url ? (
                <Image
                  src={config.founder_photo_url}
                  alt="Aman Garg — Founder of VocabPod"
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <span className="text-5xl font-black text-white/10 uppercase">AG</span>
              )}
            </div>
          </div>
        </div>

        {/* Video — only shown when admin toggle is ON and a valid URL exists */}
        {!config.intro_video_hidden && embedUrl && (
          <div className="w-full max-w-4xl mx-auto flex flex-col items-center">
            <div className="w-full aspect-video bg-card-gray rounded-3xl overflow-hidden shadow-2xl border border-white/5 relative">
              <iframe
                src={embedUrl}
                title="Watch how VocabPod works"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 w-full h-full"
              />
            </div>
            <p className="text-sm text-muted-ash mt-6 uppercase tracking-widest font-bold">
              {language === "hi"
                ? "Dekhiye VocabPod kaise kaam karta hai (3 minutes)"
                : "Watch how VocabPod works (3 minutes)"}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
