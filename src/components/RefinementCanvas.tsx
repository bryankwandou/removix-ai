'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Eraser, PaintBucket, Undo2, Check, X, Minus, Plus } from 'lucide-react';

interface RefinementCanvasProps {
  originalURL: string;
  resultURL: string;
  onFinalize: (blob: Blob) => void;
  onCancel: () => void;
}

const RefinementCanvas: React.FC<RefinementCanvasProps> = ({
  originalURL,
  resultURL,
  onFinalize,
  onCancel,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const originalImgRef = useRef<HTMLImageElement | null>(null);
  const [mode, setMode] = useState<'erase' | 'restore'>('erase');
  const [brushSize, setBrushSize] = useState(30);
  const [softBrush, setSoftBrush] = useState(true);
  const [isDrawing, setIsDrawing] = useState(false);
  const historyRef = useRef<ImageData[]>([]);
  const MAX_HISTORY = 10;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const resultImg = new Image();
    const originalImg = new Image();
    originalImg.src = originalURL;
    originalImgRef.current = originalImg;

    resultImg.onload = () => {
      canvas.width = resultImg.naturalWidth;
      canvas.height = resultImg.naturalHeight;
      ctx.drawImage(resultImg, 0, 0);
      historyRef.current = [ctx.getImageData(0, 0, canvas.width, canvas.height)];
    };
    resultImg.src = resultURL;
  }, [resultURL, originalURL]);

  const saveHistory = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d', { willReadFrequently: true });
    if (!canvas || !ctx) return;
    const state = ctx.getImageData(0, 0, canvas.width, canvas.height);
    historyRef.current = [...historyRef.current.slice(-(MAX_HISTORY - 1)), state];
  }, []);

  const undo = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d', { willReadFrequently: true });
    if (!canvas || !ctx || historyRef.current.length < 2) return;
    historyRef.current.pop();
    const prev = historyRef.current[historyRef.current.length - 1];
    ctx.putImageData(prev, 0, 0);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        undo();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [undo]);

  const getCanvasPos = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  const applyBrush = useCallback(
    (clientX: number, clientY: number) => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d', { willReadFrequently: true });
      if (!canvas || !ctx) return;

      const { x, y } = getCanvasPos(clientX, clientY);
      const r = brushSize;
      const minX = Math.max(0, Math.floor(x - r));
      const maxX = Math.min(canvas.width - 1, Math.ceil(x + r));
      const minY = Math.max(0, Math.floor(y - r));
      const maxY = Math.min(canvas.height - 1, Math.ceil(y + r));
      const w = maxX - minX + 1;
      const h = maxY - minY + 1;
      if (w <= 0 || h <= 0) return;

      const region = ctx.getImageData(minX, minY, w, h);
      const data = region.data;

      let origData: Uint8ClampedArray | null = null;
      if (mode === 'restore' && originalImgRef.current?.complete) {
        const offscreen = document.createElement('canvas');
        offscreen.width = canvas.width;
        offscreen.height = canvas.height;
        const offCtx = offscreen.getContext('2d');
        if (offCtx) {
          offCtx.drawImage(originalImgRef.current, 0, 0);
          origData = offCtx.getImageData(minX, minY, w, h).data;
        }
      }

      for (let py = minY; py <= maxY; py++) {
        for (let px = minX; px <= maxX; px++) {
          const dx = px - x;
          const dy = py - y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > r) continue;
          const idx = ((py - minY) * w + (px - minX)) * 4;
          const strength = softBrush ? Math.max(0, 1 - dist / r) : 1;

          if (mode === 'erase') {
            data[idx + 3] = Math.round(data[idx + 3] * (1 - strength));
          } else if (origData) {
            data[idx] = Math.round(data[idx] * (1 - strength) + origData[idx] * strength);
            data[idx + 1] = Math.round(data[idx + 1] * (1 - strength) + origData[idx + 1] * strength);
            data[idx + 2] = Math.round(data[idx + 2] * (1 - strength) + origData[idx + 2] * strength);
            data[idx + 3] = Math.round(data[idx + 3] * (1 - strength) + 255 * strength);
          }
        }
      }
      ctx.putImageData(region, minX, minY);
    },
    [mode, brushSize, softBrush]
  );

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setIsDrawing(true);
    saveHistory();
    applyBrush(e.clientX, e.clientY);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDrawing) return;
    applyBrush(e.clientX, e.clientY);
  };

  const onPointerUp = () => setIsDrawing(false);

  const handleFinalize = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => { if (blob) onFinalize(blob); }, 'image/png');
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 px-2">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setMode('erase')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all ${mode === 'erase' ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/30' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}
          >
            <Eraser className="w-4 h-4" /> Erase
          </button>
          <button
            type="button"
            onClick={() => setMode('restore')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all ${mode === 'restore' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}
          >
            <PaintBucket className="w-4 h-4" /> Restore
          </button>

          <div className="flex items-center gap-1.5 bg-white/5 rounded-xl px-2 py-1">
            <button
              type="button"
              title="Decrease brush size"
              onClick={() => setBrushSize(s => Math.max(10, s - 10))}
              className="p-1 text-white/40 hover:text-white/80"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="text-[11px] font-mono text-white/40 w-12 text-center">{brushSize}px</span>
            <button
              type="button"
              title="Increase brush size"
              onClick={() => setBrushSize(s => Math.min(100, s + 10))}
              className="p-1 text-white/40 hover:text-white/80"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setSoftBrush(v => !v)}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${softBrush ? 'border-white/20 bg-white/10 text-white/70' : 'border-white/5 bg-white/5 text-white/30'}`}
          >
            {softBrush ? 'Soft' : 'Hard'}
          </button>

          <button
            type="button"
            onClick={undo}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 text-xs font-bold transition-all"
          >
            <Undo2 className="w-3.5 h-3.5" /> Undo
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button type="button" onClick={onCancel} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 font-bold text-sm">
            <X className="w-4 h-4" /> Cancel
          </button>
          <button type="button" onClick={handleFinalize} className="flex items-center gap-2 px-6 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold text-sm hover:scale-105 transition-all shadow-lg shadow-violet-500/20">
            <Check className="w-4 h-4" /> Done
          </button>
        </div>
      </div>

      <div
        className="relative rounded-[2rem] overflow-hidden border border-white/10"
        style={{
          backgroundImage: `linear-gradient(45deg,#111 25%,transparent 25%),linear-gradient(-45deg,#111 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#111 75%),linear-gradient(-45deg,transparent 75%,#111 75%)`,
          backgroundSize: '16px 16px',
          backgroundPosition: '0 0,0 8px,8px -8px,-8px 0px',
          backgroundColor: '#070707',
        }}
      >
        <canvas
          ref={canvasRef}
          className="w-full h-auto max-h-[65vh] object-contain touch-none"
          style={{ cursor: `crosshair`, willChange: 'contents' }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
        />
      </div>
      <p className="text-center text-xs text-white/20">Paint to refine edges · Ctrl+Z / Cmd+Z to undo</p>
    </div>
  );
};

export default RefinementCanvas;
