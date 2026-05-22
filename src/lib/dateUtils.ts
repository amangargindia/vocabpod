/**
 * IST (Asia/Kolkata, UTC+5:30) date utilities.
 * All daily resets in VocabPod are keyed to IST midnight.
 *
 * We compute IST by manually adding the UTC+5:30 offset (19800 seconds)
 * rather than relying on Intl/toLocaleString, which behaves differently
 * across server vs browser environments and can't be safely round-tripped
 * through the Date constructor.
 */

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // 5h 30m

/** Returns the current date in IST as "YYYY-MM-DD". Resets at 12:00 AM IST. */
export function getTodayIST(): string {
  return new Date(Date.now() + IST_OFFSET_MS).toISOString().split("T")[0];
}

/** Returns yesterday's date in IST as "YYYY-MM-DD". */
export function getYesterdayIST(): string {
  return new Date(Date.now() + IST_OFFSET_MS - 86_400_000).toISOString().split("T")[0];
}

/**
 * Converts a UTC ISO string (e.g. from Supabase timestamptz) to an IST date string.
 * Use this whenever comparing a stored timestamp against an IST calendar date.
 */
export function toISTDateString(utcIso: string): string {
  return new Date(new Date(utcIso).getTime() + IST_OFFSET_MS)
    .toISOString()
    .split("T")[0];
}
