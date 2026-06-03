"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  parseTimestampString,
  audioBufferFromUrl,
  audioBufferFromBlob,
  generateDing,
  encodeToMp3,
  formatTime,
} from "@/lib/audioUtils";

interface AudioMixerProps {
  /** The raw voice recording blob or uploaded audio file */
  audioFile: File | null;
  /** Existing published audio URL (used if no new file) */
  existingAudioUrl: string;
  /** Semicolon-separated timestamp string e.g. "00:10-CD;00:30-CS" */
  timestampString: string;
  /** Called when the user approves the mixed MP3 for publishing */
  onMixedAudio: (blob: Blob) => void;
}

const LS_FX_KEY = "vocabpod_transition_fx_url";
const LS_BG_KEY = "vocabpod_bg_track_url";

// ── Asset Card ────────────────────────────────────────────────────────────
const AssetCard = ({
  label,
  url,
  isUploading,
  inputRef,
  onUpload,
  onDelete,
  onReplace,
}: {
  label: string;
  url: string;
  isUploading: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDelete: () => void;
  onReplace: () => void;
}) => (
  <div className="bg-deep-canvas border border-white/10 rounded-2xl p-5 space-y-3">
    <span className="text-[10px] font-black uppercase tracking-widest text-terracotta">{label}</span>
    {url ? (
      <>
        <audio src={url} controls className="w-full h-9 outline-none mt-2" />
        <div className="flex gap-2 mt-2">
          <button
            type="button"
            onClick={onReplace}
            className="text-[10px] font-bold uppercase tracking-wider text-muted-ash hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg transition-colors"
          >
            Replace
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="text-[10px] font-bold uppercase tracking-wider text-dark-blush hover:text-terracotta px-3 py-1.5 rounded-lg transition-colors"
          >
            Delete
          </button>
        </div>
      </>
    ) : (
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isUploading}
        className="w-full border border-dashed border-white/20 hover:border-terracotta/40 rounded-xl py-6 flex flex-col items-center gap-2 text-muted-ash hover:text-white transition-all disabled:opacity-50"
      >
        {isUploading ? (
          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        )}
        <span className="text-[11px] font-bold uppercase tracking-wider">
          {isUploading ? "Uploading…" : `Upload ${label}`}
        </span>
      </button>
    )}
    <input
      ref={inputRef}
      type="file"
      accept="audio/*"
      className="hidden"
      onChange={onUpload}
    />
  </div>
);

export default function AudioMixer({
  audioFile,
  existingAudioUrl,
  timestampString,
  onMixedAudio,
}: AudioMixerProps) {
  // ── Asset URLs (persisted in localStorage) ──────────────────────────────
  const [fxUrl, setFxUrl] = useState<string>(() =>
    typeof window !== "undefined" ? localStorage.getItem(LS_FX_KEY) || "" : ""
  );
  const [bgUrl, setBgUrl] = useState<string>(() =>
    typeof window !== "undefined" ? localStorage.getItem(LS_BG_KEY) || "" : ""
  );

  // ── Upload states ─────────────────────────────────────────────────────────
  const [isUploadingFx, setIsUploadingFx] = useState(false);
  const [isUploadingBg, setIsUploadingBg] = useState(false);

  // ── Mixer controls ────────────────────────────────────────────────────────
  const [fxGain, setFxGain] = useState(0.2);
  const [bgGain, setBgGain] = useState(0.03);
  const [dingGain, setDingGain] = useState(0.2);

  // ── Mixing progress ───────────────────────────────────────────────────────
  const [isMixing, setIsMixing] = useState(false);
  const [mixProgress, setMixProgress] = useState(0);
  const [mixStatus, setMixStatus] = useState("");

  // ── Preview ───────────────────────────────────────────────────────────────
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const [isPublished, setIsPublished] = useState(false);

  const fxInputRef = useRef<HTMLInputElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);

  const hasSource = !!audioFile || !!existingAudioUrl;

  // ── Load lamejs from CDN (same as AudioRecorder) ──────────────────────────
  useEffect(() => {
    if (typeof window !== "undefined" && !(window as any).lamejs) {
      const existing = document.querySelector('script[src*="lame.min.js"]');
      if (!existing) {
        const script = document.createElement("script");
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/lamejs/1.2.1/lame.min.js";
        script.async = true;
        document.body.appendChild(script);
      }
    }
  }, []);

  /** Poll until lamejs is available on window (max 10s) */
  const waitForLamejs = (): Promise<void> =>
    new Promise((resolve, reject) => {
      if ((window as any).lamejs) return resolve();
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        if ((window as any).lamejs) {
          clearInterval(interval);
          resolve();
        } else if (attempts > 100) {
          clearInterval(interval);
          reject(new Error("MP3 encoder failed to load. Check your internet connection and refresh."));
        }
      }, 100);
    });

  // ── R2 Upload helper ──────────────────────────────────────────────────────
  const uploadToR2 = async (file: File, path: string): Promise<string> => {
    const ext = file.name.split(".").pop();
    const filename = `${path}-${Date.now()}.${ext}`;
    const presignRes = await fetch("/api/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename, contentType: file.type }),
    });
    if (!presignRes.ok) throw new Error("Failed to get upload URL");
    const { uploadUrl, finalUrl } = await presignRes.json();
    if (uploadUrl !== "fallback-mode") {
      const up = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!up.ok) throw new Error("Upload to R2 failed");
    }
    return finalUrl as string;
  };

  const handleUploadFx = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingFx(true);
    try {
      const url = await uploadToR2(file, "assets/transition-fx/transition-fx");
      setFxUrl(url);
      localStorage.setItem(LS_FX_KEY, url);
    } catch (err) {
      alert("Failed to upload transition FX: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsUploadingFx(false);
      if (fxInputRef.current) fxInputRef.current.value = "";
    }
  };

  const handleUploadBg = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingBg(true);
    try {
      const url = await uploadToR2(file, "assets/bg-track/bg-track");
      setBgUrl(url);
      localStorage.setItem(LS_BG_KEY, url);
    } catch (err) {
      alert("Failed to upload background track: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsUploadingBg(false);
      if (bgInputRef.current) bgInputRef.current.value = "";
    }
  };

  const deleteFx = () => { setFxUrl(""); localStorage.removeItem(LS_FX_KEY); setPreviewUrl(null); };
  const deleteBg = () => { setBgUrl(""); localStorage.removeItem(LS_BG_KEY); setPreviewUrl(null); };

  // ── Main Mix Function ─────────────────────────────────────────────────────
  const handleMix = async () => {
    if (!hasSource) return;
    setIsMixing(true);
    setMixProgress(0);
    setPreviewUrl(null);
    setPreviewBlob(null);

    try {
      // Step 1: Decode main voice audio
      setMixStatus("Decoding main audio…");
      let mainBuffer: AudioBuffer;
      if (audioFile) {
        mainBuffer = await audioBufferFromBlob(audioFile);
      } else {
        const tempCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const buf = await audioBufferFromUrl(existingAudioUrl, tempCtx);
        tempCtx.close();
        if (!buf) throw new Error("Could not decode existing audio URL");
        mainBuffer = buf;
      }
      setMixProgress(0.1);

      // Step 2: Decode assets (may be null if not set)
      setMixStatus("Loading assets…");
      const sampleRate = 44100;
      const duration = mainBuffer.duration;

      // We need a context just for decoding assets
      const decodeCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const fxBuffer = fxUrl ? await audioBufferFromUrl(fxUrl, decodeCtx) : null;
      const bgBuffer = bgUrl ? await audioBufferFromUrl(bgUrl, decodeCtx) : null;
      decodeCtx.close();
      setMixProgress(0.2);

      // Step 3: Parse timestamps
      const timestamps = parseTimestampString(timestampString);

      // Step 4: Create OfflineAudioContext
      setMixStatus("Mixing audio…");
      // Add 0.7s tail for ding
      const totalDuration = duration + 0.7;
      // Force mono mixing for 64kbps podcast format
      // This prevents lamejs stereo encoding bugs and significantly improves 64kbps audio quality
      const numChannels = 1;
      const offlineCtx = new OfflineAudioContext(numChannels, Math.ceil(sampleRate * totalDuration), sampleRate);

      // Step 5: Schedule main voice
      const mainSource = offlineCtx.createBufferSource();
      mainSource.buffer = mainBuffer;
      mainSource.connect(offlineCtx.destination);
      mainSource.start(0);

      // Step 6: Transition FX at each timestamp
      if (fxBuffer) {
        for (const { time } of timestamps) {
          const fxStart = Math.max(0, time - fxBuffer.duration / 2);
          if (fxStart > totalDuration) continue;
          const fxSource = offlineCtx.createBufferSource();
          fxSource.buffer = fxBuffer;
          const fxGainNode = offlineCtx.createGain();
          fxGainNode.gain.setValueAtTime(fxGain, 0);
          fxSource.connect(fxGainNode);
          fxGainNode.connect(offlineCtx.destination);
          fxSource.start(fxStart);
        }
      }

      // Step 7: Ding at the end of main audio
      const dingBuffer = generateDing(sampleRate);
      const dingSource = offlineCtx.createBufferSource();
      dingSource.buffer = dingBuffer;
      const dingGainNode = offlineCtx.createGain();
      dingGainNode.gain.setValueAtTime(dingGain, 0);
      dingSource.connect(dingGainNode);
      dingGainNode.connect(offlineCtx.destination);
      dingSource.start(duration);

      // Step 8: Background track looping with fade
      if (bgBuffer) {
        const bgGainNode = offlineCtx.createGain();
        bgGainNode.connect(offlineCtx.destination);

        // Fade in 2s, hold, fade out 3s
        const fadeIn = 2;
        const fadeOut = 3;
        bgGainNode.gain.setValueAtTime(0, 0);
        bgGainNode.gain.linearRampToValueAtTime(bgGain, fadeIn);
        bgGainNode.gain.setValueAtTime(bgGain, Math.max(fadeIn, totalDuration - fadeOut));
        bgGainNode.gain.linearRampToValueAtTime(0, totalDuration);

        // Loop background track to fill duration
        let bgTime = 0;
        while (bgTime < totalDuration) {
          const bgSource = offlineCtx.createBufferSource();
          bgSource.buffer = bgBuffer;
          bgSource.connect(bgGainNode);
          bgSource.start(bgTime);
          bgTime += bgBuffer.duration;
        }
      }

      // Step 9: Render
      setMixProgress(0.4);
      const renderedBuffer = await offlineCtx.startRendering();
      setMixProgress(0.6);

      // Step 10: Encode to 64 kbps MP3
      setMixStatus("Waiting for MP3 encoder…");
      await waitForLamejs();
      setMixStatus("Encoding to 64 kbps MP3…");
      const mp3Blob = await encodeToMp3(renderedBuffer, 64, (p) => {
        setMixProgress(0.6 + p * 0.4);
      });

      // Step 11: Preview
      const url = URL.createObjectURL(mp3Blob);
      setPreviewUrl(url);
      setPreviewBlob(mp3Blob);
      setMixStatus("Done!");
    } catch (err) {
      console.error("Mix error:", err);
      alert("Mixing failed: " + (err instanceof Error ? err.message : String(err)));
      setMixStatus("");
    } finally {
      setIsMixing(false);
      setMixProgress(0);
    }
  };

  const handleUseForPublishing = () => {
    if (!previewBlob) return;
    onMixedAudio(previewBlob);
    setIsPublished(true);
    setTimeout(() => setIsPublished(false), 3000);
  };

  return (
    <div className="mt-10 space-y-8 border-t border-white/5 pt-10">
      <div>
        <h3 className="text-sm font-black uppercase tracking-widest text-terracotta">Audio Post-Production Mixer</h3>
        <p className="text-xs text-muted-ash mt-1">
          Mix transition effects, background music, and encode to 64 kbps MP3.
          {timestampString && (
            <span className="ml-2 text-terracotta/70 font-bold">{timestampString}</span>
          )}
        </p>
      </div>

      {!hasSource && (
        <div className="bg-deep-canvas border border-white/10 rounded-2xl p-6 text-center text-muted-ash text-sm">
          Upload or record an audio file above to enable the mixer.
        </div>
      )}

      {hasSource && (
        <>
          {/* Assets Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AssetCard
              label="Transition Effect"
              url={fxUrl}
              isUploading={isUploadingFx}
              inputRef={fxInputRef}
              onUpload={handleUploadFx}
              onDelete={deleteFx}
              onReplace={() => fxInputRef.current?.click()}
            />
            <AssetCard
              label="Background Track"
              url={bgUrl}
              isUploading={isUploadingBg}
              inputRef={bgInputRef}
              onUpload={handleUploadBg}
              onDelete={deleteBg}
              onReplace={() => bgInputRef.current?.click()}
            />
          </div>

          {/* Gain Sliders */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Transition FX Volume", value: fxGain, set: setFxGain, max: 1 },
              { label: "Background Volume", value: bgGain, set: setBgGain, max: 0.3 },
              { label: "Ding Volume", value: dingGain, set: setDingGain, max: 1 },
            ].map(({ label, value, set, max }) => (
              <div key={label} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-ash">{label}</span>
                  <span className="text-[10px] font-bold text-terracotta">{Math.round(value * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={max}
                  step={0.01}
                  value={value}
                  onChange={(e) => set(parseFloat(e.target.value))}
                  className="w-full accent-terracotta"
                />
              </div>
            ))}
          </div>

          {/* Timestamps preview */}
          {timestampString && (
            <div className="flex flex-wrap gap-2">
              {parseTimestampString(timestampString).map(({ time, code }) => (
                <span key={code} className="text-[10px] font-bold bg-terracotta/10 border border-terracotta/20 text-terracotta px-2 py-1 rounded-full">
                  {formatTime(time)} · {code}
                </span>
              ))}
            </div>
          )}

          {/* Mix Button */}
          {!isMixing ? (
            <button
              type="button"
              onClick={handleMix}
              className="w-full py-4 bg-terracotta hover:bg-terracotta/80 text-white font-black uppercase tracking-wider rounded-2xl transition-all shadow-lg hover:shadow-terracotta/30 flex items-center justify-center gap-3"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                <path d="M9 18V5l12-2v13" />
                <circle cx="6" cy="18" r="3" />
                <circle cx="18" cy="16" r="3" />
              </svg>
              Mix &amp; Preview (64 kbps MP3)
            </button>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest text-muted-ash">
                <span>{mixStatus}</span>
                <span>{Math.round(mixProgress * 100)}%</span>
              </div>
              <div className="w-full h-2 bg-deep-canvas rounded-full overflow-hidden">
                <div
                  className="h-full bg-terracotta rounded-full transition-all"
                  style={{ width: `${mixProgress * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Preview Player */}
          {previewUrl && !isMixing && (
            <div className="bg-deep-canvas border border-terracotta/20 rounded-2xl p-6 space-y-4 animate-fadeIn">
              <span className="text-[10px] font-black uppercase tracking-widest text-terracotta">Mixed Preview — 64 kbps MP3</span>
              <audio src={previewUrl} controls className="w-full h-10 outline-none" />
              <div className="flex gap-3">
                <a
                  href={previewUrl}
                  download={`mixed_output.mp3`}
                  className="flex-1 text-center py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-light-gray font-bold uppercase tracking-wider text-[10px] rounded-xl transition-all"
                >
                  Download MP3
                </a>
                <button
                type="button"
                onClick={handleUseForPublishing}
                className={`flex-1 py-3 text-white font-bold uppercase tracking-wider text-[10px] rounded-xl transition-all shadow-lg ${isPublished ? 'bg-green-500' : 'bg-terracotta hover:bg-terracotta/80'}`}
              >
                {isPublished ? "✓ Attached - Now Save Word!" : "Attach Mixed Audio"}
              </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
