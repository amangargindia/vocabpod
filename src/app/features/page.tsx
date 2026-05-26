"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

// Animated Forgetting Curve chart (pure SVG/canvas)
function ForgettingCurve() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const pad = { top: 20, right: 20, bottom: 40, left: 40 };
    const innerW = W - pad.left - pad.right;
    const innerH = H - pad.top - pad.bottom;

    // Ebbinghaus retention: R = e^(-t/S), simplified
    const decay = (t: number, strength: number) =>
      Math.exp(-t / strength) * innerH;

    const reviews = [0, 1.5, 4, 9]; // days of review sessions
    const strengths = [2.5, 5, 10, 20, 40]; // increasing memory strength after each review

    function draw(frame: number) {
      ctx!.clearRect(0, 0, W, H);

      // Grid
      ctx!.strokeStyle = "rgba(255,255,255,0.05)";
      ctx!.lineWidth = 1;
      for (let i = 0; i <= 4; i++) {
        const y = pad.top + (innerH / 4) * i;
        ctx!.beginPath();
        ctx!.moveTo(pad.left, y);
        ctx!.lineTo(pad.left + innerW, y);
        ctx!.stroke();
      }

      // Axis labels
      ctx!.fillStyle = "#8E8E93";
      ctx!.font = "11px Inter, sans-serif";
      ctx!.fillText("100%", 2, pad.top + 4);
      ctx!.fillText("0%", 10, pad.top + innerH + 4);
      ctx!.fillText("Days", pad.left + innerW - 20, H - 5);

      const totalDays = 20;
      const visibleDays = Math.min(totalDays, (frame / 120) * totalDays);

      let currentSegment = 0;
      let segmentStart = 0;
      let strength = strengths[0];

      for (let seg = 0; seg < reviews.length; seg++) {
        const nextReview = reviews[seg + 1] ?? totalDays;
        const segEnd = Math.min(nextReview, visibleDays);
        const segStart = reviews[seg];

        if (visibleDays <= segStart) break;

        // Draw decay curve
        const grad = ctx!.createLinearGradient(
          pad.left + (segStart / totalDays) * innerW, 0,
          pad.left + (segEnd / totalDays) * innerW, 0
        );
        grad.addColorStop(0, "rgba(224,75,53,0.8)");
        grad.addColorStop(1, "rgba(224,75,53,0.3)");

        ctx!.beginPath();
        ctx!.strokeStyle = "#E04B35";
        ctx!.lineWidth = 2.5;
        ctx!.shadowBlur = 8;
        ctx!.shadowColor = "#E04B35";

        for (let px = 0; px <= innerW * ((segEnd - segStart) / totalDays); px++) {
          const t = (px / innerW) * totalDays;
          const ret = decay(t, strength);
          const x = pad.left + ((segStart + t) / totalDays) * innerW;
          const y = pad.top + (innerH - ret);
          if (px === 0) ctx!.moveTo(x, y);
          else ctx!.lineTo(x, y);
        }
        ctx!.stroke();
        ctx!.shadowBlur = 0;

        // Review spike — draw vertical recovery line
        if (seg + 1 < reviews.length && visibleDays >= reviews[seg + 1]) {
          const reviewX = pad.left + (reviews[seg + 1] / totalDays) * innerW;
          const decayedY = pad.top + (innerH - decay(reviews[seg + 1] - segStart, strength));
          const recoveredY = pad.top + innerH * 0.05;

          ctx!.beginPath();
          ctx!.strokeStyle = "rgba(224,75,53,0.5)";
          ctx!.setLineDash([4, 4]);
          ctx!.lineWidth = 1.5;
          ctx!.moveTo(reviewX, decayedY);
          ctx!.lineTo(reviewX, recoveredY);
          ctx!.stroke();
          ctx!.setLineDash([]);

          // Review dot
          ctx!.beginPath();
          ctx!.arc(reviewX, recoveredY, 4, 0, Math.PI * 2);
          ctx!.fillStyle = "#E04B35";
          ctx!.fill();

          // Label
          ctx!.fillStyle = "#E04B35";
          ctx!.font = "9px Inter";
          ctx!.fillText("Review", reviewX - 18, recoveredY - 8);
        }

        strength = strengths[seg + 1] ?? strengths[strengths.length - 1];
        segmentStart = segEnd;
      }
    }

    let frame = 0;
    const interval = setInterval(() => {
      frame = Math.min(frame + 1, 120);
      draw(frame);
      if (frame >= 120) clearInterval(interval);
    }, 16);

    return () => clearInterval(interval);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={600}
      height={220}
      className="w-full h-auto rounded-2xl"
      style={{ background: "rgba(255,255,255,0.02)" }}
    />
  );
}

interface SectionProps {
  tag: string;
  title: string;
  description: string;
  detail: string;
  index: number;
  children?: React.ReactNode;
}

function FeatureSection({ tag, title, description, detail, index, children }: SectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.15 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
      style={{ transitionDelay: `${index * 80}ms` }}
    >
      <div className="bg-card-gray border border-white/5 rounded-3xl p-8 space-y-5 hover:border-terracotta/20 transition-all group">
        <div className="flex items-start justify-between">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-terracotta border border-terracotta/30 bg-dark-blush px-3 py-1 rounded-full">
            {tag}
          </span>
        </div>
        <div>
          <h3 className="text-2xl font-black text-light-gray tracking-tight mb-2">{title}</h3>
          <p className="text-muted-ash text-base leading-relaxed">{description}</p>
        </div>
        {children && <div className="pt-2">{children}</div>}
        <p className="text-sm text-light-gray/60 leading-relaxed border-l-2 border-terracotta/30 pl-4">{detail}</p>
      </div>
    </div>
  );
}

const PROMISES = [
  { label: "50+ words", sub: "per month" },
  { label: "2 minutes", sub: "per day" },
  { label: "Active recall", sub: "not passive reading" },
  { label: "Premium access", sub: "₹99/month subscription" },
];

export default function FeaturesPage() {
  const { isPremium, isLoadingAuth } = useAuth();

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-absolute-black text-light-gray font-sans">
<div className="flex-1 min-w-0 pb-[70px] md:pb-0">
        {/* Hero */}
        <section className="relative px-6 py-20 md:px-16 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-terracotta/5 via-transparent to-transparent pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-terracotta/5 blur-[120px] pointer-events-none" />

          <div className="relative z-10 max-w-3xl mx-auto text-center space-y-6">
            <span className="inline-block text-[10px] font-black uppercase tracking-[0.25em] text-terracotta border border-terracotta/30 bg-dark-blush px-4 py-1.5 rounded-full">
              The Science Behind VocabPod
            </span>
            <h1 className="text-5xl md:text-6xl font-black tracking-tight leading-none">
              Why you will<br />actually <span className="text-terracotta">remember</span>
            </h1>
            <p className="text-muted-ash text-lg leading-relaxed max-w-xl mx-auto">
              Most vocabulary apps make you feel busy but forget everything the next week.
              VocabPod uses six proven memory techniques, layered together, so words stick for life.
            </p>
            {!isLoadingAuth && !isPremium ? (
              <Link
                href="/upgrade"
                className="inline-block bg-terracotta text-light-gray font-bold px-8 py-3.5 rounded-full uppercase tracking-widest text-sm hover:shadow-[0_0_30px_rgba(224,75,53,0.4)] hover:-translate-y-0.5 transition-all"
              >
                Upgrade to Premium
              </Link>
            ) : (
              <Link
                href="/"
                className="inline-block bg-white/10 text-light-gray font-bold px-8 py-3.5 rounded-full uppercase tracking-widest text-sm hover:bg-white/20 transition-all"
              >
                Start Learning
              </Link>
            )}
          </div>
        </section>

        {/* Promise bar */}
        <section className="px-6 md:px-16 pb-10">
          <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
            {PROMISES.map(p => (
              <div key={p.label} className="bg-card-gray border border-white/5 rounded-2xl p-5 text-center">
                <span className="text-2xl font-black text-light-gray block">{p.label}</span>
                <span className="text-xs text-muted-ash uppercase tracking-widest font-bold">{p.sub}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Feature sections */}
        <section className="px-6 md:px-16 pb-20 max-w-4xl mx-auto space-y-6">

          <FeatureSection
            index={0}
            tag="Method 01"
            title="Mnemonic Narratives"
            description="Every word has a vivid story attached to it. A bizarre, impossible image that hooks the word's sound to its meaning so firmly that forgetting becomes the hard part."
            detail="Studies show that bizarre imagery encoding increases recall by up to 3x compared to simple definition memorization."
          />

          <FeatureSection
            index={1}
            tag="Method 02"
            title="Spaced Repetition"
            description="Your brain forgets in a predictable curve. VocabPod tracks exactly where you are on that curve for every single word, and resurfaces it at the perfect moment before it disappears."
            detail="Each correct quiz answer pushes the next review further into the future. Each wrong answer brings it right back tomorrow."
          >
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-ash">The Ebbinghaus Forgetting Curve</p>
              <ForgettingCurve />
              <p className="text-xs text-muted-ash/60 text-center">Each vertical spike is a timed review session lifting retention back to near 100%</p>
            </div>
          </FeatureSection>

          <FeatureSection
            index={2}
            tag="Method 03"
            title="Audio Immersion"
            description="You hear the word. You hear it used correctly in a real sentence. Then you hear the mnemonic story narrated. Your brain now has three different audio anchors, not just a definition."
            detail="Auditory processing activates different memory pathways than reading. Combining both creates redundant retrieval routes that survive under stress."
          />

          <FeatureSection
            index={3}
            tag="Method 04"
            title="Contextual Stories"
            description="The word appears again and again in a short story, each time doing a different job in a sentence. By the third sentence, your brain has mapped the word to a social reality, not just a dictionary slot."
            detail="Context-based learning is how children acquire language naturally. VocabPod replicates this for adult vocabulary at high speed."
          />

          <FeatureSection
            index={4}
            tag="Method 05"
            title="Active Recall Quizzes"
            description="Passive reading feels productive but builds almost no lasting memory. Being forced to retrieve the answer - even when you struggle - builds far stronger traces than any amount of re-reading."
            detail="The testing effect is one of the most replicated findings in cognitive psychology. Just attempting to recall, even incorrectly, improves long-term retention dramatically."
          />

          <FeatureSection
            index={5}
            tag="Method 06"
            title="Real-Life Usage Examples"
            description="You hear the word dropped naturally into conversation and writing samples, the way a native speaker would use it, not the way a textbook would. This is the bridge between knowing a word and owning it."
            detail="Transfer-appropriate processing: hearing words in the contexts you will encounter them ensures retrieval in those exact situations."
          />
        </section>

        {/* Footer CTA */}
        <section className="px-6 md:px-16 pb-20">
          <div className="max-w-4xl mx-auto bg-dark-blush border border-terracotta/20 rounded-3xl p-10 text-center space-y-5">
            <h2 className="text-3xl font-black text-light-gray tracking-tight">Ready to own your vocabulary?</h2>
            <p className="text-muted-ash">Start with free words, upgrade when you are ready for all six methods at once.</p>
            {!isLoadingAuth && !isPremium ? (
              <Link
                href="/upgrade"
                className="inline-block bg-terracotta text-light-gray font-bold px-8 py-3.5 rounded-full uppercase tracking-widest text-sm hover:shadow-[0_0_30px_rgba(224,75,53,0.4)] hover:-translate-y-0.5 transition-all"
              >
                Upgrade to Premium
              </Link>
            ) : (
              <Link
                href="/"
                className="inline-block bg-white/10 text-light-gray font-bold px-8 py-3.5 rounded-full uppercase tracking-widest text-sm hover:bg-white/20 transition-all"
              >
                Go to Dashboard
              </Link>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
