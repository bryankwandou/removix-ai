import type { Config } from '@imgly/background-removal';
import { compressForUpload } from './imageUtils';

export const processImage = async (
  imageBlob: Blob,
  onProgress: (pct: number, stage: string) => void
): Promise<Blob> => {
  if (typeof window === 'undefined') {
    throw new Error('Background removal must run in the browser');
  }

  // Try the local browser AI first (ISNet — highest quality, fully private).
  // If it fails or times out, transparently fall back to the server pipeline.
  try {
    return await processLocally(imageBlob, onProgress);
  } catch (localErr) {
    console.warn('[Removix] Local AI failed, switching to server:', localErr);
    return await processViaServer(imageBlob, onProgress);
  }
};

// ─── Retry helper ────────────────────────────────────────────────────────────
async function withRetry<T>(fn: () => Promise<T>, maxAttempts = 2): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt < maxAttempts - 1) {
        await new Promise(r => setTimeout(r, 1500 * (attempt + 1)));
      }
    }
  }
  throw lastErr;
}

// ─── Race a promise against a timeout ────────────────────────────────────────
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms / 1000}s`)), ms);
    promise.then(v => { clearTimeout(timer); resolve(v); }, e => { clearTimeout(timer); reject(e); });
  });
}

// ─── Browser-side ISNet (highest quality) ────────────────────────────────────
// Models are self-hosted on Vercel (/models/) — no external CDN dependency.
// resources.json uses v1.7.0-compatible format (isnet_fp16 key, name field).
async function processLocally(
  imageBlob: Blob,
  onProgress: (pct: number, stage: string) => void
): Promise<Blob> {
  const { removeBackground } = await import('@imgly/background-removal');

  const publicPath = `${window.location.origin}/models/`;

  const config: Config = {
    publicPath,
    model: 'isnet_fp16',
    output: { format: 'image/png', quality: 1 },
    progress: (key: string, current: number, total: number) => {
      const frac = total > 0 ? current / total : 0;
      if (key.includes('fetch') || key.includes('load') || key.includes('download')) {
        onProgress(Math.min(Math.round(5 + frac * 40), 44), 'Loading AI model (first run ~30s)…');
      } else {
        onProgress(Math.min(Math.round(50 + frac * 44), 94), 'Removing background…');
      }
    },
  };

  onProgress(3, 'Initializing AI model…');

  // 3-minute timeout: ISNet downloads ~84MB of WASM+model on first load.
  // If still not done, fall through to the server which is faster.
  const result = await withTimeout(
    withRetry(() => removeBackground(imageBlob, config)),
    180_000,
    'Local ISNet'
  );

  onProgress(100, 'Done!');
  return result;
}

// ─── Server fallback (RMBG-2.0 → RMBG-1.4 → ModNet → Groq) ─────────────────
async function processViaServer(
  imageBlob: Blob,
  onProgress: (pct: number, stage: string) => void
): Promise<Blob> {
  onProgress(5, 'Uploading image…');

  // Compress to stay under Vercel's 4.5 MB body limit
  const fileForUpload = imageBlob instanceof File
    ? imageBlob
    : new File([imageBlob], 'image.jpg', { type: imageBlob.type || 'image/jpeg' });
  const compressed = await compressForUpload(fileForUpload);

  const formData = new FormData();
  formData.append('image', compressed, 'image.jpg');

  // Animated progress ticker while we wait for the server
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
