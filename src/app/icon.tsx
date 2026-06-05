import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          background: '#0A0A0A',
          borderRadius: 7,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg width="32" height="32" viewBox="0 0 32 32">
          <rect width="32" height="32" rx="7" fill="#0A0A0A" />
          {/* Outer V faint */}
          <polyline
            points="4,10 16,26 28,10"
            fill="none"
            stroke="#F5F5F7"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.4"
          />
          {/* Main V */}
          <polyline
            points="7,10 16,22 25,10"
            fill="none"
            stroke="#F5F5F7"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Circle */}
          <circle cx="16" cy="13" r="4" fill="#E04B35" />
          {/* Rays */}
          <line x1="10" y1="8" x2="7" y2="5" stroke="#E04B35" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="16" y1="7" x2="16" y2="3" stroke="#E04B35" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="22" y1="8" x2="25" y2="5" stroke="#E04B35" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
