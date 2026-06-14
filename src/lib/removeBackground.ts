import type { Config } from '@imgly/background-removal';
import { compressForUpload } from './imageUtils';

export const processImage = async (
  imageBlob: Blob,
  onProgress: (pct: number, stage: string) => void
): Promise<Blob> => {
  if (typeof window === 'undefined') {
    throw new Error('Background removal must run in the browser');
  }

  // Try browser AI paths first (best quality, private, no upload needed)
  try {
    return await processLocally(imageBlob, onProgress);
  } catch (localErr) {
    console.warn('[Removix] Browser AI failed, switching to server:', localErr);
    return await processViaServer(imageBlob, onProgress);
  }
};

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`Timed out after ${ms / 1000}s`)), ms);
    p.then(v => { clearTimeout(t); resolve(v); }, e => { clearTimeout(t); reject(e); });
  });
}

// ─── Browser AI: self-hosted CDN → original staticimgly.com CDN ─────────────
// Two-stage fallback so both paths are tried before giving up to the server.
async function processLocally(
  imageBlob: Blob,
  onProgress: (pct: number, stage: string) => void
): Promise<Blob> {
  const { removeBackground } = await import('@imgly/background-removal');

  const makeConfig = (publicPath?: string): Config => ({
    ...(publicPath ? { publicPath } : {}),
    model: 'isnet_fp16',
    output: { format: 'image/png', quality: 1 },
    progress: (key: string, current: number, total: number) => {
      const frac = total > 0 ? current / total : 0;
      if (key.includes('fetch') || key.includes('load') || key.includes('download')) {
        onProgress(Math.min(Math.round(5 + frac * 40), 44), 'Loading AI model…');
      } else {
        onProgress(Math.min(Math.round(50 + frac * 44), 94), 'Removing background…');
      }
    },
  });

  // Stage 1: self-hosted Vercel CDN (avoids staticimgly.com dependency)
  try {
    onProgress(3, 'Initializing AI model (self-hosted)…');
    const selfHosted = `${window.location.origin}/models/`;
    return await withTimeout(removeBackground(imageBlob, makeConfig(selfHosted)), 300_000);
  } catch (e1) {
    console.warn('[Removix] Self-hosted model failed, trying original CDN:', e1);
  }

  // Stage 2: original staticimgly.com CDN (same source the app used before our changes)
  onProgress(3, 'Loading AI model (CDN)…');
  return await withTimeout(removeBackground(imageBlob, makeConfig()), 300_000);
}

// ─── Server fallback (RMBG-2.0 → RMBG-1.4 → ModNet → Groq) ─────────────────
async function processViaServer(
  imageBlob: Blob,
  onProgress: (pct: number, stage: string) => void
): Promise<Blob> {
  onProgress(5, 'Uploading image…');

  const fileForUpload = imageBlob instanceof File
    ? imageBlob
    : new File([imageBlob], 'image.jpg', { type: imageBlob.type || 'image/jpeg' });
  const compressed = await compressForUpload(fileForUpload);

  const formData = new FormData();
  formData.append('image', compressed, 'image.jpg');

  let fake = 10;
  const ticker = setInterval(() => {
    fake = Math.min(fake + (90 - fake) * 0.04, 90);
    onProgress(Math.round(fake), 'Removing background (server AI)…');
  }, 800);

  try {
    const response = await fetch('/api/remove-bg', { method: 'POST', body: formData });
    clearInterval(ticker);

    if (!response.ok) {
      const json = await response.json().catch(() => ({ error: `Server error ${response.status}` }));
      throw new Error(json.error ?? `Server error ${response.status}`);
    }

    onProgress(95, 'Finalizing…');
    const blob = await response.blob();
    onProgress(100, 'Done!');
    return blob;
  } catch (err) {
    clearInterval(ticker);
    throw err;
  }
}

export const preloadModel = async (): Promise<void> => {};
