/**
 * audioUtils.ts
 * Client-side audio utilities for the VocabPod AudioMixer.
 * All functions run in the browser — no server involvement.
 */

/** Parse "00:10-CD;00:30-CS;01:15-MN" into [{time: 10, code: "CD"}, ...] */
export function parseTimestampString(str: string): { time: number; code: string }[] {
  if (!str || !str.trim()) return [];
  
  const results: { time: number; code: string }[] = [];
  const regex = /(\d{1,2}:\d{2})-([A-Z]+)/g;
  
  let match;
  while ((match = regex.exec(str)) !== null) {
    const timeStr = match[1];
    const code = match[2];
    const [m, s] = timeStr.split(":").map(Number);
    const time = (m || 0) * 60 + (s || 0);
    results.push({ time, code });
  }
  
  return results;
}

/** Format seconds into MM:SS */
export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

/**
 * Generate a short procedural ding sound (880 Hz sine with fast decay).
 * Returns a mono AudioBuffer of ~0.6 seconds.
 */
export function generateDing(sampleRate: number = 44100): AudioBuffer {
  const duration = 0.6;
  const numSamples = Math.floor(sampleRate * duration);
  // Use a temporary offline context to create an AudioBuffer
  const buffer = new AudioBuffer({ numberOfChannels: 1, length: numSamples, sampleRate });
  const data = buffer.getChannelData(0);
  const freq = 880;
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const envelope = Math.exp(-t * 8); // Fast exponential decay
    data[i] = Math.sin(2 * Math.PI * freq * t) * envelope * 0.7;
  }
  return buffer;
}

/**
 * Fetch a URL and decode it into an AudioBuffer using a shared AudioContext.
 * Returns null if URL is empty or fetch fails.
 */
export async function audioBufferFromUrl(
  url: string,
  audioCtx: BaseAudioContext
): Promise<AudioBuffer | null> {
  if (!url) return null;
  try {
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`Failed to fetch audio: ${resp.statusText}`);
    const arrayBuffer = await resp.arrayBuffer();
    return await audioCtx.decodeAudioData(arrayBuffer);
  } catch (err) {
    console.error("audioBufferFromUrl error:", err);
    return null;
  }
}

/**
 * Decode a Blob/File into an AudioBuffer using a temporary AudioContext.
 */
export async function audioBufferFromBlob(blob: Blob): Promise<AudioBuffer> {
  const arrayBuffer = await blob.arrayBuffer();
  const audioCtx = new (window.AudioContext ||
    (window as any).webkitAudioContext)();
  const buffer = await audioCtx.decodeAudioData(arrayBuffer);
  audioCtx.close();
  return buffer;
}

/**
 * Encode an AudioBuffer to a 64 kbps MP3 Blob using the globally loaded lamejs.
 * Calls onProgress(0..1) periodically to allow UI updates.
 */
export async function encodeToMp3(
  buffer: AudioBuffer,
  kbps: number = 64,
  onProgress?: (progress: number) => void
): Promise<Blob> {
  const lame = (window as any).lamejs;
  if (!lame)
    throw new Error("MP3 encoder (lamejs) is still loading. Please try again.");

  const numChannels = buffer.numberOfChannels > 1 ? 2 : 1;
  const sampleRate = buffer.sampleRate;
  const encoder = new lame.Mp3Encoder(numChannels, sampleRate, kbps);
  const mp3Data: Uint8Array[] = [];
  const BLOCK = 1152;

  // Convert Float32 PCM → Int16
  const toInt16 = (channel: Float32Array): Int16Array => {
    const out = new Int16Array(channel.length);
    for (let i = 0; i < channel.length; i++) {
      const s = Math.max(-1, Math.min(1, channel[i]));
      out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return out;
  };

  const left = toInt16(buffer.getChannelData(0));
  const right = numChannels === 2 ? toInt16(buffer.getChannelData(1)) : left;
  const total = left.length;

  // Encode in blocks, yielding to the event loop every 50 blocks
  let i = 0;
  let blockCount = 0;
  while (i < total) {
    const end = Math.min(i + BLOCK, total);
    const leftChunk = left.subarray(i, end);
    const rightChunk = right.subarray(i, end);
    const mp3buf =
      numChannels === 2
        ? encoder.encodeBuffer(leftChunk, rightChunk)
        : encoder.encodeBuffer(leftChunk);
    if (mp3buf.length > 0) mp3Data.push(new Uint8Array(mp3buf));
    i += BLOCK;
    blockCount++;
    if (onProgress) onProgress(Math.min(i / total, 0.99));
    // Yield every 50 blocks to avoid blocking the main thread
    if (blockCount % 50 === 0) {
      await new Promise((r) => setTimeout(r, 0));
    }
  }

  const final = encoder.flush();
  if (final.length > 0) mp3Data.push(new Uint8Array(final));
  if (onProgress) onProgress(1);

  return new Blob(mp3Data as unknown as BlobPart[], { type: "audio/mp3" });
}
