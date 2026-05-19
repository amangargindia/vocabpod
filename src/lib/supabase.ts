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
  quiz_questions: Array<{
    question: string;
    options: Array<{ text: string; isCorrect: boolean }>;
    explanation: string;
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

// Fetch function that transparently loads from Supabase or mock data
export async function getWordLesson(wordSlug: string): Promise<WordLesson> {
  const normalizedWord = wordSlug.toLowerCase();
  
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("words")
        .select("*")
        .eq("word", normalizedWord)
        .single();
        
      if (!error && data) {
        return data as WordLesson;
      }
      console.warn("Supabase query error or record not found, falling back to mock data:", error);
    } catch (e) {
      console.error("Supabase client failed, falling back to mock data:", e);
    }
  }

  // Fallback to local mock data
  const localLesson = mockLessons[normalizedWord];
  if (!localLesson) {
    throw new Error(`Word lesson '${wordSlug}' not found in database or mock datasets.`);
  }
  return localLesson;
}

export async function getWordFeed() {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("words")
        .select("id, word, type, definition, created_at")
        .order("created_at", { ascending: false });
        
      if (!error && data) {
        return data;
      }
    } catch (e) {
      console.error("Feed: Supabase failed, falling back to mock data:", e);
    }
  }

  // Fallback to mock data
  return Object.values(mockLessons).map((l) => ({
    id: l.id,
    word: l.word,
    type: l.type,
    definition: l.definition,
    created_at: l.created_at
  }));
}

// ==========================================
// Auth Abstraction (Cloud or Local Fallback)
// ==========================================

export async function getUser() {
  if (supabase) {
    try {
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
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("words")
        .insert({
          word: lesson.word.toLowerCase(),
          phonetic: lesson.phonetic,
          type: lesson.type,
          definition: lesson.definition,
          narrative: lesson.narrative,
          audio_url: lesson.audio_url,
          svg_elements: lesson.svg_elements,
          quiz_questions: lesson.quiz_questions
        })
        .select()
        .single();
        
      if (error) throw error;
      return { success: true, data };
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
