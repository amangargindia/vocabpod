"use client";

import Stickman from "@/components/Stickman";
import { useLandingLanguage } from "@/contexts/LandingLanguageContext";

export default function ScienceSection() {
  const { language } = useLandingLanguage();
  return (
    <section id="science" className="py-24 px-6 bg-absolute-black">
      <div className="max-w-5xl mx-auto flex flex-col gap-24">
        
        {/* Header */}
        <div className="text-center">
          <span className="text-xs font-bold uppercase tracking-widest text-terracotta border border-terracotta/20 rounded-full px-4 py-1">
            THE SCIENCE
          </span>
          <h2 className="text-4xl md:text-5xl font-black text-light-gray tracking-tight mt-6">
            {language === 'hi' ? "Roz 5 words. Yahi saccha secret hai." : "5 words a day. That's the whole secret."}
          </h2>
        </div>

        {/* Micro-Habit Stats & The 5 Words A Day Graphs */}
        <div className="flex flex-col gap-12">
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
            {[
              { stat: "5", label: language === 'hi' ? "WORDS / DIN" : "WORDS / DAY" },
              { stat: "150", label: language === 'hi' ? "WORDS / MAHINA" : "WORDS / MONTH" },
              { stat: "2", label: language === 'hi' ? "MIN / SESSION" : "MIN / SESSION" },
              { stat: "5", label: language === 'hi' ? "REVIEWS MEIN YAAD" : "REVIEWS TO PERMANENT" },
            ].map((item, idx) => (
              <div key={idx} className="bg-card-gray rounded-3xl p-6 border border-white/5 flex flex-col items-center justify-center hover:border-terracotta/20 transition-colors">
                <p className="text-4xl font-black text-terracotta mb-2">{item.stat}</p>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-ash">{item.label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Consistent learner */}
            <div className="bg-absolute-black rounded-3xl p-8 border border-emerald-500/15">
              <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 mb-6 text-center">
                {language === 'hi' ? "Roz Seekhne Wala ✓" : "Consistent Learner ✓"}
              </p>
              <svg viewBox="0 0 160 80" className="w-full h-auto">
                {[20, 40, 60, 80].map(y => (
                  <line key={y} x1="0" y1={y} x2="160" y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                ))}
                {[
                  { x: 4, h: 12 },
                  { x: 28, h: 24 },
                  { x: 52, h: 36 },
                  { x: 76, h: 50 },
                  { x: 100, h: 62 },
                  { x: 124, h: 76 },
                ].map(({ x, h }) => (
                  <g key={x}>
                    <rect x={x} y={80 - h} width="18" height={h} rx="3" fill="#10b981" fillOpacity="0.75" />
                    <rect x={x} y={80 - h} width="18" height="3" rx="1.5" fill="#34d399" fillOpacity="0.9" />
                  </g>
                ))}
                <polyline
                  points="13,69 37,57 61,45 85,31 109,19 133,5"
                  fill="none" stroke="#34d399" strokeWidth="1.5" strokeDasharray="4 2" strokeOpacity="0.6"
                />
              </svg>
              <p className="text-sm text-emerald-400 font-bold mt-6 text-center">
                {language === 'hi' ? "150 words bina mehnat ke master kiye" : "150 words mastered effortlessly"}
              </p>
            </div>

            {/* Crammer */}
            <div className="bg-absolute-black rounded-3xl p-8 border border-terracotta/15">
              <p className="text-[10px] font-bold uppercase tracking-widest text-terracotta mb-6 text-center">
                {language === 'hi' ? "Ek Sath Ratta Marne Wala ✗" : "All At Once Crammer ✗"}
              </p>
              <svg viewBox="0 0 160 80" className="w-full h-auto">
                {[20, 40, 60, 80].map(y => (
                  <line key={y} x1="0" y1={y} x2="160" y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                ))}
                <rect x="4" y="4" width="18" height="76" rx="3" fill="#e04b35" fillOpacity="0.75" />
                <rect x="4" y="4" width="18" height="3" rx="1.5" fill="#ff6b4a" fillOpacity="0.9" />
                {[28, 52, 76, 100, 124].map(x => (
                  <g key={x}>
                    <rect x={x} y={72} width="18" height="8" rx="3" fill="#e04b35" fillOpacity="0.2" />
                  </g>
                ))}
                <polyline
                  points="13,5 37,38 61,56 85,67 109,72 133,75"
                  fill="none" stroke="#e04b35" strokeWidth="1.5" strokeDasharray="4 2" strokeOpacity="0.6"
                />
              </svg>
              <p className="text-sm text-terracotta font-bold mt-6 text-center">
                {language === 'hi' ? "Ek hafte mein 80% bhool gaya" : "Forgets 80% within a week"}
              </p>
            </div>
          </div>
        </div>

        {/* The New Enticing Forgetting Curve Section */}
        <div className="flex flex-col items-center py-16 border-y border-white/5 relative overflow-hidden w-full">
          {/* Background glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-64 bg-terracotta/5 blur-[100px] -z-10 rounded-full"></div>
          
          <h3 className="text-3xl md:text-5xl font-black text-light-gray mb-6 text-center max-w-4xl leading-tight tracking-tight">
            {language === 'hi' 
              ? "Hum aapko words baar-baar dikhate hain taaki aap kabhi na bhoolein." 
              : "We show you words again and again to make sure you never forget."}
          </h3>
          <p className="text-muted-ash mb-16 text-center max-w-2xl text-lg leading-relaxed">
            {language === 'hi'
              ? "Traditional learning bahut passive hoti hai. Hamara Spaced Repetition System (SRS) track karta hai ki aapka dimaag word kab bhoolne wala hai, aur thik ussi waqt use yaad dilata hai."
              : "Traditional learning is passive. Our Spaced Repetition System tracks exactly when your brain is about to forget a word, and brings it back to your attention right at that precise moment."}
          </p>

          {/* Ebbinghaus Forgetting Curve SVG Graphic */}
          <div className="relative w-full max-w-4xl bg-card-gray/30 rounded-3xl border border-white/10 p-6 md:p-12 overflow-hidden">
            <div className="flex justify-between items-center mb-8">
              <h4 className="text-lg font-bold text-light-gray tracking-tight uppercase">
                {language === 'hi' ? "The Forgetting Curve" : "The Forgetting Curve"}
              </h4>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-ash">
                   <div className="w-3 h-0.5 bg-terracotta"></div>
                   {language === 'hi' ? "Bina VocabPod Ke" : "Without VocabPod"}
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-emerald-400">
                   <div className="w-3 h-0.5 bg-emerald-400"></div>
                   With Spaced Repetition
                </div>
              </div>
            </div>

            <div className="relative w-full aspect-[2/1] md:aspect-[3/1]">
              <svg viewBox="0 0 1000 400" className="w-full h-full overflow-visible">
                {/* Y-Axis Grid Lines & Labels */}
                {[0, 25, 50, 75, 100].map(pct => {
                  const y = 400 - (pct / 100) * 360;
                  return (
                    <g key={pct}>
                      <line x1="0" y1={y} x2="1000" y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="2" />
                      <text x="-10" y={y + 4} fill="rgba(255,255,255,0.3)" fontSize="14" fontWeight="bold" textAnchor="end">{pct}%</text>
                    </g>
                  );
                })}
                {/* Y-Axis Title */}
                <text x="-40" y="200" fill="rgba(255,255,255,0.5)" fontSize="12" fontWeight="bold" letterSpacing="2" textAnchor="middle" transform="rotate(-90, -40, 200)">
                  MEMORY RETENTION
                </text>

                {/* X-Axis Labels */}
                {[
                  { x: 0, label: "Day 1" },
                  { x: 200, label: "Day 2" },
                  { x: 450, label: "Day 4" },
                  { x: 700, label: "Day 7" },
                  { x: 1000, label: "Permanent" },
                ].map(point => (
                  <text key={point.label} x={point.x} y="390" fill="rgba(255,255,255,0.5)" fontSize="14" fontWeight="bold" textAnchor="middle">
                    {point.label}
                  </text>
                ))}

                {/* Without VocabPod (Red curve fading out completely) */}
                <path 
                  d="M 0 40 C 50 40, 100 200, 250 280 C 400 340, 600 350, 1000 360" 
                  fill="none" 
                  stroke="#e04b35" 
                  strokeWidth="3" 
                  strokeDasharray="8 8"
                  opacity="0.8"
                />

                {/* With Spaced Repetition (Emerald saw-tooth) */}
                <path 
                  d="M 0 40 
                     C 50 40, 100 120, 200 160 
                     L 200 40 
                     C 250 40, 320 80, 450 120
                     L 450 40
                     C 520 40, 600 60, 700 80
                     L 700 40
                     C 800 40, 900 45, 1000 45" 
                  fill="none" 
                  stroke="#34d399" 
                  strokeWidth="4" 
                />

                {/* Nodes on the Spaced Repetition Curve */}
                <circle cx="0" cy="40" r="8" fill="#10b981" />
                <circle cx="200" cy="160" r="6" fill="#10b981" opacity="0.5" />
                <circle cx="200" cy="40" r="8" fill="#10b981" />
                
                <circle cx="450" cy="120" r="6" fill="#10b981" opacity="0.5" />
                <circle cx="450" cy="40" r="8" fill="#10b981" />
                
                <circle cx="700" cy="80" r="6" fill="#10b981" opacity="0.5" />
                <circle cx="700" cy="40" r="8" fill="#10b981" />
                
                <circle cx="1000" cy="45" r="8" fill="#10b981" />

                {/* Review indicators */}
                {[
                  { x: 200, y: 40 },
                  { x: 450, y: 40 },
                  { x: 700, y: 40 },
                ].map(point => (
                  <g key={point.x}>
                    <line x1={point.x} y1="360" x2={point.x} y2={point.y + 15} stroke="rgba(52,211,153,0.3)" strokeWidth="2" strokeDasharray="4 4" />
                    <rect x={point.x - 40} y={point.y - 30} width="80" height="20" rx="10" fill="rgba(52,211,153,0.1)" stroke="#34d399" strokeWidth="1" />
                    <text x={point.x} y={point.y - 16} fill="#34d399" fontSize="10" fontWeight="bold" letterSpacing="1" textAnchor="middle">REVIEW</text>
                  </g>
                ))}

              </svg>
            </div>
            
            <p className="text-center text-sm text-muted-ash mt-8 italic">
              {language === 'hi'
                ? "Har baar jab aap review karte hain, bhoolne ka rate kam ho jata hai jab tak word permanently yaad nahi ho jata."
                : "Every time you review a word, the rate of forgetting decreases until the word is permanently hardwired."}
            </p>
          </div>
        </div>

      </div>
    </section>
  );
}
