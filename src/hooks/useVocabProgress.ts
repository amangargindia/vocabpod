import { useState, useEffect } from "react";
import { getUser, getCloudProgress } from "@/lib/supabase";
import { getTodayIST, getYesterdayIST } from "@/lib/dateUtils";

// The SRS progress data model
export interface UserWordProgress {
  word_slug: string;
  is_completed: boolean;
  quiz_score: number | null;
  last_reviewed_at: string | null;
  next_review_at: string | null;     // When to show this word next for SRS review
  first_completed_at: string | null; // Set on first correct answer (used for XP dedup)
  ease_factor: number;
  interval_days: number;
  review_count: number;
}

export interface UserStats {
  totalWordsLearned: number;
  currentStreak: number;
  lastActiveDate: string | null;
  progressList: UserWordProgress[];
}

const DEFAULT_STATS: UserStats = {
  totalWordsLearned: 0,
  currentStreak: 0,
  lastActiveDate: null,
  progressList: [],
};

let lastProgressFetchTime: Record<string, number> = {};
const PROGRESS_COOLDOWN_MS = 15 * 60 * 1000;

export function useVocabProgress(initialUserId?: string | null, isParentLoaded?: boolean) {
  const [stats, setStats] = useState<UserStats>(DEFAULT_STATS);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isAuthLoaded, setIsAuthLoaded] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function loadProgress() {
      // Step 1: Immediately read the last known user's cache from localStorage
      // to prevent UI flash and layout shifts on the home page
      let initialUserId = "guest";
      if (typeof window !== "undefined") {
        initialUserId = localStorage.getItem("vocabpod_last_user_id") || "guest";
        const storageKey = `vocabpod_progress_${initialUserId}`;
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (parsed && typeof parsed === "object" && Array.isArray(parsed.progressList)) {
              setStats(parsed);
            } else {
              setStats(DEFAULT_STATS);
            }
            setIsLoaded(true);
          } catch (e) {
            console.error("Failed to parse initial local progress", e);
            setStats(DEFAULT_STATS);
            setIsLoaded(true);
          }
        }
      }

      // Step 2: Resolve authenticated user
      const currentUser = await getUser();
      const currentId = currentUser?.id || "guest";
      setUserId(currentUser?.id ?? null);
      setIsAuthLoaded(true);

      // Persist last user ID for next load
      localStorage.setItem("vocabpod_last_user_id", currentId);

      // Step 3: If user changed from cached user, reload correct cache
      if (currentId !== initialUserId) {
        const storageKey = `vocabpod_progress_${currentId}`;
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (parsed && typeof parsed === "object" && Array.isArray(parsed.progressList)) {
              setStats(parsed);
            } else {
              setStats(DEFAULT_STATS);
            }
            setIsLoaded(true);
          } catch (e) {
            console.error("Failed to parse local progress for user", e);
            setStats(DEFAULT_STATS);
            setIsLoaded(true);
          }
        } else {
          setStats(DEFAULT_STATS);
          setIsLoaded(true);
        }
      } else {
        setIsLoaded(true);
      }

      // Step 4: Fetch fresh cloud data if 15 minutes have passed since last fetch for this user
      if (currentUser) {
        const now = Date.now();
        const lastFetch = lastProgressFetchTime[currentUser.id] || 0;
        const needsFetch = now - lastFetch > PROGRESS_COOLDOWN_MS;

        if (needsFetch) {
          try {
            const [cloudData, profileRes] = await Promise.all([
              getCloudProgress(),
              fetch(`/api/profile?userId=${currentUser.id}`)
            ]);
            
            // Mark as fetched
            lastProgressFetchTime[currentUser.id] = now;

          const profileData = profileRes.ok ? await profileRes.json() : null;
          const streak = profileData?.profile?.streak_count || 0;

          if (cloudData && cloudData.length > 0) {
            const list: UserWordProgress[] = cloudData.map((c: any) => ({
              word_slug: c.word_slug.toLowerCase(),
              is_completed: c.is_completed,
              quiz_score: c.quiz_score,
              last_reviewed_at: c.last_reviewed_at,
              next_review_at: c.next_review_at ?? null,
              first_completed_at: c.first_completed_at ?? null,
              ease_factor: c.ease_factor ?? 2.5,
              interval_days: c.interval_days ?? 0,
              review_count: c.review_count ?? 0,
            }));

            setStats({
              currentStreak: streak,
              totalWordsLearned: list.filter(l => l.is_completed).length,
              progressList: list,
              lastActiveDate: profileData?.profile?.last_active_date || null,
            });
          } else if (profileData?.profile) {
            setStats(prev => ({
              ...prev,
              currentStreak: streak,
            }));
          }
        } catch (e) {
            console.error("Failed to fetch cloud progress/profile", e);
          }
        }
      }
    }

    loadProgress();
  }, [initialUserId, isParentLoaded]);

  // Save to localStorage whenever stats change (only after auth is resolved)
  useEffect(() => {
    if (isLoaded && isAuthLoaded) {
      const storageKey = `vocabpod_progress_${userId || "guest"}`;
      localStorage.setItem(storageKey, JSON.stringify(stats));
    }
  }, [stats, isLoaded, isAuthLoaded, userId]);

  // Mark a word as locally completed (optimistic update before API responds)
  const markWordCompleted = (wordSlug: string, isQuizCorrect: boolean) => {
    const normalizedSlug = wordSlug.toLowerCase();
    setStats((prev) => {
      const today = getTodayIST();

      let newStreak = prev.currentStreak;
      if (prev.lastActiveDate !== today) {
        const yesterdayStr = getYesterdayIST();
        if (prev.lastActiveDate === yesterdayStr) {
          newStreak += 1;
        } else {
          newStreak = 1;
        }
      }

      const existingList = [...prev.progressList];
      const wordIndex = existingList.findIndex((p) => p.word_slug.toLowerCase() === normalizedSlug);
      const now = new Date().toISOString();
      const wasAlreadyCompleted = wordIndex >= 0 && existingList[wordIndex].is_completed;

      if (wordIndex >= 0) {
        existingList[wordIndex] = {
          ...existingList[wordIndex],
          is_completed: isQuizCorrect || existingList[wordIndex].is_completed,
          quiz_score: isQuizCorrect ? 100 : 0,
          last_reviewed_at: now,
          review_count: (existingList[wordIndex].review_count ?? 0) + 1,
          // SRS fields will be synced via syncWordSRS() after API responds
        };
        if (isQuizCorrect && !existingList[wordIndex].first_completed_at) {
          existingList[wordIndex].first_completed_at = now;
        }
      } else {
        existingList.push({
          word_slug: normalizedSlug,
          is_completed: isQuizCorrect,
          quiz_score: isQuizCorrect ? 100 : 0,
          last_reviewed_at: now,
          next_review_at: null,
          first_completed_at: isQuizCorrect ? now : null,
          ease_factor: 2.5,
          interval_days: 0,
          review_count: 1,
        });
      }

      const completedCount = existingList.filter((w) => w.is_completed).length;

      return {
        totalWordsLearned: completedCount,
        currentStreak: newStreak,
        lastActiveDate: today,
        progressList: existingList,
      };
    });
  };

  // Sync SRS fields back from the API response (call after /api/progress responds)
  const syncWordSRS = (wordSlug: string, nextReviewAt: string, intervalDays: number) => {
    const normalizedSlug = wordSlug.toLowerCase();
    setStats((prev) => {
      const list = [...prev.progressList];
      const idx = list.findIndex((p) => p.word_slug.toLowerCase() === normalizedSlug);
      if (idx >= 0) {
        list[idx] = {
          ...list[idx],
          next_review_at: nextReviewAt,
          interval_days: intervalDays,
        };
      }
      return { ...prev, progressList: list };
    });
  };

  const getWordProgress = (wordSlug: string): UserWordProgress | null => {
    const normalizedSlug = wordSlug.toLowerCase();
    return stats.progressList.find((p) => p.word_slug.toLowerCase() === normalizedSlug) || null;
  };

  return {
    stats,
    isLoaded,
    markWordCompleted,
    syncWordSRS,
    getWordProgress,
  };
}
