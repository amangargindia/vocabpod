import type { LiveDemoWord } from "./useSalesConfig";

export type DemoWord = {
  word: string;
  phonetic: string;
  type: string;
  definition: string;
  story: string;
  storyHinglish?: string;
  narrative: string;
  narrativeHinglish?: string;
  stickmanPose: string;
  custom_image_url?: string | null;
  custom_svg?: string | null;
  svg_elements?: any[];
  audio_url?: string | null;
  realLifeUseCase: string;
  realLifeUseCaseHinglish?: string;
  quiz: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  };
  xp: number;
};

export type DemoAudioConfig = {
  src: string;
  timestamps: { stage: number; startMs: number; endMs: number }[];
};

/**
 * Convert a LiveDemoWord (from Supabase) to the DemoWord shape used by landing components.
 */
export function liveToDemoWord(w: LiveDemoWord): DemoWord {
  const usages = Array.isArray(w.real_life_usage) ? w.real_life_usage : [];
  const firstUsage = usages[0];
  const realLifeUseCase = firstUsage
    ? `${firstUsage.context ? firstUsage.context + ": " : ""}${firstUsage.example || ""}`
    : "";

  const quiz = Array.isArray(w.quiz_questions) && w.quiz_questions.length > 0
    ? w.quiz_questions[0]
    : null;

  const options: string[] = quiz?.options?.map((o: any) => o.text || "") ?? [
    "Option A", "Option B", "Option C", "Option D",
  ];
  const correctIndex =
    quiz?.options?.findIndex((o: any) => o.isCorrect) ?? 0;

  return {
    word: w.word,
    phonetic: w.phonetic || "",
    type: w.type || "word",
    definition: w.definition || "",
    story: w.story || "",
    narrative: w.narrative || "",
    stickmanPose: "thinking",
    custom_image_url: w.custom_image_url || null,
    custom_svg: w.custom_svg || null,
    svg_elements: w.svg_elements || undefined,
    audio_url: w.audio_url || null,
    realLifeUseCase,
    quiz: {
      question: quiz?.question || "What does this word mean?",
      options,
      correctIndex: correctIndex >= 0 ? correctIndex : 0,
      explanation: quiz?.explanation || "",
    },
    xp: 50,
  };
}

/** Static fallback shown during loading or when no words are configured */
export const FALLBACK_DEMO_WORDS: DemoWord[] = [
  {
    word: "ephemeral",
    phonetic: "/ɪˈfem.ər.əl/",
    type: "adjective",
    definition: "Lasting for a very short time; short-lived.",
    story:
      "As a child, Leo spent hours building an intricate sandcastle by the shore. But as evening approached, the tide rolled in. Within minutes, the waves washed away his masterpiece. He learned that beauty is often **ephemeral**, existing only for a fleeting moment.",
    narrative:
      "Think of an **ephemeral** sandcastle, beautiful but quickly washed away by the tide.",
    stickmanPose: "falling",
    realLifeUseCase:
      "Social media trend: 'The popularity of this meme will be purely ephemeral.'",
    quiz: {
      question:
        "Which of the following is most likely to be described as ephemeral?",
      options: ["A diamond ring", "A mountain range", "A rainbow", "A historical monument"],
      correctIndex: 2,
      explanation:
        "A rainbow appears briefly after rain and then fades away — making it ephemeral (short-lived).",
    },
    xp: 50,
  },
];

// Keep demoWords as an alias to FALLBACK_DEMO_WORDS for any legacy imports
export const demoWords: DemoWord[] = FALLBACK_DEMO_WORDS;
