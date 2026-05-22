import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Initialize real Supabase client only if credentials are provided
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Mock database type definition matching our schema
export interface WordLesson {
  id: string;
  word: string;
  phonetic: string;
  type: string;
  definition: string;
  narrative: string;
  audio_url: string;
  svg_elements: Array<{
    tag: "path" | "circle" | "line" | "rect" | "ellipse" | "polygon" | "g";
    props: Record<string, any>;
    children?: WordLesson["svg_elements"];
  }>;
  stickman_id?: string;
  custom_image_url?: string;
  custom_svg?: string;
  quiz_questions: Array<{
    question: string;
    options: Array<{ text: string; isCorrect: boolean }>;
    explanation: string;
  }>;
  real_life_usage?: Array<{
    context: string;
    example: string;
  }>;
  created_at: string;
}

// Mock database fallback
export const mockLessons: Record<string, WordLesson> = {
  ephemeral: {
    id: "e5f2a1b9-3b9a-4cde-824b-4a10f5699702",
    word: "ephemeral",
    phonetic: "/ɪˈfemərəl/",
    type: "adjective",
    definition: "Lasting for a very short time; transient; fleeting.",
    narrative: "Think of the word **ephemeral** like the brief, beautiful journey of a **dandelion seed** floating in the wind. A sudden gust sweeps it into the sky, but its flight is momentary. Within seconds, it lands and dissolves into the earth. The entire beauty of its existence lies in how rapidly it passes. On VocabPod, we anchor this fleeting nature directly to the single **Terracotta Red** seed breaking away from the static cluster.",
    audio_url: "https://www.w3schools.com/html/horse.mp3",
    svg_elements: [
      // Stem
      {
        tag: "path",
        props: {
          d: "M 200 280 Q 190 220 200 150",
          fill: "none",
          stroke: "#F5F5F7",
          strokeWidth: "2.5",
          strokeLinecap: "round",
          opacity: "0.8"
        }
      },
      // Dandelion center
      {
        tag: "circle",
        props: {
          cx: "200",
          cy: "150",
          r: "8",
          fill: "none",
          stroke: "#F5F5F7",
          strokeWidth: "2",
          opacity: "0.8"
        }
      },
      // Static seed arms
      { tag: "line", props: { x1: "200", y1: "142", x2: "200", y2: "110", stroke: "#8E8E93", strokeWidth: "1.5", strokeLinecap: "round", opacity: "0.5" } },
      { tag: "line", props: { x1: "208", y1: "150", x2: "240", y2: "150", stroke: "#8E8E93", strokeWidth: "1.5", strokeLinecap: "round", opacity: "0.5" } },
      { tag: "line", props: { x1: "192", y1: "150", x2: "160", y2: "150", stroke: "#8E8E93", strokeWidth: "1.5", strokeLinecap: "round", opacity: "0.5" } },
      { tag: "line", props: { x1: "206", y1: "144", x2: "228", y2: "122", stroke: "#8E8E93", strokeWidth: "1.5", strokeLinecap: "round", opacity: "0.5" } },
      { tag: "line", props: { x1: "194", y1: "144", x2: "172", y2: "122", stroke: "#8E8E93", strokeWidth: "1.5", strokeLinecap: "round", opacity: "0.5" } },
      { tag: "line", props: { x1: "206", y1: "156", x2: "228", y2: "178", stroke: "#8E8E93", strokeWidth: "1.5", strokeLinecap: "round", opacity: "0.5" } },
      { tag: "line", props: { x1: "194", y1: "156", x2: "172", y2: "178", stroke: "#8E8E93", strokeWidth: "1.5", strokeLinecap: "round", opacity: "0.5" } },
      // Static fluff circles
      { tag: "circle", props: { cx: "200", cy: "108", r: "2.5", fill: "#8E8E93", opacity: "0.6" } },
      { tag: "circle", props: { cx: "242", cy: "150", r: "2.5", fill: "#8E8E93", opacity: "0.6" } },
      { tag: "circle", props: { cx: "158", cy: "150", r: "2.5", fill: "#8E8E93", opacity: "0.6" } },
      { tag: "circle", props: { cx: "230", cy: "120", r: "2.5", fill: "#8E8E93", opacity: "0.6" } },
      { tag: "circle", props: { cx: "170", cy: "120", r: "2.5", fill: "#8E8E93", opacity: "0.6" } },
      // Group for flying Terracotta spot-color seeds
      {
        tag: "g",
        props: { stroke: "#E04B35", strokeWidth: "2", strokeLinecap: "round", fill: "none" },
        children: [
          // Flying Seed 1
          { tag: "path", props: { d: "M 200 150 Q 230 110 270 80" } },
          { tag: "circle", props: { cx: "270", cy: "80", r: "4.5", fill: "#E04B35", stroke: "none" } },
          { tag: "circle", props: { cx: "270", cy: "80", r: "10", fill: "#E04B35", fillOpacity: "0.15", stroke: "none" } },
          // Flying Seed 2
          { tag: "path", props: { d: "M 200 150 Q 250 80 305 55", strokeWidth: "2.5" } },
          { tag: "circle", props: { cx: "305", cy: "55", r: "5", fill: "#E04B35", stroke: "none" } },
          { tag: "circle", props: { cx: "305", cy: "55", r: "12", fill: "#E04B35", fillOpacity: "0.15", stroke: "none" } },
          // Flying Seed 3
          { tag: "path", props: { d: "M 200 150 Q 260 140 325 125", strokeWidth: "1.8" } },
          { tag: "circle", props: { cx: "325", cy: "125", r: "4", fill: "#E04B35", stroke: "none" } },
          { tag: "circle", props: { cx: "325", cy: "125", r: "8", fill: "#E04B35", fillOpacity: "0.15", stroke: "none" } }
        ]
      }
    ],
    quiz_questions: [
      {
        question: "Which of the following is the best example of something ephemeral?",
        options: [
          { text: "A granite monument standing in a city square.", isCorrect: false },
          { text: "A delicate soap bubble floating in a summer breeze.", isCorrect: true },
          { text: "An ancient oak tree deep in a national forest.", isCorrect: false },
          { text: "A plastic bottle sitting in a recycling bin.", isCorrect: false }
        ],
        explanation: "A soap bubble is the definition of ephemeral—it exists for only a few seconds before popping and vanishing forever, unlike granite monuments or ancient trees which are built to last."
      }
    ],
    created_at: new Date().toISOString()
  }
};

let cachedFeed: any[] | null = null;
const cachedLessons: Record<string, WordLesson> = {};

export function clearLessonsCache() {
  cachedFeed = null;
  Object.keys(cachedLessons).forEach((key) => delete cachedLessons[key]);
}

export async function getWordLesson(wordSlug: string): Promise<WordLesson> {
  const decoded = decodeURIComponent(wordSlug);
  const normalizedWord = decoded.toLowerCase();
  
  if (cachedLessons[normalizedWord]) {
    // Trigger background refresh to keep cache updated
    if (supabase) {
      (async () => {
        try {
          const { data, error } = await supabase
            .from("words")
            .select("*")
            .eq("word", normalizedWord)
            .single();
          if (!error && data) {
            cachedLessons[normalizedWord] = data as WordLesson;
          }
        } catch (e) {}
      })();
    }
    
    let lessonData = cachedLessons[normalizedWord];
    const sub = await getUserSubscription();
    if (!sub.is_premium) {
      lessonData = { ...lessonData, audio_url: "" };
    }
    return lessonData;
  }
  
  let lessonData: WordLesson | null = null;
  
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("words")
        .select("*")
        .eq("word", normalizedWord)
        .single();
        
      if (!error && data) {
        lessonData = data as WordLesson;
      } else {
        console.warn("Supabase query error or record not found, falling back to mock data:", error);
      }
    } catch (e) {
      console.error("Supabase client failed, falling back to mock data:", e);
    }
  }

  // Fallback to local mock data
  if (!lessonData) {
    lessonData = mockLessons[normalizedWord];
    if (!lessonData) {
      throw new Error(`Word lesson '${wordSlug}' not found in database or mock datasets.`);
    }
  }

  // Cache raw lesson data before subscription-based scrubbing
  cachedLessons[normalizedWord] = lessonData;

  // Security: Scrub audio URL if the user is not Premium
  const sub = await getUserSubscription();
  if (!sub.is_premium) {
    lessonData = { ...lessonData, audio_url: "" };
  }

  return lessonData;
}

export async function getWordFeed() {
  // If we have an in-memory cache, return it and refresh in background
  if (cachedFeed) {
    if (supabase) {
      (async () => {
        try {
          const { data, error } = await supabase
            .from("words")
            .select("id, word, type, definition, level, category, is_free_preview, created_at")
            .order("created_at", { ascending: false });
          if (!error && data && data.length > 0) {
            cachedFeed = data;
            if (typeof window !== "undefined") {
              localStorage.setItem("vocabpod_feed_cache", JSON.stringify(data));
            }
          }
        } catch (e) {}
      })();
    }
    return cachedFeed;
  }

  // Try to load from localStorage first
  if (typeof window !== "undefined") {
    try {
      const local = localStorage.getItem("vocabpod_feed_cache");
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) {
          cachedFeed = parsed;
          // Trigger background fetch to keep fresh
          if (supabase) {
            (async () => {
              try {
                const { data, error } = await supabase
                  .from("words")
                  .select("id, word, type, definition, level, category, is_free_preview, created_at")
                  .order("created_at", { ascending: false });
                if (!error && data && data.length > 0) {
                  cachedFeed = data;
                  localStorage.setItem("vocabpod_feed_cache", JSON.stringify(data));
                }
              } catch (e) {}
            })();
          }
          return parsed;
        }
      }
    } catch (e) {}
  }

  let data: any[] | null = null;

  if (supabase) {
    try {
      const { data: dbData, error } = await supabase
        .from("words")
        .select("id, word, type, definition, level, category, is_free_preview, created_at")
        .order("created_at", { ascending: false });
        
      if (!error && dbData && dbData.length > 0) {
        data = dbData;
      }
    } catch (e) {
      console.error("Feed: Supabase failed, falling back to mock data:", e);
    }
  }

  if (!data) {
    // Fallback to mock data
    data = Object.values(mockLessons).map((l) => ({
      id: l.id,
      word: l.word,
      type: l.type,
      definition: l.definition,
      level: 1,
      category: null,
      is_free_preview: false,
      created_at: l.created_at
    }));
  }

  cachedFeed = data;
  if (typeof window !== "undefined") {
    localStorage.setItem("vocabpod_feed_cache", JSON.stringify(data));
  }
  return data;
}

// ==========================================
// Auth Abstraction (Cloud or Local Fallback)
// ==========================================

export async function getUser() {
  if (supabase) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        return { id: session.user.id, email: session.user.email };
      }
      const { data: { user } } = await supabase.auth.getUser();
      if (user) return { id: user.id, email: user.email };
    } catch (e) {
      console.warn("Supabase auth getUser failed, checking mock", e);
    }
  }

  // Fallback: check localStorage for a mock session
  if (typeof window !== "undefined") {
    const mockSession = localStorage.getItem("vocabpod_mock_user");
    if (mockSession) return JSON.parse(mockSession);
  }
  return null;
}

export async function getUserSubscription() {
  const user = await getUser();
  if (!user) return { is_premium: false };

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("users_subscriptions")
        .select("is_premium")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(1);
      
      if (data && data.length > 0) return data[0];
    } catch (e) {
      console.warn("Failed to fetch subscription:", e);
    }
  }

  // Fallback
  return { is_premium: false };
}

export async function signUp(email: string, password: string): Promise<{ success: boolean; message: string }> {
  if (supabase) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/login` : undefined
      }
    });

    if (error) {
      return { success: false, message: error.message };
    }
    return { success: true, message: "Check your email to confirm your account!" };
  }

  // Local mock fallback for development without internet
  if (typeof window !== "undefined") {
    localStorage.setItem("vocabpod_mock_user", JSON.stringify({ id: "mock-uuid-1234", email }));
    return { success: true, message: "Mock Account Created. You can now sign in." };
  }
  return { success: false, message: "Server error" };
}

export async function signInWithPassword(email: string, password: string): Promise<{ success: boolean; message: string }> {
  if (supabase) {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { success: false, message: error.message };
    }
    return { success: true, message: "Signed in successfully!" };
  }

  // Local mock fallback
  if (typeof window !== "undefined") {
    const mockUser = localStorage.getItem("vocabpod_mock_user");
    if (mockUser) {
      return { success: true, message: "Mock Sign In Successful." };
    }
    return { success: false, message: "Mock user not found. Please sign up first." };
  }
  return { success: false, message: "Server error" };
}

export async function resetPassword(email: string): Promise<{ success: boolean; message: string }> {
  if (supabase) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/reset-password` : undefined,
    });
    if (error) {
      return { success: false, message: error.message };
    }
    return { success: true, message: "Password reset link sent to your email." };
  }
  return { success: true, message: "[MOCK] Reset link sent." };
}

export async function signOut() {
  if (supabase) {
    await supabase.auth.signOut();
  }
  
  if (typeof window !== "undefined") {
    localStorage.removeItem("vocabpod_mock_user");
    localStorage.setItem("vocabpod_last_user_id", "guest");
  }
}

// ==========================================
// Progress Sync Abstraction (Cloud)
// ==========================================

export async function saveCloudProgress(wordSlug: string, isQuizCorrect: boolean) {
  if (!supabase) return false;
  try {
    const user = await getUser();
    if (!user) return false;

    // Fetch existing progress
    const { data: existing } = await supabase
      .from("user_progress")
      .select("*")
      .eq("user_id", user.id)
      .eq("word_slug", wordSlug)
      .single();

    if (existing) {
      await supabase
        .from("user_progress")
        .update({
          is_completed: true,
          quiz_score: isQuizCorrect ? 1 : 0,
          last_reviewed_at: new Date().toISOString()
        })
        .eq("id", existing.id);
    } else {
      await supabase
        .from("user_progress")
        .insert({
          user_id: user.id,
          word_slug: wordSlug,
          is_completed: true,
          quiz_score: isQuizCorrect ? 1 : 0
        });
    }
    return true;
  } catch (e) {
    console.error("Cloud sync failed:", e);
    return false;
  }
}

export async function getCloudProgress() {
  if (!supabase) return null;
  try {
    const user = await getUser();
    if (!user) return null;

    const { data } = await supabase
      .from("user_progress")
      .select("*")
      .eq("user_id", user.id);
    return data;
  } catch (e) {
    console.error("Cloud fetch failed:", e);
    return null;
  }
}

// ==========================================
// Admin Insert Abstraction
// ==========================================

export async function insertWordLesson(lesson: Omit<WordLesson, "id" | "created_at">) {
  const user = await getUser();
  if (supabase && user?.email) {
    try {
      const res = await fetch("/api/admin/words", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          word: lesson.word.toLowerCase(),
          phonetic: lesson.phonetic,
          type: lesson.type,
          definition: lesson.definition,
          narrative: lesson.narrative,
          story: (lesson as any).story || null,
          level: (lesson as any).level ?? 1,
          category: (lesson as any).category || null,
          is_free_preview: (lesson as any).is_free_preview ?? false,
          stickman_id: (lesson as any).stickman_id || null,
          custom_image_url: (lesson as any).custom_image_url || null,
          custom_svg: (lesson as any).custom_svg || null,
          audio_url: lesson.audio_url,
          svg_elements: lesson.svg_elements,
          real_life_usage: lesson.real_life_usage || null,
          quiz_questions: lesson.quiz_questions
        })
      });
      
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to insert word.");
      
      return { success: true, data: json.data };
    } catch (e: any) {
      console.error("Admin Insert failed:", e);
      throw new Error(e.message || "Failed to insert into Supabase.");
    }
  }

  // Fallback: Insert into local mock map
  const normalized = lesson.word.toLowerCase();
  mockLessons[normalized] = {
    ...lesson,
    id: `mock-id-${Date.now()}`,
    word: normalized,
    created_at: new Date().toISOString()
  };
  
  return { success: true, data: mockLessons[normalized] };
}
