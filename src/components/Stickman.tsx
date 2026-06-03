"use client";

import React from "react";
import { cleanSvgString } from "@/lib/svgUtils";

export type StickmanPose =
  | "standing" | "running" | "jumping" | "thinking" | "sitting"
  | "pointing" | "waving" | "lifting" | "falling" | "dancing"
  | "leaning" | "stretching" | "kicking" | "climbing" | "reading";

interface StickmanProps {
  pose: StickmanPose | string;
  className?: string;
  headColor?: string;
  size?: number;
}

const POSES: Record<StickmanPose, React.ReactNode> = {
  standing: (
    <>
      <path d="M50 40 L50 75" strokeWidth="4" strokeLinecap="round" /> {/* Body */}
      <path d="M50 45 L30 65 M50 45 L70 65" strokeWidth="4" strokeLinecap="round" /> {/* Arms */}
      <path d="M50 75 L35 100 M50 75 L65 100" strokeWidth="4" strokeLinecap="round" /> {/* Legs */}
    </>
  ),
  running: (
    <>
      <path d="M50 40 L55 70" strokeWidth="4" strokeLinecap="round" />
      <path d="M52 45 L70 50 L80 40 M52 45 L35 55 L25 45" strokeWidth="4" strokeLinecap="round" />
      <path d="M55 70 L40 85 L20 85 M55 70 L70 90 L60 100" strokeWidth="4" strokeLinecap="round" />
    </>
  ),
  jumping: (
    <>
      <path d="M50 35 L50 65" strokeWidth="4" strokeLinecap="round" />
      <path d="M50 40 L30 25 M50 40 L70 25" strokeWidth="4" strokeLinecap="round" />
      <path d="M50 65 L35 85 L35 100 M50 65 L65 85 L65 100" strokeWidth="4" strokeLinecap="round" />
    </>
  ),
  thinking: (
    <>
      <path d="M50 40 L50 75" strokeWidth="4" strokeLinecap="round" />
      <path d="M50 45 L35 55 L45 25" strokeWidth="4" strokeLinecap="round" /> {/* Arm touching head */}
      <path d="M50 45 L70 65" strokeWidth="4" strokeLinecap="round" />
      <path d="M50 75 L35 100 M50 75 L65 100" strokeWidth="4" strokeLinecap="round" />
    </>
  ),
  sitting: (
    <>
      <path d="M50 40 L50 70" strokeWidth="4" strokeLinecap="round" />
      <path d="M50 45 L65 65" strokeWidth="4" strokeLinecap="round" />
      <path d="M50 45 L35 65" strokeWidth="4" strokeLinecap="round" />
      <path d="M50 70 L75 70 L75 100" strokeWidth="4" strokeLinecap="round" />
      <path d="M50 70 L40 100" strokeWidth="4" strokeLinecap="round" />
    </>
  ),
  pointing: (
    <>
      <path d="M50 40 L50 75" strokeWidth="4" strokeLinecap="round" />
      <path d="M50 45 L30 65 M50 45 L85 40" strokeWidth="4" strokeLinecap="round" />
      <path d="M50 75 L35 100 M50 75 L65 100" strokeWidth="4" strokeLinecap="round" />
    </>
  ),
  waving: (
    <>
      <path d="M50 40 L50 75" strokeWidth="4" strokeLinecap="round" />
      <path d="M50 45 L30 65 M50 45 L70 20 L80 25" strokeWidth="4" strokeLinecap="round" />
      <path d="M50 75 L35 100 M50 75 L65 100" strokeWidth="4" strokeLinecap="round" />
    </>
  ),
  lifting: (
    <>
      <path d="M50 40 L50 70" strokeWidth="4" strokeLinecap="round" />
      <path d="M50 45 L30 20 M50 45 L70 20" strokeWidth="4" strokeLinecap="round" />
      <path d="M20 20 L80 20" strokeWidth="6" strokeLinecap="round" /> {/* Barbell */}
      <path d="M50 70 L35 100 M50 70 L65 100" strokeWidth="4" strokeLinecap="round" />
    </>
  ),
  falling: (
    <>
      <path d="M50 40 L60 70" strokeWidth="4" strokeLinecap="round" />
      <path d="M53 45 L80 30 M53 45 L20 20" strokeWidth="4" strokeLinecap="round" />
      <path d="M60 70 L40 90 M60 70 L80 100" strokeWidth="4" strokeLinecap="round" />
    </>
  ),
  dancing: (
    <>
      <path d="M50 40 L55 70" strokeWidth="4" strokeLinecap="round" />
      <path d="M52 45 L30 25 M52 45 L80 60" strokeWidth="4" strokeLinecap="round" />
      <path d="M55 70 L35 90 L20 80 M55 70 L75 90 L70 100" strokeWidth="4" strokeLinecap="round" />
    </>
  ),
  leaning: (
    <>
      <path d="M40 40 L30 75" strokeWidth="4" strokeLinecap="round" />
      <path d="M37 45 L20 60 L20 75 M37 45 L50 55 L50 70" strokeWidth="4" strokeLinecap="round" />
      <path d="M30 75 L35 100 M30 75 L15 100" strokeWidth="4" strokeLinecap="round" />
      <path d="M70 10 L70 100" strokeWidth="4" strokeLinecap="round" /> {/* Wall */}
    </>
  ),
  stretching: (
    <>
      <path d="M50 40 L50 75" strokeWidth="4" strokeLinecap="round" />
      <path d="M50 45 L15 45 M50 45 L85 45" strokeWidth="4" strokeLinecap="round" />
      <path d="M50 75 L20 100 M50 75 L80 100" strokeWidth="4" strokeLinecap="round" />
    </>
  ),
  kicking: (
    <>
      <path d="M50 40 L45 75" strokeWidth="4" strokeLinecap="round" />
      <path d="M48 45 L30 65 M48 45 L70 55" strokeWidth="4" strokeLinecap="round" />
      <path d="M45 75 L35 100 M45 75 L90 60" strokeWidth="4" strokeLinecap="round" />
    </>
  ),
  climbing: (
    <>
      <path d="M50 40 L50 75" strokeWidth="4" strokeLinecap="round" />
      <path d="M50 45 L30 20 M50 45 L70 40" strokeWidth="4" strokeLinecap="round" />
      <path d="M50 75 L30 90 M50 75 L70 100" strokeWidth="4" strokeLinecap="round" />
      <path d="M20 10 L20 100" strokeWidth="2" strokeDasharray="4 4" /> {/* Ladder */}
      <path d="M80 10 L80 100" strokeWidth="2" strokeDasharray="4 4" />
    </>
  ),
  reading: (
    <>
      <path d="M50 40 L50 75" strokeWidth="4" strokeLinecap="round" />
      <path d="M50 45 L35 55 M50 45 L65 55" strokeWidth="4" strokeLinecap="round" />
      <path d="M50 75 L35 100 M50 75 L65 100" strokeWidth="4" strokeLinecap="round" />
      <path d="M25 55 L75 55 L75 65 L25 65 Z" strokeWidth="2" fill="currentColor" /> {/* Book */}
    </>
  ),
};

export const STICKMAN_POSES = Object.keys(POSES) as StickmanPose[];

let cachedCustomStickmans: Record<string, string> | null = null;
let fetchPromise: Promise<any> | null = null;

export default function Stickman({ pose, className = "w-24 h-24", headColor = "var(--color-terracotta)", size }: StickmanProps) {
  const isCustom = !POSES[pose as StickmanPose];
  const [customSvg, setCustomSvg] = React.useState<string | null>(cachedCustomStickmans ? cachedCustomStickmans[pose] : null);

  React.useEffect(() => {
    if (isCustom && !cachedCustomStickmans) {
      if (!fetchPromise) {
        fetchPromise = fetch("/api/stickmans")
          .then(r => r.json())
          .then(data => {
            const cache: Record<string, string> = {};
            data.stickmans?.forEach((s: any) => {
              cache[s.name] = s.svg_code;
            });
            cachedCustomStickmans = cache;
            return cache;
          })
          .catch(() => ({}));
      }
      fetchPromise.then(dict => {
        setCustomSvg(dict[pose] || null);
      });
    } else if (isCustom && cachedCustomStickmans) {
      setCustomSvg(cachedCustomStickmans[pose] || null);
    }
  }, [pose, isCustom]);

  return (
    <svg viewBox="0 0 100 120" className={className} stroke="currentColor" fill="none" style={size ? { width: size, height: size } : undefined}>
      <circle cx="50" cy="20" r="10" fill={headColor} stroke="none" />
      {isCustom ? (
        customSvg ? <g dangerouslySetInnerHTML={{ __html: cleanSvgString(customSvg) }} /> : null
      ) : (
        POSES[pose as StickmanPose]
      )}
    </svg>
  );
}
