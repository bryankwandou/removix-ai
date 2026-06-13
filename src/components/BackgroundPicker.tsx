'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';

// ─── Preset solid colors ────────────────────────────────────────────────────
const PRESET_COLORS = [
  '#ffffff', '#f5f5f0', '#d1d5db', '#4b5563',
  '#000000', '#0ea5e9', '#16a34a', '#f97316',
  '#a78bfa', '#f59e0b', '#6366f1', 'transparent',
];

// ─── Preset studio backdrops (gradient-based) ───────────────────────────────
const PRESET_BACKDROPS = [
  { id: 'studio-white',    label: 'Studio White',  from: '#f8f8f8', to: '#e8e8e8', dir: 'to bottom' },
  { id: 'studio-gray',     label: 'Studio Gray',   from: '#9ca3af', to: '#4b5563', dir: 'to bottom' },
  { id: 'studio-dark',     label: 'Studio Dark',   from: '#1f2937', to: '#111827', dir: 'to bottom' },
  { id: 'sky',             label: 'Sky Blue',      from: '#bfdbfe', to: '#93c5fd', dir: 'to bottom' },
  { id: 'sunset',          label: 'Sunset',        from: '#fbbf24', to: '#f87171', dir: 'to bottom right' },
  { id: 'forest',          label: 'Forest',        from: '#166534', to: '#4ade80', dir: 'to bottom' },
  { id: 'ocean',           label: 'Deep Ocean',    from: '#1e3a5f', to: '#0ea5e9', dir: 'to bottom' },
  { id: 'rose',            label: 'Rose',          from: '#be185d', to: '#fda4af', dir: 'to bottom right' },
  { id: 'aurora',          label: 'Aurora',        from: '#6d28d9', to: '#06b6d4', dir: 'to bottom right' },
  { id: 'gold',            label: 'Gold',          from: '#78350f', to: '#fbbf24', dir: 'to bottom right' },
  { id: 'cherry',          label: 'Cherry',        from: '#991b1b', to: '#fca5a5', dir: 'to bottom' },
  { id: 'mint',            label: 'Mint',          from: '#065f46', to: '#6ee7b7', dir: 'to bottom' },
];

const GRADIENT_DIRECTIONS = [
  { label: '↓', value: 'to bottom' },
  { label: '↑', value: 'to top' },
  { label: '→', value: 'to right' },
  { label: '←', value: 'to left' },
  { label: '↘', value: 'to bottom right' },
  { label: '↙', value: 'to bottom left' },
  { label: '↗', value: 'to top right' },
  { label: '↖', value: 'to top left' },
];

type Tab = 'transparent' | 'solid' | 'gradient' | 'backdrop' | 'image';
type ImageFit = 'cover' | 'contain' | 'stretch';

interface BackgroundPickerProps {
  resultURL: string;
  onComposite: (blob: Blob) => void;
}

const BackgroundPicker: React.FC<BackgroundPickerProps> = ({ resultURL, onComposite }) => {
  const [tab, setTab] = useState<Tab>('transparent');
  const [solidColor, setSolidColor] = useState('#ffffff');
  const [gradColor1, setGradColor1] = useState('#7c3aed');
  const [gradColor2, setGradColor2] = useState('#06b6d4');
  const [gradDir, setGradDir] = useState('to bottom right');
  const [backdropId, setBackdropId] = useState<string | null>(null);
  const [bgImageSrc, setBgImageSrc] = useState<string | null>(null);
  const [bgImageEl, setBgImageEl] = useState<HTMLImageElement | null>(null);
  const [imageFit, setImageFit] = useState<ImageFit>('cover');
  const [isDragging, setIsDragging] = useState(false);
  const [format, setFormat] = useState<'png' | 'jpeg'>('png');
  const compositeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clean up image object URL when it changes or unmounts
  useEffect(() => {
    return () => { if (bgImageSrc) URL.revokeObjectURL(bgImageSrc); };
  }, [bgImageSrc]);

  // Handle background image file
  const handleBgFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    if (bgImageSrc) URL.revokeObjectURL(bgImageSrc);
    const src = URL.createObjectURL(file);
    setBgImageSrc(src);
    const img = new Image();
    img.onload = () => setBgImageEl(img);
    img.src = src;
  }, [bgImageSrc]);

  // ─── Composite function ──────────────────────────────────────────────────
  const composite = useCallback(() => {
    const resultImg = new Image();

    resultImg.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = resultImg.naturalWidth;
      canvas.height = resultImg.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const W = canvas.width;
      const H = canvas.height;

      if (tab === 'solid' && solidColor !== 'transparent') {
        ctx.fillStyle = solidColor;
        ctx.fillRect(0, 0, W, H);

      } else if (tab === 'gradient') {
        const dirs: Record<string, [number, number, number, number]> = {
          'to bottom':       [0, 0, 0, H],
          'to top':          [0, H, 0, 0],
          'to right':        [0, 0, W, 0],
          'to left':         [W, 0, 0, 0],
          'to bottom right': [0, 0, W, H],
          'to bottom left':  [W, 0, 0, H],
          'to top right':    [0, H, W, 0],
          'to top left':     [W, H, 0, 0],
        };
        const [x0, y0, x1, y1] = dirs[gradDir] ?? [0, 0, W, H];
        const grad = ctx.createLinearGradient(x0, y0, x1, y1);
        grad.addColorStop(0, gradColor1);
        grad.addColorStop(1, gradColor2);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

      } else if (tab === 'backdrop' && backdropId) {
        const preset = PRESET_BACKDROPS.find(p => p.id === backdropId);
        if (preset) {
          const dirs2: Record<string, [number, number, number, number]> = {
            'to bottom':       [0, 0, 0, H],
            'to top':          [0, H, 0, 0],
            'to right':        [0, 0, W, 0],
            'to bottom right': [0, 0, W, H],
          };
          const [bx0, by0, bx1, by1] = dirs2[preset.dir] ?? [0, 0, 0, H];
          const g = ctx.createLinearGradient(bx0, by0, bx1, by1);
          g.addColorStop(0, preset.from);
          g.addColorStop(1, preset.to);
          ctx.fillStyle = g;
          ctx.fillRect(0, 0, W, H);
        }

      } else if (tab === 'image' && bgImageEl) {
        // Fill letterbox with black first (used by 'contain' mode)
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, W, H);

        if (imageFit === 'cover') {
          const scale = Math.max(W / bgImageEl.naturalWidth, H / bgImageEl.naturalHeight);
          const sw = bgImageEl.naturalWidth  * scale;
          const sh = bgImageEl.naturalHeight * scale;
          ctx.drawImage(bgImageEl, (W - sw) / 2, (H - sh) / 2, sw, sh);
        } else if (imageFit === 'contain') {
          const scale = Math.min(W / bgImageEl.naturalWidth, H / bgImageEl.naturalHeight);
          const sw = bgImageEl.naturalWidth  * scale;
          const sh = bgImageEl.naturalHeight * scale;
          ctx.drawImage(bgImageEl, (W - sw) / 2, (H - sh) / 2, sw, sh);
        } else {
          ctx.drawImage(bgImageEl, 0, 0, W, H);
        }
      }

      // Layer the transparent result on top
      ctx.drawImage(resultImg, 0, 0);

      const mimeType = (tab === 'transparent') || format === 'png' ? 'image/png' : 'image/jpeg';
      canvas.toBlob((blob) => { if (blob) onComposite(blob); }, mimeType, 0.95);
    };

    resultImg.src = resultURL;
  }, [tab, solidColor, gradColor1, gradColor2, gradDir, backdropId, bgImageEl, imageFit, format, resultURL, onComposite]);

  // Debounce — don't thrash canvas on rapid slider moves
  useEffect(() => {
    if (compositeTimerRef.current) clearTimeout(compositeTimerRef.current);
    compositeTimerRef.current = setTimeout(composite, 150);
    return () => { if (compositeTimerRef.current) clearTimeout(compositeTimerRef.current); };
  }, [composite]);

  // ─── Drag & drop for image tab ───────────────────────────────────────────
  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleBgFile(file);
  }, [handleBgFile]);

  const tabs: { id: Tab; label: string; emoji: string }[] = [
    { id: 'transparent', label: 'Transparent', emoji: '◻' },
    { id: 'solid',       label: 'Color',       emoji: '🎨' },
    { id: 'gradient',    label: 'Gradient',    emoji: '🌈' },
    { id: 'backdrop',    label: 'Backdrops',   emoji: '🖼' },
    { id: 'image',       label: 'Upload Image',emoji: '📷' },
  ];

  return (
    <div className="w-full max-w-2xl mx-auto rounded-3xl bg-white/[0.03] border border-white/10 p-6 space-y-5">
      {/* Tab bar */}
      <div className="flex flex-wrap gap-1 bg-white/5 rounded-2xl p-1">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 min-w-[80px] px-2 py-2 rounded-xl text-[11px] font-bold transition-all ${tab === t.id ? 'bg-violet-600 text-white shadow-lg' : 'text-white/40 hover:text-white/70'}`}
          >
            {t.emoji} {t.label}
          </button>
        ))}
      </div>

      {/* ── Transparent ──────────────────────────────────────────────── */}
      {tab === 'transparent' && (
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-xl border border-white/10"
            style={{
              backgroundImage: 'linear-gradient(45deg,#333 25%,transparent 25%),linear-gradient(-45deg,#333 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#333 75%),linear-gradient(-45deg,transparent 75%,#333 75%)',
              backgroundSize: '8px 8px',
              backgroundPosition: '0 0,0 4px,4px -4px,-4px 0px',
              backgroundColor: '#1a1a1a',
            }}
          />
          <div>
            <div className="text-sm text-white/70 font-bold">PNG with transparency</div>
            <div className="text-xs text-white/30 mt-0.5">Perfect for overlays, stickers & web use</div>
          </div>
        </div>
      )}

      {/* ── Solid color ───────────────────────────────────────────────── */}
      {tab === 'solid' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {PRESET_COLORS.map(color => (
              <button
                key={color}
                onClick={() => setSolidColor(color)}
                title={color}
                className={`w-8 h-8 rounded-xl border-2 transition-all ${solidColor === color ? 'border-violet-400 scale-110 shadow-lg shadow-violet-500/30' : 'border-transparent hover:border-white/30'}`}
                style={color === 'transparent' ? {
                  backgroundImage: 'linear-gradient(45deg,#555 25%,transparent 25%),linear-gradient(-45deg,#555 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#555 75%),linear-gradient(-45deg,transparent 75%,#555 75%)',
                  backgroundSize: '8px 8px',
                  backgroundPosition: '0 0,0 4px,4px -4px,-4px 0px',
                  backgroundColor: '#222',
                } : { backgroundColor: color }}
              />
            ))}
            <input
              type="color"
              value={solidColor === 'transparent' ? '#ffffff' : solidColor}
              onChange={e => setSolidColor(e.target.value)}
              className="w-8 h-8 rounded-xl cursor-pointer border border-white/10 bg-transparent overflow-hidden"
              title="Custom color"
            />
          </div>
          <FormatToggle format={format} onChange={setFormat} />
        </div>
      )}

      {/* ── Gradient ──────────────────────────────────────────────────── */}
      {tab === 'gradient' && (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] text-white/30 uppercase font-bold">Start</span>
              <input type="color" value={gradColor1} onChange={e => setGradColor1(e.target.value)} className="w-10 h-10 rounded-xl cursor-pointer border border-white/10 bg-transparent overflow-hidden" />
            </div>
            <div className="flex-1 h-12 rounded-xl shadow-inner" style={{ background: `linear-gradient(${gradDir}, ${gradColor1}, ${gradColor2})` }} />
            <div className="flex flex-col gap-1.5 items-end">
              <span className="text-[10px] text-white/30 uppercase font-bold">End</span>
              <input type="color" value={gradColor2} onChange={e => setGradColor2(e.target.value)} className="w-10 h-10 rounded-xl cursor-pointer border border-white/10 bg-transparent overflow-hidden" />
            </div>
          </div>
          <div className="space-y-1.5">
            <span className="text-[10px] text-white/30 uppercase font-bold">Direction</span>
            <div className="flex flex-wrap gap-1.5">
              {GRADIENT_DIRECTIONS.map(d => (
                <button key={d.value} onClick={() => setGradDir(d.value)}
                  className={`w-9 h-9 rounded-lg text-sm font-bold transition-all ${gradDir === d.value ? 'bg-violet-600 text-white' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}>
                  {d.label}
                </button>
              ))}
            </div>
          </div>
          <FormatToggle format={format} onChange={setFormat} />
        </div>
      )}

      {/* ── Studio Backdrops ──────────────────────────────────────────── */}
      {tab === 'backdrop' && (
        <div className="space-y-4">
          <p className="text-xs text-white/30">Professional studio backgrounds — click to apply instantly</p>
          <div className="grid grid-cols-4 gap-2">
            {PRESET_BACKDROPS.map(p => (
              <button
                key={p.id}
                onClick={() => setBackdropId(p.id)}
                title={p.label}
                className={`relative h-16 rounded-xl overflow-hidden border-2 transition-all ${backdropId === p.id ? 'border-violet-400 scale-105 shadow-lg shadow-violet-500/30' : 'border-transparent hover:border-white/20'}`}
                style={{ background: `linear-gradient(${p.dir}, ${p.from}, ${p.to})` }}
              >
                <span className="absolute bottom-1 left-0 right-0 text-center text-[9px] font-bold text-white/70"
                  style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
                  {p.label}
                </span>
              </button>
            ))}
          </div>
          <FormatToggle format={format} onChange={setFormat} />
        </div>
      )}

      {/* ── Upload Image ──────────────────────────────────────────────── */}
      {tab === 'image' && (
        <div className="space-y-4">
          {/* Drop zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
            className={`relative flex flex-col items-center justify-center gap-3 h-36 rounded-2xl border-2 border-dashed cursor-pointer transition-all ${isDragging ? 'border-violet-400 bg-violet-500/10' : 'border-white/10 hover:border-white/30 hover:bg-white/5'}`}
          >
            {bgImageSrc ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={bgImageSrc}
                  alt="Background preview"
                  className="absolute inset-0 w-full h-full object-cover rounded-2xl opacity-40"
                />
                <div className="relative z-10 flex flex-col items-center gap-1.5">
                  <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-white text-lg">✓</div>
                  <span className="text-xs font-bold text-white/80">Background loaded</span>
                  <span className="text-[10px] text-white/40">Click or drop to replace</span>
                </div>
              </>
            ) : (
              <>
                <div className="text-3xl">📷</div>
                <div className="text-center">
                  <div className="text-sm font-bold text-white/70">Drop your background here</div>
                  <div className="text-xs text-white/30 mt-0.5">or click to browse — JPG, PNG, WebP</div>
                </div>
              </>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleBgFile(f); e.target.value = ''; }}
          />

          {/* Fit mode */}
          {bgImageEl && (
            <div className="space-y-2">
              <span className="text-[10px] text-white/30 uppercase font-bold">Image Fit</span>
              <div className="flex gap-2">
                {(['cover', 'contain', 'stretch'] as const).map(fit => (
                  <button key={fit} onClick={() => setImageFit(fit)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${imageFit === fit ? 'bg-violet-600 text-white' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}>
                    {fit.charAt(0).toUpperCase() + fit.slice(1)}
                  </button>
                ))}
              </div>
              <div className="text-[10px] text-white/25 mt-1">
                {imageFit === 'cover' && 'Fills the entire area, may crop edges'}
                {imageFit === 'contain' && 'Fits entirely, adds black letterbox'}
                {imageFit === 'stretch' && 'Stretches to fill — may distort proportions'}
              </div>
            </div>
          )}

          <FormatToggle format={format} onChange={setFormat} />
        </div>
      )}
    </div>
  );
};

// ─── Shared format toggle ────────────────────────────────────────────────────
function FormatToggle({ format, onChange }: { format: 'png' | 'jpeg'; onChange: (f: 'png' | 'jpeg') => void }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-white/40">Export as:</span>
      {(['png', 'jpeg'] as const).map(f => (
        <button key={f} onClick={() => onChange(f)}
          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${format === f ? 'bg-white/15 text-white' : 'text-white/30 hover:text-white/60'}`}>
          {f.toUpperCase()}
        </button>
      ))}
      {format === 'png' && <span className="text-[10px] text-white/20">Lossless · supports transparency</span>}
      {format === 'jpeg' && <span className="text-[10px] text-white/20">Smaller file · no transparency</span>}
    </div>
  );
}

export default BackgroundPicker;
