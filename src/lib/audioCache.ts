const CACHE_NAME = "vocabpod-audio-v1";

/**
 * Fetches audio from cache or network, storing in Cache API on first fetch.
 * Returns an object URL safe to use as <audio> src.
 */
export async function getCachedAudio(url: string): Promise<string> {
  if (typeof window === "undefined" || !("caches" in window)) {
    return url; // SSR or unsupported browser — use URL directly
  }

  try {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(url);

    if (cached) {
      const blob = await cached.blob();
      return URL.createObjectURL(blob);
    }

    // Not cached — fetch and store
    const response = await fetch(url);
    if (!response.ok) throw new Error("Audio fetch failed");

    // Cache a clone; use the original to return
    await cache.put(url, response.clone());
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch (e) {
    console.warn("Audio cache error, falling back to direct URL:", e);
    return url;
  }
}

/**
 * Pre-fetches and caches a single audio URL without returning anything.
 * Use for background pre-loading of the next word in Autoplay.
 */
export async function prefetchAudio(url: string): Promise<void> {
  if (typeof window === "undefined" || !("caches" in window)) return;
  try {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(url);
    if (!cached) {
      const response = await fetch(url);
      if (response.ok) await cache.put(url, response);
    }
  } catch (e) {
    console.warn("Audio prefetch error:", e);
  }
}

/**
 * Clears all cached audio. Call this on logout or when premium access is revoked.
 */
export async function clearAudioCache(): Promise<void> {
  if (typeof window === "undefined" || !("caches" in window)) return;
  try {
    await caches.delete(CACHE_NAME);
  } catch (e) {
    console.warn("Failed to clear audio cache:", e);
  }
}
