export default function Loading() {
  return (
    <div className="flex flex-col min-h-screen bg-absolute-black text-light-gray items-center justify-center space-y-8">
      {/* Animated splash — stickman reading a book with bouncing ball logo */}
      <div className="relative flex flex-col items-center gap-6">

        {/* Stickman animation */}
        <svg viewBox="0 0 120 160" className="w-32 h-40" xmlns="http://www.w3.org/2000/svg">
          {/* Background glow */}
          <circle cx="60" cy="30" r="28" fill="rgba(224,75,53,0.08)">
            <animate attributeName="r" values="28;32;28" dur="2s" repeatCount="indefinite" />
          </circle>

          {/* Head */}
          <circle cx="60" cy="30" r="16" fill="#E04B35" />
          {/* Ears */}
          <ellipse cx="44" cy="30" rx="3.5" ry="4.5" fill="#C93E2A" />
          <ellipse cx="76" cy="30" rx="3.5" ry="4.5" fill="#C93E2A" />
          {/* Eyes — blinking */}
          <ellipse cx="53" cy="27" rx="3" ry="3" fill="white">
            <animate attributeName="ry" values="3;0.3;3" keyTimes="0;0.5;1" dur="3.5s" repeatCount="indefinite" />
          </ellipse>
          <ellipse cx="67" cy="27" rx="3" ry="3" fill="white">
            <animate attributeName="ry" values="3;0.3;3" keyTimes="0;0.5;1" dur="3.5s" repeatCount="indefinite" />
          </ellipse>
          {/* Pupils */}
          <circle cx="54" cy="27" r="1.5" fill="#1a0a06">
            <animate attributeName="cy" values="27;28;27" dur="3.5s" repeatCount="indefinite" />
          </circle>
          <circle cx="68" cy="27" r="1.5" fill="#1a0a06">
            <animate attributeName="cy" values="27;28;27" dur="3.5s" repeatCount="indefinite" />
          </circle>
          {/* Smile */}
          <path d="M53 34 Q60 42 67 34" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          {/* Cheeks */}
          <ellipse cx="48" cy="36" rx="5" ry="3.5" fill="rgba(255,255,255,0.2)" />
          <ellipse cx="72" cy="36" rx="5" ry="3.5" fill="rgba(255,255,255,0.2)" />

          {/* Body */}
          <path d="M60 46 L60 95" stroke="#E04B35" strokeWidth="5" strokeLinecap="round" />

          {/* Left arm — holds book, moves slightly */}
          <path d="M60 60 Q48 70 40 82" stroke="#E04B35" strokeWidth="4.5" strokeLinecap="round">
            <animate attributeName="d" values="M60 60 Q48 70 40 82;M60 60 Q46 72 38 84;M60 60 Q48 70 40 82" dur="2s" repeatCount="indefinite" calcMode="spline" keySplines="0.42 0 0.58 1;0.42 0 0.58 1" />
          </path>
          {/* Right arm — waves */}
          <path d="M60 60 Q72 48 80 35" stroke="#E04B35" strokeWidth="4.5" strokeLinecap="round">
            <animate attributeName="d" values="M60 60 Q72 48 80 35;M60 60 Q75 44 84 30;M60 60 Q72 48 80 35" dur="1.5s" repeatCount="indefinite" calcMode="spline" keySplines="0.42 0 0.58 1;0.42 0 0.58 1" />
          </path>

          {/* Legs — walking motion */}
          <path d="M60 95 Q55 112 52 130" stroke="#E04B35" strokeWidth="5" strokeLinecap="round">
            <animate attributeName="d" values="M60 95 Q55 112 52 130;M60 95 Q58 112 56 130;M60 95 Q55 112 52 130" dur="1s" repeatCount="indefinite" calcMode="spline" keySplines="0.42 0 0.58 1;0.42 0 0.58 1" />
          </path>
          <path d="M52 130 Q48 136 44 135" stroke="#E04B35" strokeWidth="4" strokeLinecap="round">
            <animate attributeName="d" values="M52 130 Q48 136 44 135;M56 130 Q54 136 50 135;M52 130 Q48 136 44 135" dur="1s" repeatCount="indefinite" calcMode="spline" keySplines="0.42 0 0.58 1;0.42 0 0.58 1" />
          </path>
          <path d="M60 95 Q65 112 68 130" stroke="#E04B35" strokeWidth="5" strokeLinecap="round">
            <animate attributeName="d" values="M60 95 Q65 112 68 130;M60 95 Q62 112 64 130;M60 95 Q65 112 68 130" dur="1s" repeatCount="indefinite" calcMode="spline" keySplines="0.42 0 0.58 1;0.42 0 0.58 1" />
          </path>
          <path d="M68 130 Q72 136 76 135" stroke="#E04B35" strokeWidth="4" strokeLinecap="round">
            <animate attributeName="d" values="M68 130 Q72 136 76 135;M64 130 Q66 136 70 135;M68 130 Q72 136 76 135" dur="1s" repeatCount="indefinite" calcMode="spline" keySplines="0.42 0 0.58 1;0.42 0 0.58 1" />
          </path>

          {/* Shadow */}
          <ellipse cx="60" cy="148" rx="22" ry="4" fill="rgba(224,75,53,0.1)">
            <animate attributeName="rx" values="22;20;22" dur="1s" repeatCount="indefinite" />
          </ellipse>

          {/* Sparkles */}
          <path d="M15 20 Q18 20 18 17 Q18 20 21 20 Q18 20 18 23 Q18 20 15 20 Z" fill="#FFD700" opacity="0.7">
            <animate attributeName="opacity" values="0.7;0;0.7" dur="1.8s" repeatCount="indefinite" />
          </path>
          <path d="M95 35 Q97 35 97 33 Q97 35 99 35 Q97 35 97 37 Q97 35 95 35 Z" fill="#FFD700" opacity="0.9">
            <animate attributeName="opacity" values="0.9;0;0.9" dur="1.4s" repeatCount="indefinite" />
          </path>
        </svg>

        {/* VocabPod logo */}
        <svg viewBox="0 0 350 60" className="h-10 w-auto" xmlns="http://www.w3.org/2000/svg">
          {/* Open book icon */}
          <path d="M20 46 Q20 26 36 24 L36 48 Q28 46 20 48 Z" fill="none" stroke="#F5F5F7" strokeWidth="2" strokeLinejoin="round" opacity="0.85" />
          <path d="M52 46 Q52 26 36 24 L36 48 Q44 46 52 48 Z" fill="none" stroke="#F5F5F7" strokeWidth="2" strokeLinejoin="round" opacity="0.85" />
          <line x1="36" y1="24" x2="36" y2="48" stroke="#F5F5F7" strokeWidth="1" opacity="0.4" />
          <circle cx="36" cy="30" r="5.5" fill="#E04B35">
            <animate attributeName="cy" values="30;27;30" dur="1.5s" repeatCount="indefinite" calcMode="spline" keySplines="0.42 0 0.58 1;0.42 0 0.58 1" />
          </circle>
          <circle cx="34.5" cy="28" r="1.5" fill="rgba(255,255,255,0.3)">
            <animate attributeName="cy" values="28;25;28" dur="1.5s" repeatCount="indefinite" calcMode="spline" keySplines="0.42 0 0.58 1;0.42 0 0.58 1" />
          </circle>
          {/* Text */}
          <text x="70" y="44" fill="#F5F5F7" fontFamily="Inter, system-ui, sans-serif" fontWeight="800" fontSize="32" letterSpacing="-1">VocabPod</text>
        </svg>
      </div>

      <p className="text-xs font-bold tracking-[0.3em] text-muted-ash/70 uppercase animate-pulse">
        Loading your words...
      </p>
    </div>
  );
}
