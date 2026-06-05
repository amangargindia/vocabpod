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
          {/* Open book — left page */}
          <path
            d="M4 22 Q4 10 16 10 L16 26 Q10 24 4 26 Z"
            fill="none"
            stroke="#F5F5F7"
            strokeWidth="1.4"
            strokeLinejoin="round"
            opacity="0.85"
          />
          {/* Open book — right page */}
          <path
            d="M28 22 Q28 10 16 10 L16 26 Q22 24 28 26 Z"
            fill="none"
            stroke="#F5F5F7"
            strokeWidth="1.4"
            strokeLinejoin="round"
            opacity="0.85"
          />
          {/* Book spine line */}
          <line x1="16" y1="10" x2="16" y2="26" stroke="#F5F5F7" strokeWidth="1" opacity="0.4" />
          {/* Ball resting in the spine crease */}
          <circle cx="16" cy="14" r="4.5" fill="#E04B35" />
          {/* Shine on ball */}
          <circle cx="14.5" cy="12.5" r="1.2" fill="rgba(255,255,255,0.3)" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
