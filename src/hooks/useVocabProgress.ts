import { useState, useEffect } from "react";
import { getUser, getCloudProgress, saveCloudProgress } from "@/lib/supabase";

// The SRS (Spaced Repetition System) progress data model
export interface UserWordProgress {
  word_slug: string;
  is_completed: boolean;
  quiz_score: number | null; // e.g. 1 for correct, 0 for incorrect
  last_reviewed_at: string | null;
  ease_factor: number; // For SRS future-proofing (default 2.5)
  interval_days: number; // For SRS future-proofing (default 0)
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

export function useVocabProgress() {
  const [stats, setStats] = useState<UserStats>(DEFAULT_STATS);
  const [isLoaded, setIsLoaded] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Load from localStorage or Cloud on mount
  useEffect(() => {
    async function loadProgress() {
      const currentUser = await getUser();
      
      if (currentUser) {
        setUserId(currentUser.id);
        const cloudData = await getCloudProgress();
        if (cloudData && cloudData.length > 0) {
          const list: UserWordProgress[] = cloudData.map(c => ({
            word_slug: c.word_slug,
            is_completed: c.is_completed,
            quiz_score: c.quiz_score,
            last_reviewed_at: c.last_reviewed_at,
            ease_factor: c.ease_factor,
            interval_days: c.interval_days
          }));
          
          setStats(prev => ({
            ...prev,
            totalWordsLearned: list.filter(l => l.is_completed).length,
            progressList: list
          }));
          setIsLoaded(true);
          return;
        }
      }

      // Fallback to local storage
      const saved = localStorage.getItem("vocabpod_progress");
      if (saved) {
        try {
          setStats(JSON.parse(saved));
        } catch (e) {
          console.error("Failed to parse local progress", e);
        }
      }
      setIsLoaded(true);
    }
    
    loadProgress();
  }, []);

  // Save to localStorage whenever stats change (if loaded)
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("vocabpod_progress", JSON.stringify(stats));
    }
  }, [stats, isLoaded]);

  // Mark a word as completed
  const markWordCompleted = async (wordSlug: string, isQuizCorrect: boolean) => {
    // 1. Sync to cloud if user exists
    if (userId) {
      await saveCloudProgress(wordSlug, isQuizCorrect);
    }

    // 2. Update local state (which syncs to localStorage)
    setStats((prev) => {
      const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
      
      // Update streak
      let newStreak = prev.currentStreak;
      if (prev.lastActiveDate !== today) {
        // If yesterday, increment. Otherwise, if older, reset to 1.
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split("T")[0];
        
        if (prev.lastActiveDate === yesterdayStr) {
          newStreak += 1;
        } else {
          newStreak = 1; // reset streak
        }
      }

      // Update word progress list
      const existingList = [...prev.progressList];
      const wordIndex = existingList.findIndex((p) => p.word_slug === wordSlug);

      if (wordIndex >= 0) {
        // Update existing progress
        existingList[wordIndex] = {
          ...existingList[wordIndex],
          is_completed: true,
          quiz_score: isQuizCorrect ? 1 : 0,
          last_reviewed_at: new Date().toISOString(),
          // Simple SRS update logic could go here
        };
      } else {
        // Add new progress
        existingList.push({
          word_slug: wordSlug,
          is_completed: true,
          quiz_score: isQuizCorrect ? 1 : 0,
          last_reviewed_at: new Date().toISOString(),
          ease_factor: 2.5,
          interval_days: 1,
        });
      }

      // Count unique completed words
      const completedCount = existingList.filter((w) => w.is_completed).length;

      return {
        totalWordsLearned: completedCount,
        currentStreak: newStreak,
        lastActiveDate: today,
        progressList: existingList,
      };
    });
  };

  const getWordProgress = (wordSlug: string): UserWordProgress | null => {
    return stats.progressList.find((p) => p.word_slug === wordSlug) || null;
  };

  return {
    stats,
    isLoaded,
    markWordCompleted,
    getWordProgress,
  };
}
