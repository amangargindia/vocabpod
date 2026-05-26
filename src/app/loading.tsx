export default function Loading() {
  return (
    <div className="flex flex-col min-h-screen bg-absolute-black text-light-gray items-center justify-center space-y-6">
      {/* Clean logo mark — no interactive elements on splash */}
      <svg viewBox="0 0 350 120" className="h-12 w-auto" xmlns="http://www.w3.org/2000/svg">
        <g stroke="#E04B35" strokeWidth="2.5" strokeLinecap="round">
          <path d="M 50 40 L 40 30" strokeDasharray="20" strokeDashoffset="-20">
            <animate attributeName="stroke-dashoffset" values="20;20;20;-20;-20" keyTimes="0;0.2;0.4;0.6;1" dur="3s" repeatCount="indefinite"/>
          </path>
          <path d="M 60 35 L 60 20" strokeDasharray="20" strokeDashoffset="-20">
            <animate attributeName="stroke-dashoffset" values="20;20;20;-20;-20" keyTimes="0;0.2;0.4;0.6;1" dur="3s" repeatCount="indefinite"/>
          </path>
          <path d="M 70 40 L 80 30" strokeDasharray="20" strokeDashoffset="-20">
            <animate attributeName="stroke-dashoffset" values="20;20;20;-20;-20" keyTimes="0;0.2;0.4;0.6;1" dur="3s" repeatCount="indefinite"/>
          </path>
        </g>
        <path d="M 34 35 L 60 80 L 86 35" fill="none" stroke="#F5F5F7" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
          <animate attributeName="d" values="M 34 35 L 60 80 L 86 35;M 34 35 L 60 80 L 86 35;M 16 45 L 60 90 L 104 45;M 34 35 L 60 80 L 86 35;M 34 35 L 60 80 L 86 35" keyTimes="0;0.2;0.4;0.6;1" dur="3s" repeatCount="indefinite" calcMode="spline" keySplines="0.5 0 0.5 1;0.42 0 1 1;0 0 0.58 1;1 0 1 1"/>
        </path>
        <circle cx="60" cy="48" r="10" fill="#E04B35">
          <animate attributeName="cy" values="48;20;65;48;48" keyTimes="0;0.2;0.4;0.6;1" dur="3s" repeatCount="indefinite" calcMode="spline" keySplines="0 0 0.58 1;0.42 0 1 1;0 0 0.58 1;1 0 1 1"/>
        </circle>
        <text x="125" y="74" fill="#F5F5F7" fontFamily="Inter, sans-serif" fontWeight="700" fontSize="36" letterSpacing="-1">VocabPod</text>
      </svg>
      <div className="flex items-center space-x-2">
        <div className="w-2.5 h-2.5 rounded-full bg-terracotta animate-bounce [animation-delay:-0.3s]"></div>
        <div className="w-2.5 h-2.5 rounded-full bg-terracotta animate-bounce [animation-delay:-0.15s]"></div>
        <div className="w-2.5 h-2.5 rounded-full bg-terracotta animate-bounce"></div>
      </div>
      <p className="text-xs font-bold tracking-widest text-muted-ash uppercase animate-pulse">
        Loading...
      </p>
    </div>
  );
}
