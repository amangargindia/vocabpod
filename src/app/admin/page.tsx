"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { insertWordLesson } from "@/lib/supabase";

export default function AdminPortal() {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  // Form State
  const [word, setWord] = useState("");
  const [phonetic, setPhonetic] = useState("");
  const [type, setType] = useState("adjective");
  const [definition, setDefinition] = useState("");
  const [narrative, setNarrative] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  
  const [svgJson, setSvgJson] = useState('[\n  {"tag": "circle", "props": {"cx": "200", "cy": "150", "r": "20", "fill": "#E04B35"}}\n]');
  
  const [question, setQuestion] = useState("");
  const [opt1, setOpt1] = useState("");
  const [opt2, setOpt2] = useState("");
  const [opt3, setOpt3] = useState("");
  const [opt4, setOpt4] = useState("");
  const [correctOpt, setCorrectOpt] = useState(1);
  const [explanation, setExplanation] = useState("");

  // Security Check
  useEffect(() => {
    const auth = localStorage.getItem("vocabpod_admin_auth");
    if (auth !== "true") {
      window.location.href = "/";
    } else {
      setIsAuthorized(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage({ text: "", type: "" });

    try {
      if (!audioFile) {
        throw new Error("Please select an audio file first.");
      }

      let parsedSvg;
      try {
        parsedSvg = JSON.parse(svgJson);
      } catch (err) {
        throw new Error("Invalid SVG JSON array format.");
      }

      setMessage({ text: "Uploading Audio...", type: "info" });
      
      // 1. Get Presigned URL
      const ext = audioFile.name.split(".").pop();
      const filename = `audio/${word.toLowerCase().replace(/[^a-z0-9]/g, '')}-${Date.now()}.${ext}`;
      
      const presignRes = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename, contentType: audioFile.type })
      });
      
      if (!presignRes.ok) throw new Error("Failed to get upload URL");
      
      const { uploadUrl, finalUrl } = await presignRes.json();

      // 2. Upload to Cloudflare R2
      if (uploadUrl !== "fallback-mode") {
        const uploadRes = await fetch(uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": audioFile.type },
          body: audioFile
        });
        
        if (!uploadRes.ok) throw new Error("Failed to upload file to Cloudflare");
      }

      setMessage({ text: "Audio Uploaded. Saving to Database...", type: "info" });

      // 3. Save to Supabase
      const payload = {
        word,
        phonetic,
        type,
        definition,
        narrative,
        audio_url: finalUrl,
        svg_elements: parsedSvg,
        quiz_questions: [
          {
            question,
            options: [
              { text: opt1, isCorrect: correctOpt === 1 },
              { text: opt2, isCorrect: correctOpt === 2 },
              { text: opt3, isCorrect: correctOpt === 3 },
              { text: opt4, isCorrect: correctOpt === 4 },
            ],
            explanation
          }
        ]
      };

      await insertWordLesson(payload);
      
      setMessage({ text: "Success! Word lesson inserted.", type: "success" });
      
      // Clear form
      setWord(""); setPhonetic(""); setDefinition(""); setNarrative("");
      setAudioFile(null); setQuestion(""); setOpt1(""); setOpt2(""); 
      setOpt3(""); setOpt4(""); setExplanation("");
      
    } catch (err: any) {
      setMessage({ text: err.message || "Failed to submit.", type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("vocabpod_admin_auth");
    window.location.href = "/";
  };

  if (!isAuthorized) return null; // Hide until checked

  return (
    <div className="min-h-screen bg-absolute-black text-light-gray font-sans selection:bg-terracotta/20 selection:text-terracotta pb-20">
      
      {/* Admin Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-absolute-black/80 border-b border-terracotta/20 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-terracotta font-black tracking-tight text-xl">VocabPod Admin</span>
            <span className="text-xs font-bold bg-terracotta/20 text-terracotta px-2 py-0.5 rounded uppercase tracking-widest">
              Backdoor Access
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/" className="text-xs font-semibold text-muted-ash hover:text-light-gray">
              View Site &rarr;
            </Link>
            <button onClick={handleLogout} className="text-xs font-bold border border-white/10 px-4 py-2 rounded-full hover:bg-white/5 transition-colors">
              EXIT PORTAL
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold tracking-tight mb-8">Content Entry System</h1>

        {message.text && (
          <div className={`p-4 rounded-xl mb-8 border font-bold text-sm ${
            message.type === 'success' 
              ? 'bg-emerald-950/30 text-emerald-400 border-emerald-500/30' 
              : 'bg-dark-blush text-terracotta border-terracotta/30'
          }`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-12">
          
          {/* Core Info */}
          <section className="bg-card-gray border border-white/5 p-8 rounded-3xl space-y-6 shadow-xl">
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-ash border-b border-white/5 pb-2">1. Core Metadata</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-ash uppercase">Word</label>
                <input required value={word} onChange={e => setWord(e.target.value)} className="w-full bg-deep-canvas border border-white/10 rounded-xl p-3 focus:outline-none focus:border-terracotta/50" placeholder="e.g. Luminous" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-ash uppercase">Phonetic</label>
                <input required value={phonetic} onChange={e => setPhonetic(e.target.value)} className="w-full bg-deep-canvas border border-white/10 rounded-xl p-3 focus:outline-none focus:border-terracotta/50" placeholder="/ˈluːmɪnəs/" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-ash uppercase">Part of Speech</label>
              <select value={type} onChange={e => setType(e.target.value)} className="w-full bg-deep-canvas border border-white/10 rounded-xl p-3 focus:outline-none focus:border-terracotta/50 appearance-none">
                <option value="adjective">Adjective</option>
                <option value="noun">Noun</option>
                <option value="verb">Verb</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-ash uppercase">Definition</label>
              <textarea required value={definition} onChange={e => setDefinition(e.target.value)} className="w-full bg-deep-canvas border border-white/10 rounded-xl p-3 focus:outline-none focus:border-terracotta/50 min-h-[80px]" placeholder="Brief, dictionary definition..." />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-ash uppercase">Mnemonic Narrative</label>
              <textarea required value={narrative} onChange={e => setNarrative(e.target.value)} className="w-full bg-deep-canvas border border-white/10 rounded-xl p-3 focus:outline-none focus:border-terracotta/50 min-h-[120px]" placeholder="The story connecting the word to the visual anchor..." />
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-ash uppercase">Audio File (.mp3)</label>
              <input 
                required 
                type="file" 
                accept="audio/*" 
                onChange={e => setAudioFile(e.target.files?.[0] || null)} 
                className="w-full bg-deep-canvas border border-white/10 rounded-xl p-3 text-light-gray file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-terracotta file:text-light-gray hover:file:bg-terracotta/80 cursor-pointer focus:outline-none focus:border-terracotta/50" 
              />
            </div>
          </section>

          {/* SVG Setup */}
          <section className="bg-card-gray border border-white/5 p-8 rounded-3xl space-y-6 shadow-xl">
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-ash border-b border-white/5 pb-2">2. Visual Anchor (JSONB Vector)</h2>
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-ash uppercase">Raw SVG Nodes Array</label>
              <textarea required value={svgJson} onChange={e => setSvgJson(e.target.value)} className="w-full bg-deep-canvas border border-white/10 rounded-xl p-3 focus:outline-none focus:border-terracotta/50 font-mono text-xs text-terracotta min-h-[200px]" />
              <p className="text-xs text-muted-ash mt-2">Array of objects: <code className="text-white/50">{`[{ "tag": "path", "props": { "d": "..." } }]`}</code></p>
            </div>
          </section>

          {/* Quiz Setup */}
          <section className="bg-card-gray border border-white/5 p-8 rounded-3xl space-y-6 shadow-xl">
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-ash border-b border-white/5 pb-2">3. Active Recall Quiz</h2>
            
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-ash uppercase">Question</label>
              <input required value={question} onChange={e => setQuestion(e.target.value)} className="w-full bg-deep-canvas border border-white/10 rounded-xl p-3 focus:outline-none focus:border-terracotta/50" placeholder="Which scenario best describes..." />
            </div>

            <div className="space-y-4">
              <label className="text-xs font-bold text-muted-ash uppercase">Options (Select Correct Answer)</label>
              
              <div className="flex items-center space-x-4">
                <input type="radio" checked={correctOpt === 1} onChange={() => setCorrectOpt(1)} className="w-5 h-5 accent-terracotta cursor-pointer" />
                <input required value={opt1} onChange={e => setOpt1(e.target.value)} className="flex-1 bg-deep-canvas border border-white/10 rounded-xl p-3 focus:outline-none focus:border-terracotta/50" placeholder="Option A" />
              </div>
              <div className="flex items-center space-x-4">
                <input type="radio" checked={correctOpt === 2} onChange={() => setCorrectOpt(2)} className="w-5 h-5 accent-terracotta cursor-pointer" />
                <input required value={opt2} onChange={e => setOpt2(e.target.value)} className="flex-1 bg-deep-canvas border border-white/10 rounded-xl p-3 focus:outline-none focus:border-terracotta/50" placeholder="Option B" />
              </div>
              <div className="flex items-center space-x-4">
                <input type="radio" checked={correctOpt === 3} onChange={() => setCorrectOpt(3)} className="w-5 h-5 accent-terracotta cursor-pointer" />
                <input required value={opt3} onChange={e => setOpt3(e.target.value)} className="flex-1 bg-deep-canvas border border-white/10 rounded-xl p-3 focus:outline-none focus:border-terracotta/50" placeholder="Option C" />
              </div>
              <div className="flex items-center space-x-4">
                <input type="radio" checked={correctOpt === 4} onChange={() => setCorrectOpt(4)} className="w-5 h-5 accent-terracotta cursor-pointer" />
                <input required value={opt4} onChange={e => setOpt4(e.target.value)} className="flex-1 bg-deep-canvas border border-white/10 rounded-xl p-3 focus:outline-none focus:border-terracotta/50" placeholder="Option D" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-ash uppercase">Explanation Text</label>
              <textarea required value={explanation} onChange={e => setExplanation(e.target.value)} className="w-full bg-deep-canvas border border-white/10 rounded-xl p-3 focus:outline-none focus:border-terracotta/50 min-h-[80px]" placeholder="Why is this answer correct?" />
            </div>

          </section>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full bg-terracotta text-light-gray font-bold py-4 rounded-full hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(224,75,53,0.4)] transition-all disabled:opacity-50"
          >
            {isSubmitting ? "INJECTING LESSON..." : "SUBMIT TO DATABASE"}
          </button>
        </form>
      </main>
    </div>
  );
}
