import type { Config } from '@imgly/background-removal';
import { compressForUpload } from './imageUtils';

export const processImage = async (
  imageBlob: Blob,
  onProgress: (pct: number, stage: string) => void
): Promise<Blob> => {
  if (typeof window === 'undefined') {
    throw new Error('Background removal must run in the browser');
  }

  // Try local browser AI first — private, fast, free
  try {
    return await processLocally(imageBlob, onProgress);
  } catch (localErr) {
    console.warn('[Removix] Local AI failed, using server fallback:', localErr);
    return await processViaServer(imageBlob, onProgress);
  }
};

async function processLocally(
  imageBlob: Blob,
  onProgress: (pct: number, stage: string) => void
): Promise<Blob> {
  const { removeBackground } = await import('@imgly/background-removal');

  // Use the library's built-in CDN (staticimgly.com) which is version-matched
  // and has the correct resources.json format. Local @imgly/background-removal-data
  // v1.4.5 is incompatible with library v1.7.0 (different key format in resources.json).
  const config: Config = {
    model: 'isnet_fp16',
    output: { format: 'image/png', quality: 1 },
    progress: (key: string, current: number, total: number) => {
      const frac = total > 0 ? current / total : 0;
      if (key.includes('fetch') || key.includes('load') || key.includes('download')) {
        onProgress(Math.min(Math.round(5 + frac * 40), 45), 'Loading AI model...');
      } else {
        onProgress(Math.min(Math.round(50 + frac * 45), 95), 'Removing background...');
      }
    },
  };

  onProgress(5, 'Initializing AI model...');
  const result = await removeBackground(imageBlob, config);
  onProgress(100, 'Done!');
  return result;
}

async function processViaServer(
  imageBlob: Blob,
  onProgress: (pct: number, stage: string) => void
): Promise<Blob> {
  onProgress(5, 'Uploading image...');

  // Compress so payload stays under Vercel's 4.5 MB limit
  const fileForUpload = imageBlob instanceof File
    ? imageBlob
    : new File([imageBlob], 'image.jpg', { type: imageBlob.type || 'image/jpeg' });
  const compressed = await compressForUpload(fileForUpload);

  const formData = new FormData();
  formData.append('image', compressed, 'image.jpg');

  let fake = 10;
  const ticker = setInterval(() => {
    fake = Math.min(fake + (90 - fake) * 0.04, 90);
    onProgress(Math.round(fake), 'Removing background...');
  }, 800);

  try {
    const response = await fetch('/api/remove-bg', { method: 'POST', body: formData });
    clearInterval(ticker);

    if (!response.ok) {
      const json = await response.json().catch(() => ({ error: `Server error ${response.status}` }));
      throw new Error(json.error ?? `Server error ${response.status}`);
    }

    onProgress(95, 'Finalizing...');
    const blob = await response.blob();
    onProgress(100, 'Done!');
    return blob;
  } catch (err) {
    clearInterval(ticker);
    throw err;
  }
}

export const preloadModel = async (): Promise<void> => {};
