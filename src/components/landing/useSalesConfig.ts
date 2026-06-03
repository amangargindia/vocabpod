"use client";

import { useState, useEffect } from "react";

export type Screenshot = {
  url: string;
  title: string;
  subtitle: string;
};

export type FAQ = {
  q_en: string;
  a_en: string;
  q_hi?: string;
  a_hi?: string;
};

export type Testimonial = {
  name: string;
  initials: string;
  quote_en: string;
  quote_hi?: string;
};

export type SalesConfig = {
  preview_word_ids: string[];
  preview_words_data: LiveDemoWord[];
  screenshots: Screenshot[];
  founder_photo_url: string | null;
  intro_video_url: string | null;
  intro_video_hidden: boolean;
  faqs: FAQ[];
  testimonials: Testimonial[];
};

export type LiveDemoWord = {
  id: string;
  word: string;
  phonetic: string;
  type: string;
  definition: string;
  story: string;
  storyHinglish?: string;
  narrative: string;
  narrativeHinglish?: string;
  custom_image_url: string | null;
  custom_svg: string | null;
  audio_url: string | null;
  quiz_questions: any[];
  real_life_usage: { context: string; example: string; hinglish?: string }[];
  svg_elements: any;
};

const DEFAULT_CONFIG: SalesConfig = {
  preview_word_ids: [],
  preview_words_data: [],
  screenshots: [],
  founder_photo_url: null,
  intro_video_url: null,
  intro_video_hidden: false,
  faqs: [],
  testimonials: [],
};

/**
 * Pass `initialData` (server-fetched) to avoid a client waterfall & first-render flicker.
 * The hook will still revalidate in the background when `initialData` is stale.
 */
export function useSalesConfig(initialData?: SalesConfig) {
  const [config, setConfig] = useState<SalesConfig>(initialData ?? DEFAULT_CONFIG);
  const [words, setWords] = useState<LiveDemoWord[]>(
    initialData?.preview_words_data ?? []
  );
  // If we got real initialData from the server, we're NOT loading
  const [isLoading, setIsLoading] = useState(!initialData);

  useEffect(() => {
    // If we already have server data, skip the client fetch (data is fresh)
    if (initialData) return;

    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/landing/sales-config", {
          // Use browser cache; Next.js ISR will serve a cached response
          cache: "force-cache",
        });
        const json = await res.json();
        if (cancelled) return;

        const salesConfig: SalesConfig = { ...DEFAULT_CONFIG, ...json.config };
        setConfig(salesConfig);
        setWords(
          Array.isArray(salesConfig.preview_words_data)
            ? salesConfig.preview_words_data
            : []
        );
      } catch {
        // Silently fall back to defaults
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  // We deliberately exclude initialData from deps: it's only read once at mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { config, words, isLoading };
}
