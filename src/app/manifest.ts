import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'VocabPod',
    short_name: 'VocabPod',
    description: 'Master advanced vocabulary effortlessly',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#0A0A0A',
    theme_color: '#E04B35',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
      // In production, real 192x192 and 512x512 PNGs should be placed in /public
      // Using generic setup to satisfy PWA requirements
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      }
    ],
  };
}
