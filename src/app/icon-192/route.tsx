import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 192,
          height: 192,
          background: '#0A0A0A',
          borderRadius: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        <svg
          width="192"
          height="192"
          viewBox="0 0 192 192"
          style={{ position: 'absolute', top: 0, left: 0 }}
        >
          <rect width="192" height="192" rx="40" fill="#0A0A0A" />
          {/* Outer V — faint */}
          <polyline
            points="24,55 96,148 168,55"
            fill="none"
            stroke="#F5F5F7"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.25"
          />
          {/* Middle V */}
          <polyline
            points="38,55 96,135 154,55"
            fill="none"
            stroke="#F5F5F7"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.6"
          />
          {/* Main bold V */}
          <polyline
            points="56,55 96,120 136,55"
            fill="none"
            stroke="#F5F5F7"
            strokeWidth="9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Terracotta circle */}
          <circle cx="96" cy="80" r="18" fill="#E04B35" />
          {/* Radiating lines */}
          <line x1="80" y1="60" x2="68" y2="46" stroke="#E04B35" strokeWidth="4" strokeLinecap="round" />
          <line x1="96" y1="55" x2="96" y2="38" stroke="#E04B35" strokeWidth="4" strokeLinecap="round" />
          <line x1="112" y1="60" x2="124" y2="46" stroke="#E04B35" strokeWidth="4" strokeLinecap="round" />
        </svg>
      </div>
    ),
    { width: 192, height: 192 }
  );
}
