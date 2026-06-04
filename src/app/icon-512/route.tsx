import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 512,
          height: 512,
          background: '#0A0A0A',
          borderRadius: 108,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        <svg
          width="512"
          height="512"
          viewBox="0 0 512 512"
          style={{ position: 'absolute', top: 0, left: 0 }}
        >
          <rect width="512" height="512" rx="108" fill="#0A0A0A" />
          {/* Outer V — faint */}
          <polyline
            points="60,148 256,395 452,148"
            fill="none"
            stroke="#F5F5F7"
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.25"
          />
          {/* Middle V */}
          <polyline
            points="100,148 256,360 412,148"
            fill="none"
            stroke="#F5F5F7"
            strokeWidth="10"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.6"
          />
          {/* Main bold V */}
          <polyline
            points="150,148 256,320 362,148"
            fill="none"
            stroke="#F5F5F7"
            strokeWidth="24"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Terracotta circle */}
          <circle cx="256" cy="215" r="48" fill="#E04B35" />
          {/* Radiating lines */}
          <line x1="214" y1="162" x2="184" y2="125" stroke="#E04B35" strokeWidth="10" strokeLinecap="round" />
          <line x1="256" y1="148" x2="256" y2="102" stroke="#E04B35" strokeWidth="10" strokeLinecap="round" />
          <line x1="298" y1="162" x2="328" y2="125" stroke="#E04B35" strokeWidth="10" strokeLinecap="round" />
        </svg>
      </div>
    ),
    { width: 512, height: 512 }
  );
}
