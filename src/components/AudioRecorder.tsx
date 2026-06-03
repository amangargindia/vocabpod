"use client";

import React, { useState, useRef, useEffect } from "react";

interface AudioRecorderProps {
  word: string;
  wordNumber: number;
  /** Called with the semicolon-separated timestamp string when recording stops */
  onTimestamps?: (ts: string) => void;
}

type Timestamp = { code: string; time: number };

export default function AudioRecorder({ word, wordNumber, onTimestamps }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [timestamps, setTimestamps] = useState<Timestamp[]>([]);
  
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const isRecordingRef = useRef(isRecording);
  useEffect(() => { isRecordingRef.current = isRecording; }, [isRecording]);

  const recordingDurationRef = useRef(recordingDuration);
  useEffect(() => { recordingDurationRef.current = recordingDuration; }, [recordingDuration]);

  const clearTimestamps = () => {
    setTimestamps([]);
    if (onTimestamps) onTimestamps("");
  };

  // Load lamejs from CDN
  useEffect(() => {
    if (typeof window !== "undefined" && !(window as any).lamejs) {
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/lamejs/1.2.1/lame.min.js";
      script.async = true;
      document.body.appendChild(script);
    }

    // Get mic permissions to populate device list with labels
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      navigator.mediaDevices.enumerateDevices().then((deviceInfos) => {
        const audioInputs = deviceInfos.filter(device => device.kind === 'audioinput');
        setDevices(audioInputs);
        if (audioInputs.length > 0) {
           setSelectedDeviceId(audioInputs[0].deviceId);
        }
      });
      // Stop the initial permission stream immediately
      stream.getTracks().forEach(track => track.stop());
    }).catch(err => console.error("Mic access denied", err));
  }, []);

  // Keyboard shortcuts (Space to pause/resume, Ctrl+Z to stamp next section)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!isRecordingRef.current) return;
      
      if (e.code === "Space") {
        e.preventDefault();
        if (isPaused) resumeRecording();
        else pauseRecording();
      }
      
      if (e.ctrlKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        setTimestamps(prev => {
          const SECTION_ORDER = ["CD", "CS", "MN", "RLUS", "ARQ"];
          const stampedCodes = prev.map(t => t.code);
          const nextCode = SECTION_ORDER.find(c => !stampedCodes.includes(c));
          if (nextCode) {
            return [...prev, { code: nextCode, time: recordingDurationRef.current }];
          }
          return prev;
        });
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isPaused]);

  // Timer logic
  useEffect(() => {
    if (isRecording && !isPaused) {
      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording, isPaused]);

  // Listen for vocabpod:stamp events dispatched by section headline clicks in parent
  useEffect(() => {
    const handler = (e: Event) => {
      const { code } = (e as CustomEvent<{ code: string }>).detail;
      stampTimestamp(code);
    };
    window.addEventListener("vocabpod:stamp", handler);
    return () => window.removeEventListener("vocabpod:stamp", handler);
  }); // no dep array — always uses latest stampTimestamp/recordingDuration closure

 const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const startRecording = async () => {
    try {
      const constraints = {
        audio: selectedDeviceId ? { deviceId: { exact: selectedDeviceId } } : true
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" }); // typically webm or ogg
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
      };

      mediaRecorder.start();
      setIsRecording(true);
      setIsPaused(false);
      setRecordingDuration(0);
      setAudioUrl(null);
      setAudioBlob(null);
      clearTimestamps();
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("Could not access the microphone. Please check your permissions.");
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "paused") {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      // Emit timestamps to parent
      if (onTimestamps && timestamps.length > 0) {
        const tsStr = timestamps
          .map(({ time, code }) => {
            const m = Math.floor(time / 60).toString().padStart(2, "0");
            const s = (time % 60).toString().padStart(2, "0");
            return `${m}:${s}-${code}`;
          })
          .join(";");
        onTimestamps(tsStr);
      }
    }
  };

  /** Stamp the current recording time with a section code */
  const stampTimestamp = (code: string) => {
    if (!isRecording) return;
    setTimestamps(prev => {
      // Replace if already stamped
      const filtered = prev.filter(t => t.code !== code);
      return [...filtered, { code, time: recordingDuration }];
    });
  };

  const discardAudio = () => {
    setAudioUrl(null);
    setAudioBlob(null);
    setRecordingDuration(0);
    clearTimestamps();
  };

  const encodeAudioToMp3 = async (blob: Blob): Promise<Blob> => {
    const arrayBuffer = await blob.arrayBuffer();
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 44100 });
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    // Get PCM data from the left channel
    const channelData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;

    // Convert Float32 to Int16
    const int16Data = new Int16Array(channelData.length);
    for (let i = 0; i < channelData.length; i++) {
      let s = Math.max(-1, Math.min(1, channelData[i]));
      int16Data[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }

    // Initialize lamejs encoder
    // 1 channel, sampleRate, 128 kbps
    const lame = (window as any).lamejs;
    if (!lame) throw new Error("MP3 Encoder library is still loading. Please try again in a moment.");
    const encoder = new lame.Mp3Encoder(1, sampleRate, 128);
    const mp3Data: Uint8Array[] = [];

    // Encode in chunks to prevent blocking
    const sampleBlockSize = 1152;
    for (let i = 0; i < int16Data.length; i += sampleBlockSize) {
      const chunk = int16Data.subarray(i, i + sampleBlockSize);
      const mp3buf = encoder.encodeBuffer(chunk);
      if (mp3buf.length > 0) {
        mp3Data.push(new Uint8Array(mp3buf));
      }
    }

    const mp3buf = encoder.flush();
    if (mp3buf.length > 0) {
      mp3Data.push(new Uint8Array(mp3buf));
    }

    return new Blob(mp3Data as unknown as BlobPart[], { type: "audio/mp3" });
  };

  const keepAudio = async () => {
    if (!audioBlob) return;
    setIsConverting(true);
    try {
      const mp3Blob = await encodeAudioToMp3(audioBlob);
      const url = URL.createObjectURL(mp3Blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      // Naming format: Word_Date_[timestamps].mp3
      const safeWord = (word || "UnknownWord").replace(/[^a-zA-Z0-9]/g, "");
      const date = new Date().toISOString().split("T")[0];
      
      let tsPart = "";
      if (timestamps.length > 0) {
        const tsStr = timestamps
          .map(({ time, code }) => {
            const m = Math.floor(time / 60).toString().padStart(2, "0");
            const s = (time % 60).toString().padStart(2, "0");
            return `${m}_${s}-${code}`;
          })
          .join("-");
        tsPart = `_[${tsStr}]`;
      }
      
      a.download = `${safeWord}_${date}${tsPart}.mp3`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error converting to MP3:", error);
      alert("Failed to convert audio to MP3: " + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsConverting(false);
      discardAudio();
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] bg-absolute-black/95 backdrop-blur-2xl border-t border-white/10 px-6 py-4 shadow-[0_-10px_50px_rgba(0,0,0,0.6)] animate-slideUp">
      <div className="max-w-[1400px] mx-auto w-full flex items-center justify-between gap-8">
        
        {/* Left Side: Title & Target Word */}
        <div className="flex items-center gap-4 shrink-0">
          <div className="flex flex-col">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-terracotta flex items-center gap-2">
              {isRecording && !isPaused && (
                <span className="w-1.5 h-1.5 bg-terracotta rounded-full animate-ping block"></span>
              )}
              Studio
            </h3>
            <span className="text-light-gray text-base font-bold truncate max-w-[200px]">{word || "Unknown"}</span>
          </div>
          
          {/* Mic Selector */}
          {!isRecording && !audioUrl && devices.length > 1 && (
            <div className="ml-4 flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 shadow-inner">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5 text-muted-ash"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
              <select 
                value={selectedDeviceId} 
                onChange={(e) => setSelectedDeviceId(e.target.value)}
                className="bg-transparent text-xs text-light-gray font-medium outline-none cursor-pointer max-w-[150px] truncate"
              >
                {devices.map(device => (
                  <option key={device.deviceId} value={device.deviceId} className="bg-card-gray text-white">
                    {device.label || `Microphone ${devices.indexOf(device) + 1}`}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Center: Controls, Timer OR Audio Player */}
        <div className="flex-1 flex items-center justify-center">
          {audioUrl && !isRecording ? (
            // Full Width Audio Player
            <div className="w-full max-w-3xl px-4">
              <audio src={audioUrl} controls className="w-full h-10 outline-none" />
            </div>
          ) : (
            // Recording Controls & Timer
            <div className="flex items-center gap-8">
              {isRecording && (
                <div className="flex flex-col items-center gap-1">
                  <div className="text-3xl font-mono text-white/90 tabular-nums">
                    {formatTime(recordingDuration)}
                  </div>
                  {/* Live timestamp log */}
                  {timestamps.length > 0 && (
                    <div className="flex flex-col items-center gap-1">
                      <div className="flex flex-wrap gap-1 justify-center max-w-xs">
                        {timestamps.map(({ code, time }) => (
                          <span key={code} className="text-[9px] font-bold bg-terracotta/20 text-terracotta border border-terracotta/30 px-1.5 py-0.5 rounded-full">
                            {formatTime(time)}-{code}
                          </span>
                        ))}
                      </div>
                      <button onClick={clearTimestamps} className="text-[9px] text-muted-ash hover:text-red-400 uppercase font-bold tracking-widest transition-colors">
                        Clear Stamps
                      </button>
                    </div>
                  )}
                  <span className="text-[9px] text-muted-ash/60 font-bold uppercase tracking-widest">Space to pause/resume</span>
                </div>
              )}
              
              <div className="flex gap-4 items-center">
                {!isRecording && !audioUrl && (
                  <button
                    onClick={startRecording}
                    className="w-12 h-12 bg-dark-blush hover:bg-terracotta text-terracotta hover:text-white rounded-full flex items-center justify-center transition-all shadow-lg hover:shadow-[0_0_20px_rgba(224,75,53,0.4)] border border-terracotta/30 group"
                    title="Start Recording"
                  >
                    <div className="w-4 h-4 rounded-full bg-current group-hover:scale-110 transition-transform"></div>
                  </button>
                )}

                {isRecording && (
                  <>
                    <button
                      onClick={isPaused ? resumeRecording : pauseRecording}
                      className="w-10 h-10 bg-deep-canvas hover:bg-white/10 text-light-gray rounded-full flex items-center justify-center transition-all border border-white/10"
                      title={isPaused ? "Resume" : "Pause"}
                    >
                      {isPaused ? (
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 ml-1"><path d="M8 5v14l11-7z" /></svg>
                      ) : (
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
                      )}
                    </button>
                    <button
                      onClick={stopRecording}
                      className="w-12 h-12 bg-deep-canvas hover:bg-red-500/20 text-red-500 rounded-full flex items-center justify-center transition-all shadow-lg border border-red-500/30 group"
                      title="Stop Recording"
                    >
                      <div className="w-4 h-4 bg-current rounded-sm group-hover:scale-110 transition-transform"></div>
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Keep/Discard or Empty space */}
        <div className="shrink-0 min-w-[180px] flex justify-end">
          {audioUrl && !isRecording && (
            <div className="flex gap-3">
              <button
                onClick={discardAudio}
                disabled={isConverting}
                className="px-4 py-2.5 bg-deep-canvas hover:bg-white/10 border border-white/10 text-muted-ash hover:text-white font-bold uppercase tracking-wider text-[10px] rounded-xl transition-all disabled:opacity-50"
              >
                Discard
              </button>
              <button
                onClick={keepAudio}
                disabled={isConverting}
                className="px-4 py-2.5 bg-terracotta hover:bg-terracotta/80 text-light-gray font-bold uppercase tracking-wider text-[10px] rounded-xl transition-all disabled:opacity-50 shadow-lg hover:shadow-[0_0_20px_rgba(224,75,53,0.4)] flex items-center gap-2"
              >
                {isConverting ? (
                  <>
                    <svg className="animate-spin h-3.5 w-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Converting...
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                    Save MP3
                  </>
                )}
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
