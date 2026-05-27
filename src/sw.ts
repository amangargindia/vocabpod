// @ts-nocheck
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    {
      // Audio Cache Strategy: Max 20 files to save space
      matcher: /^https:\/\/pub-4c8c5569f34b4ca39b63527fb351a229\.r2\.dev\/.*\.mp3$/,
      handler: "CacheFirst",
      options: {
        cacheName: "vocabpod-audio",
        expiration: {
          maxEntries: 20,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        },
      },
    },
    {
      // Image/Mnemonic Cache Strategy
      matcher: /^https:\/\/pub-4c8c5569f34b4ca39b63527fb351a229\.r2\.dev\/.*\.svg$/,
      handler: "CacheFirst",
      options: {
        cacheName: "vocabpod-images",
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 30 * 24 * 60 * 60,
        },
      },
    },
    {
      // API Cache Strategy: Offline fallback for database words
      matcher: ({ request }) => request.url.includes("/api/words") && request.method === "GET",
      handler: "NetworkFirst",
      options: {
        cacheName: "vocabpod-api-words",
        networkTimeoutSeconds: 3,
      },
    },
    {
      // Catch-all API caching for GET requests (Profile, Leaderboard)
      matcher: ({ request }) => request.url.includes("/api/") && request.method === "GET",
      handler: "NetworkFirst",
      options: {
        cacheName: "vocabpod-api-other",
        networkTimeoutSeconds: 3,
      },
    }
  ],
});

serwist.addEventListeners();
