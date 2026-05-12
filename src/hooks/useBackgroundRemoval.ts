import { useState, useCallback, useEffect, useRef } from 'react';
import { validateImage, blobToURL, revokeURL, formatFileSize } from '@/lib/imageUtils';
import { processImage } from '@/lib/removeBackground';

export type AppStatus = 'idle' | 'validating' | 'processing' | 'done' | 'error';

function mapError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  const lower = msg.toLowerCase();
  if (lower.includes('cancelled') || lower.includes('canceled')) return '';
  if (lower.includes('too large') || lower.includes('413')) return 'Image too large. Please use an image under 25MB.';
  if (lower.includes('out of memory') || lower.includes('oom')) return 'Out of memory. Try a smaller image.';
  if (lower.includes('invalid base url') || lower.includes("construct 'url'") || lower.includes('invalid url'))
    return 'Failed to load AI model. Refresh the page and try again.';
  if (lower.includes('webgpu') || lower.includes('wasm') || lower.includes('ort'))
    return 'AI model failed to initialize. Try a different browser (Chrome recommended).';
  if (lower.includes('timeout') || lower.includes('timed out') || lower.includes('524'))
    return 'Processing timed out. Try a smaller image or try again later.';
  if (lower.includes('fetch') || lower.includes('network') || lower.includes('failed to fetch'))
    return 'Network error loading AI model. Check your connection and try again.';
  console.error('[Removix] Unhandled error:', msg);
  return 'Processing failed. Try a different image or try again.';
}

export const useBackgroundRemoval = () => {
  const [status, setStatus] = useState<AppStatus>('idle');
  const [originalURL, setOriginalURL] = useState<string | null>(null);
  const [resultURL, setResultURL] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [progressStage, setProgressStage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [resultSize, setResultSize] = useState<string | null>(null);
  const [originalSize, setOriginalSize] = useState<string | null>(null);

  const cancelledRef = useRef(false);
  const originalURLRef = useRef<string | null>(null);
  const resultURLRef = useRef<string | null>(null);

  useEffect(() => { originalURLRef.current = originalURL; }, [originalURL]);
  useEffect(() => { resultURLRef.current = resultURL; }, [resultURL]);

  useEffect(() => {
    return () => {
      if (originalURLRef.current) revokeURL(originalURLRef.current);
      if (resultURLRef.current) revokeURL(resultURLRef.current);
    };
  }, []);

  const reset = useCallback(() => {
    cancelledRef.current = true;
    if (originalURL) revokeURL(originalURL);
    if (resultURL) revokeURL(resultURL);
    setStatus('idle');
    setOriginalURL(null);
    setResultURL(null);
    setProgress(0);
    setProgressStage('');
    setError(null);
    setOriginalFile(null);
    setResultSize(null);
    setOriginalSize(null);
  }, [originalURL, resultURL]);

  const handleFile = useCallback(async (file: File) => {
    cancelledRef.current = false;

    if (originalURL) revokeURL(originalURL);
    if (resultURL) revokeURL(resultURL);
    setOriginalURL(null);
    setResultURL(null);
    setProgress(0);
    setProgressStage('');
    setError(null);
    setResultSize(null);
    setOriginalSize(null);

    try {
      // Step 1: Validate
      setStatus('validating');
      const validation = validateImage(file);
      if (!validation.valid) {
        setError(validation.error ?? 'Invalid file');
        setStatus('error');
        return;
      }
      setOriginalFile(file);
      setOriginalSize(formatFileSize(file.size));

      // Show a preview from the original file immediately
      const previewURL = blobToURL(file);
      setOriginalURL(previewURL);

      // Step 2: Process locally in browser — no server upload needed
      setStatus('processing');
      setProgressStage('Initializing AI model...');
      setProgress(3);

      if (cancelledRef.current) return;

      const resultBlob = await processImage(file, (pct, stage) => {
        if (!cancelledRef.current) {
          setProgress(pct);
          setProgressStage(stage);
        }
      });

      if (cancelledRef.current) return;

      const rURL = blobToURL(resultBlob);
      setResultURL(rURL);
      setResultSize(formatFileSize(resultBlob.size));
      setStatus('done');
    } catch (err: unknown) {
      if (cancelledRef.current) return;
      console.error('[Removix] Processing error:', err);
      const message = mapError(err);
      if (message) {
        setError(message);
        setStatus('error');
      }
    }
  }, [originalURL, resultURL]);

  const updateResultURL = useCallback((newURL: string) => {
    if (resultURL) revokeURL(resultURL);
    setResultURL(newURL);
  }, [resultURL]);

  const updateResultSize = useCallback((size: string) => setResultSize(size), []);

  const downloadResult = useCallback((url?: string) => {
    const target = url ?? resultURL;
    if (!target) return;
    const link = document.createElement('a');
    link.href = target;
    link.download = 'removix-result.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [resultURL]);

  return {
    status,
    originalURL,
    resultURL,
    progress,
    progressStage,
    error,
    originalFile,
    resultSize,
    originalSize,
    timeEstimate: null,
    handleFile,
    reset,
    downloadResult,
    updateResultURL,
    updateResultSize,
  };
};
