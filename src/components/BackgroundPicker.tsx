'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';

const PRESET_COLORS = [
  '#ffffff', '#f5f5f0', '#d1d5db', '#4b5563',
  '#000000', '#0ea5e9', '#16a34a', '#f97316',
  '#a78bfa', '#f59e0b', '#6366f1', 'transparent',
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

type Tab = 'transparent' | 'solid' | 'gradient';

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
  const [format, setFormat] = useState<'png' | 'jpeg'>('png');
  const compositeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const composite = useCallback(() => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      if (tab === 'solid' && solidColor !== 'transparent') {
        ctx.fillStyle = solidColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else if (tab === 'gradient') {
        const dirs: Record<string, [number, number, number, number]> = {
          'to bottom':       [0, 0, 0, canvas.height],
          'to top':          [0, canvas.height, 0, 0],
          'to right':        [0, 0, canvas.width, 0],
          'to left':         [canvas.width, 0, 0, 0],
          'to bottom right': [0, 0, canvas.width, canvas.height],
          'to bottom left':  [canvas.width, 0, 0, canvas.height],
          'to top right':    [0, canvas.height, canvas.width, 0],
          'to top left':     [canvas.width, canvas.height, 0, 0],
        };
        const [x0, y0, x1, y1] = dirs[gradDir] ?? [0, 0, canvas.width, canvas.height];
        const grad = ctx.createLinearGradient(x0, y0, x1, y1);
        grad.addColorStop(0, gradColor1);
        grad.addColorStop(1, gradColor2);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      ctx.drawImage(img, 0, 0);

      const mimeType = tab === 'transparent' || format === 'png' ? 'image/png' : 'image/jpeg';
      canvas.toBlob((blob) => { if (blob) onComposite(blob); }, mimeType, 0.95);
    };
    img.src = resultURL;
  }, [tab, solidColor, gradColor1, gradColor2, gradDir, format, resultURL, onComposite]);

  // Debounce compositing so color pickers don't thrash
  useEffect(() => {
    if (compositeTimerRef.current) clearTimeout(compositeTimerRef.current);
    compositeTimerRef.current = setTimeout(composite, 150);
    return () => { if (compositeTimerRef.current) clearTimeout(compositeTimerRef.current); };
  }, [composite]);

  const tabs: { id: Tab; label: string }[] = [
    { id: 'transparent', label: 'Transparent' },
    { id: 'solid', label: 'Solid Color' },
    { id: 'gradient', label: 'Gradient' },
  ];

  return (
    <div className="w-full max-w-2xl mx-auto rounded-3xl bg-white/[0.03] border border-white/10 p-6 space-y-5">
      <div className="flex items-center gap-3">
        <span className="text-xs font-bold uppercase tracking-widest text-white/40">Background</span>
        <div className="flex gap-1 bg-white/5 rounded-xl p-1">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${tab === t.id ? 'bg-violet-600 text-white' : 'text-white/40 hover:text-white/70'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'transparent' && (
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl border border-white/10"
            style={{
              backgroundImage: 'linear-gradient(45deg,#333 25%,transparent 25%),linear-gradient(-45deg,#333 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#333 75%),linear-gradient(-45deg,transparent 75%,#333 75%)',
              backgroundSize: '8px 8px',
              backgroundPosition: '0 0,0 4px,4px -4px,-4px 0px',
              backgroundColor: '#1a1a1a',
            }}
          />
          <span className="text-sm text-white/50">PNG with transparency (default)</span>
        </div>
      )}

      {tab === 'solid' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {PRESET_COLORS.map(color => (
              <button
                key={color}
                onClick={() => setSolidColor(color)}
                className={`w-8 h-8 rounded-xl border-2 transition-all ${solidColor === color ? 'border-violet-400 scale-110' : 'border-transparent hover:border-white/30'}`}
                style={
                  color === 'transparent'
                    ? {
                        backgroundImage: 'linear-gradient(45deg,#555 25%,transparent 25%),linear-gradient(-45deg,#555 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#555 75%),linear-gradient(-45deg,transparent 75%,#555 75%)',
                        backgroundSize: '8px 8px',
                        backgroundPosition: '0 0,0 4px,4px -4px,-4px 0px',
                        backgroundColor: '#222',
                      }
                    : { backgroundColor: color }
                }
                title={color}
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
          <div className="flex items-center gap-3">
            <span className="text-xs text-white/40">Format:</span>
            {(['png', 'jpeg'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFormat(f)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${format === f ? 'bg-white/15 text-white' : 'text-white/30 hover:text-white/60'}`}
              >
                {f.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      )}

      {tab === 'gradient' && (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] text-white/30 uppercase font-bold">Start</span>
              <input type="color" value={gradColor1} onChange={e => setGradColor1(e.target.value)} className="w-10 h-10 rounded-xl cursor-pointer border border-white/10 bg-transparent overflow-hidden" />
            </div>
            <div
              className="flex-1 h-10 rounded-xl"
              style={{ background: `linear-gradient(${gradDir}, ${gradColor1}, ${gradColor2})` }}
            />
            <div className="flex flex-col gap-1.5 items-end">
              <span className="text-[10px] text-white/30 uppercase font-bold">End</span>
              <input type="color" value={gradColor2} onChange={e => setGradColor2(e.target.value)} className="w-10 h-10 rounded-xl cursor-pointer border border-white/10 bg-transparent overflow-hidden" />
            </div>
          </div>

          <div className="space-y-1.5">
            <span className="text-[10px] text-white/30 uppercase font-bold">Direction</span>
            <div className="flex flex-wrap gap-1.5">
              {GRADIENT_DIRECTIONS.map(d => (
                <button
                  key={d.value}
                  onClick={() => setGradDir(d.value)}
                  className={`w-9 h-9 rounded-lg text-sm font-bold transition-all ${gradDir === d.value ? 'bg-violet-600 text-white' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-white/40">Format:</span>
            {(['png', 'jpeg'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFormat(f)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${format === f ? 'bg-white/15 text-white' : 'text-white/30 hover:text-white/60'}`}
              >
                {f.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BackgroundPicker;
