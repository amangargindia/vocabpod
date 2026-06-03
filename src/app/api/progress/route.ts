import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getTodayIST, getYesterdayIST } from "@/lib/dateUtils";
import { getValidatedUser } from "@/lib/serverAuth";


const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const adminSupabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

// Fixed SRS schedule: 2-4-7-14-30 days
// Index = number of successful completions (0-indexed)
const SRS_SCHEDULE = [2, 4, 7, 14, 30];

// Determine current SRS step from stored interval_days
function getStepFromInterval(intervalDays: number): number {
  if (intervalDays <= 1) return -1; // Never reviewed before (default 0 or 1)
  for (let i = 0; i < SRS_SCHEDULE.length; i++) {
    if (intervalDays <= SRS_SCHEDULE[i]) return i;
  }
  return SRS_SCHEDULE.length - 1; // Already at max step
}

// Calculate next SRS state based on pass/fail
// Pass: advance one step up
// Fail: demote two steps down (minimum step 0)
function calculateNextSRS(score: number, currentIntervalDays: number) {
  const passed = score >= 70;
  const currentStep = getStepFromInterval(currentIntervalDays);

  if (passed) {
    // Advance one step
    const nextStep = Math.min(currentStep + 1, SRS_SCHEDULE.length - 1);
    return { interval: SRS_SCHEDULE[nextStep], passed: true };
  } else {
    // Demote two steps on failure (min step 0 = 2 days)
    const nextStep = Math.max(0, currentStep - 2);
    return { interval: SRS_SCHEDULE[nextStep], passed: false };
  }
}

export async function POST(req: Request) {
  if (!adminSupabase) {
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }

  try {
    const user = await getValidatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = user.id;

    const { wordSlug, score } = await req.json();
    if (!wordSlug) {
      return NextResponse.json({ error: "wordSlug required" }, { status: 400 });
    }

    const now = new Date().toISOString();
    // Use IST date so daily resets happen at 12:00 AM IST, not midnight UTC
    const today = getTodayIST();

    // Resolve the canonical word slug from the words table (case-insensitive).
    // The lesson page normalizes to lowercase, but the DB stores the original case
    // (e.g. "ESF"). The FK constraint requires an exact match, so we must use the
    // actual stored value.
    const { data: wordRow } = await adminSupabase
      .from("words")
      .select("word")
      .ilike("word", wordSlug)
      .maybeSingle();
    const canonicalSlug = wordRow?.word ?? wordSlug;

    // Fetch existing progress row using the canonical slug
    const { data: existing } = await adminSupabase
      .from("user_progress")
      .select("*")
      .eq("user_id", userId)
      .eq("word_slug", canonicalSlug)
      .maybeSingle();

    const currentInterval = existing?.interval_days ?? 0;
    const reviewCount = (existing?.review_count ?? 0) + 1;

    const { interval, passed } = calculateNextSRS(score, currentInterval);
    const nextReviewAt = new Date(Date.now() + interval * 24 * 60 * 60 * 1000).toISOString();

    // XP is only awarded the VERY FIRST TIME a word is completed correctly.
    // first_completed_at being null means it has never been answered correctly before.
    const isFirstCompletion = passed && !existing?.first_completed_at;

    // Flat 15 XP for completing a word
    const xpEarned = isFirstCompletion ? 15 : 0;

    // Word is completed if it was ever answered correctly (persists through failed re-reviews)
    const isCompleted = passed || (existing?.is_completed ?? false);

    // Upsert progress row
    const { error: upsertErr } = await adminSupabase
      .from("user_progress")
      .upsert({
        user_id: userId,
        word_slug: canonicalSlug,
        is_completed: isCompleted,
        quiz_score: score,
        last_reviewed_at: now,
        next_review_at: nextReviewAt,
        ease_factor: 2.5, // Kept for schema compatibility; not used in fixed SRS
        interval_days: interval,
        review_count: reviewCount,
        xp_earned: isFirstCompletion ? xpEarned : (existing?.xp_earned ?? 0),
        first_completed_at: isFirstCompletion ? now : (existing?.first_completed_at ?? null),
      }, {
        onConflict: "user_id,word_slug"
      });

    if (upsertErr) {
      throw new Error(`Failed to upsert user progress: ${upsertErr.message}`);
    }

    // Update user_profiles: XP, streak, last_active_date, total_words_learned
    const { data: profile } = await adminSupabase
      .from("user_profiles")
      .select("total_xp, streak_count, last_active_date, total_words_learned")
      .eq("user_id", userId)
      .maybeSingle();

    const lastActive = profile?.last_active_date;
    const yesterday = getYesterdayIST();
    const streak = lastActive === yesterday
      ? (profile?.streak_count ?? 0) + 1
      : lastActive === today
      ? (profile?.streak_count ?? 1)
      : 1;

    const newTotalXp = (profile?.total_xp ?? 0) + xpEarned;
    // Only increment total_words_learned on first completion
    const newTotalWordsLearned = isFirstCompletion
      ? (profile?.total_words_learned ?? 0) + 1
      : (profile?.total_words_learned ?? 0);

    const { error: profileErr } = await adminSupabase
      .from("user_profiles")
      .upsert({
        user_id: userId,
        total_xp: newTotalXp,
        streak_count: streak,
        last_active_date: today,
        total_words_learned: newTotalWordsLearned,
        updated_at: now,
      }, {
        onConflict: "user_id"
      });

    if (profileErr) {
      console.error(`Failed to upsert user profile: ${profileErr.message}`);
      // Non-fatal — progress was saved successfully
    }

    return NextResponse.json({
      success: true,
      xpEarned,
      nextReviewIn: interval,
      isCompleted,
      isFirstCompletion,
      passed,
    });
  } catch (e: any) {
    console.error("Progress update error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
