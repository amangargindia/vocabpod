"use client";

import Link from "next/link";

const PRINCIPLES = [
  {
    title: "Words, not syllabuses",
    body: "Most vocabulary courses teach you lists. VocabPod teaches you words you will actually hear, use, and remember - because they are attached to a story, a sound, and an image, not a row in a spreadsheet.",
  },
  {
    title: "Cognitive Science Core",
    body: "The platform is built entirely around how human memory actually works. Spaced Repetition, Active Recall, and Dual Coding are not buzzwords here - they are the architecture.",
  },
  {
    title: "Two minutes a day, not two hours",
    body: "You do not need a major lifestyle change. Two focused minutes, done consistently, compounds faster than any binge-study session you have ever done.",
  },
];

const STACK = ["Next.js", "Supabase", "Cloudflare R2", "Razorpay", "Tailwind CSS", "TypeScript"];

export default function AboutPage() {
  return (
    <div className="flex min-h-screen bg-absolute-black text-light-gray font-sans">
<div className="flex-1 min-w-0">
        {/* Hero */}
        <section className="relative px-6 py-24 md:px-16 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-terracotta/5 via-transparent to-transparent pointer-events-none" />
          <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-terracotta/5 blur-[120px] pointer-events-none" />

          <div className="relative z-10 max-w-3xl mx-auto space-y-6">
            <span className="inline-block text-[10px] font-black uppercase tracking-[0.25em] text-terracotta border border-terracotta/30 bg-dark-blush px-4 py-1.5 rounded-full">
              About VocabPod
            </span>
            <h1 className="text-5xl md:text-6xl font-black tracking-tight leading-none">
              Built to make you<br />actually <span className="text-terracotta">remember</span>.
            </h1>
            <p className="text-muted-ash text-lg leading-relaxed max-w-xl">
              VocabPod was created out of frustration with vocabulary apps that feel productive but leave you with nothing two weeks later. Every design decision here is made to counteract exactly that.
            </p>
          </div>
        </section>

        {/* Principles */}
        <section className="px-6 md:px-16 pb-16 max-w-3xl mx-auto space-y-5">
          <h2 className="text-xs font-black uppercase tracking-widest text-muted-ash">What we believe</h2>
          <div className="space-y-4">
            {PRINCIPLES.map((p, i) => (
              <div
                key={i}
                className="bg-card-gray border border-white/5 rounded-3xl p-8 space-y-3 hover:border-terracotta/20 transition-all"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-[10px] font-black text-terracotta border border-terracotta/30 bg-dark-blush px-3 py-1 rounded-full uppercase tracking-widest">
                    0{i + 1}
                  </span>
                  <h3 className="text-xl font-black text-light-gray tracking-tight">{p.title}</h3>
                </div>
                <p className="text-muted-ash leading-relaxed text-sm pl-10">{p.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Technology */}
        <section className="px-6 md:px-16 pb-16 max-w-3xl mx-auto space-y-5">
          <h2 className="text-xs font-black uppercase tracking-widest text-muted-ash">Built with</h2>
          <div className="flex flex-wrap gap-3">
            {STACK.map(s => (
              <span
                key={s}
                className="text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-xl bg-card-gray border border-white/5 text-muted-ash hover:text-light-gray hover:border-white/10 transition-colors"
              >
                {s}
              </span>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="px-6 md:px-16 pb-24 max-w-3xl mx-auto">
          <div className="bg-dark-blush border border-terracotta/20 rounded-3xl p-10 text-center space-y-5">
            <h2 className="text-2xl font-black text-light-gray tracking-tight">Start learning today</h2>
            <p className="text-sm text-muted-ash">50+ words a month, 2 minutes a day.</p>
            <div className="flex items-center justify-center space-x-4">
              <Link
                href="/"
                className="bg-terracotta text-light-gray font-bold px-7 py-3 rounded-full text-sm uppercase tracking-widest hover:shadow-[0_0_25px_rgba(224,75,53,0.4)] hover:-translate-y-0.5 transition-all"
              >
                Go to Dashboard
              </Link>
              <Link
                href="/features"
                className="bg-white/5 border border-white/10 text-light-gray font-bold px-7 py-3 rounded-full text-sm uppercase tracking-widest hover:bg-white/10 transition-all"
              >
                See Features
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
