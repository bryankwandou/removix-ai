import { useState, useCallback, useRef } from 'react';
import { validateImage, blobToURL, revokeURL, formatFileSize } from '@/lib/imageUtils';
import { processImage } from '@/lib/removeBackground';

export type BatchItemStatus = 'queued' | 'processing' | 'done' | 'error';

export interface BatchItem {
  id: string;
  file: File;
  status: BatchItemStatus;
  resultURL: string | null;
  resultBlob: Blob | null;
  error: string | null;
  progress: number;
  progressStage: string;
}

export const useBatchProcessing = () => {
  const [items, setItems] = useState<BatchItem[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [overallLabel, setOverallLabel] = useState('');
  const cancelledRef = useRef(false);

  const startBatch = useCallback(async (files: File[]) => {
    cancelledRef.current = false;
    const newItems: BatchItem[] = files.map((file, i) => ({
      id: `batch-${Date.now()}-${i}`,
      file,
      status: 'queued',
      resultURL: null,
      resultBlob: null,
      error: null,
      progress: 0,
      progressStage: '',
    }));
    setItems(newItems);
    setIsRunning(true);

    for (let i = 0; i < newItems.length; i++) {
      if (cancelledRef.current) break;
      const item = newItems[i];
      setOverallLabel(`Processing ${i + 1} of ${newItems.length}...`);

      setItems(prev => prev.map(it => it.id === item.id ? { ...it, status: 'processing', progress: 0 } : it));

      try {
        const validation = validateImage(item.file);
        if (!validation.valid) throw new Error(validation.error ?? 'Invalid file');

        if (cancelledRef.current) break;

        const resultBlob = await processImage(item.file, (pct, stage) => {
          if (!cancelledRef.current) {
            setItems(prev => prev.map(it => it.id === item.id ? { ...it, progress: pct, progressStage: stage } : it));
          }
        });

        if (cancelledRef.current) {
          revokeURL(blobToURL(resultBlob));
          break;
        }

        const resultURL = blobToURL(resultBlob);
        setItems(prev => prev.map(it =>
          it.id === item.id
            ? { ...it, status: 'done', resultURL, resultBlob, progress: 100, progressStage: 'Done' }
            : it
        ));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Processing failed';
        setItems(prev => prev.map(it =>
          it.id === item.id ? { ...it, status: 'error', error: message } : it
        ));
      }
    }

    setIsRunning(false);
    setOverallLabel('');
  }, []);

  const cancelBatch = useCallback(() => {
    cancelledRef.current = true;
    setIsRunning(false);
    setOverallLabel('');
  }, []);

  const reset = useCallback(() => {
    cancelledRef.current = true;
    items.forEach(it => { if (it.resultURL) revokeURL(it.resultURL); });
    setItems([]);
    setIsRunning(false);
    setOverallLabel('');
  }, [items]);

  const downloadItem = useCallback((item: BatchItem) => {
    if (!item.resultURL) return;
    const a = document.createElement('a');
    a.href = item.resultURL;
    a.download = `removix-${item.file.name.replace(/\.[^.]+$/, '')}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, []);

  const downloadAll = useCallback(async () => {
    const done = items.filter(it => it.status === 'done' && it.resultBlob);
    if (done.length < 2) return;

    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    done.forEach(it => {
      if (it.resultBlob) {
        zip.file(`removix-${it.file.name.replace(/\.[^.]+$/, '')}.png`, it.resultBlob);
      }
    });
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const url = blobToURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'removix-batch.zip';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    revokeURL(url);
  }, [items]);

  const doneCount = items.filter(it => it.status === 'done').length;

  return {
    items,
    isRunning,
    overallLabel,
    doneCount,
    startBatch,
    cancelBatch,
    reset,
    downloadItem,
    downloadAll,
    formatFileSize,
  };
};
