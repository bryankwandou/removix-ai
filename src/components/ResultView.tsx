/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { formatFileSize, blobToURL, revokeURL } from '@/lib/imageUtils';

const RefinementCanvas = dynamic(() => import('./RefinementCanvas'), { ssr: false });
const BackgroundPicker = dynamic(() => import('./BackgroundPicker'), { ssr: false });
const ZoomOverlay = dynamic(() => import('./ZoomOverlay'), { ssr: false });

interface ResultViewProps {
  original: string;
  result: string;
  resultSize: string | null;
  originalSize: string | null;
  originalFile: File | null;
  onDownload: (url?: string) => void;
  onReset: () => void;
  onResultUpdated?: (newURL: string, newSize: string) => void;
}

const DownloadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);
const RefreshIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
  </svg>
);
const PencilIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);
const LayersIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>
  </svg>
);
const ZoomInIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>
  </svg>
);
const CopyIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </svg>
);

export default function ResultView({
  original, result, resultSize, originalSize, originalFile, onDownload, onReset, onResultUpdated,
}: ResultViewProps) {
  const [sliderPos, setSliderPos] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [mode, setMode] = useState<'compare' | 'refine' | 'background'>('compare');
  const [showZoom, setShowZoom] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeURL, setActiveURL] = useState(result);
  const [activeSize, setActiveSize] = useState(resultSize);
  const containerRef = useRef<HTMLDivElement>(null);
  const supportsClipboard = typeof ClipboardItem !== 'undefined';

  useEffect(() => { setActiveURL(result); setActiveSize(resultSize); }, [result, resultSize]);

  const calcPos = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setSliderPos(Math.max(0, Math.min((clientX - rect.left) / rect.width * 100, 100)));
  }, []);

  useEffect(() => {
    if (!isDragging) return;
    const up = () => setIsDragging(false);
    const move = (e: MouseEvent) => calcPos(e.clientX);
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', up);
    return () => { document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up); };
  }, [isDragging, calcPos]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onTouch = (e: TouchEvent) => { e.preventDefault(); calcPos(e.touches[0].clientX); };
    el.addEventListener('touchmove', onTouch, { passive: false });
    return () => el.removeEventListener('touchmove', onTouch);
  }, [calcPos]);

  const handleCopy = useCallback(async () => {
    try {
      const res = await fetch(activeURL);
      const blob = await res.blob();
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  }, [activeURL]);

  const handleRefineFinalize = useCallback((blob: Blob) => {
    const newURL = blobToURL(blob);
    const newSize = formatFileSize(blob.size);
    if (activeURL !== result) revokeURL(activeURL);
    setActiveURL(newURL); setActiveSize(newSize);
    onResultUpdated?.(newURL, newSize);
    setMode('compare');
  }, [activeURL, result, onResultUpdated]);

  const handleBgComposite = useCallback((blob: Blob) => {
    const newURL = blobToURL(blob);
    const newSize = formatFileSize(blob.size);
    if (activeURL !== result) revokeURL(activeURL);
    setActiveURL(newURL); setActiveSize(newSize);
    onResultUpdated?.(newURL, newSize);
  }, [activeURL, result, onResultUpdated]);

  if (mode === 'refine') {
    return <RefinementCanvas originalURL={original} resultURL={result} onFinalize={handleRefineFinalize} onCancel={() => setMode('compare')} />;
  }

  return (
    <div className="rmx-result-view page-fade">
      {showZoom && <ZoomOverlay imageURL={activeURL} onClose={() => setShowZoom(false)} />}

      {/* Header */}
      <div className="rmx-result-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
            <span className="rmx-result-title">Background Removed</span>
            <span className="badge badge-green">✓ Done</span>
          </div>
          <div className="rmx-result-meta">
            {originalFile?.name && `${originalFile.name} → `}PNG
            {activeSize && ` · ${activeSize}`}
            {originalSize && activeSize && originalSize !== activeSize && ` (was ${originalSize})`}
          </div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={onReset}>
          <RefreshIcon /> Remove Another
        </button>
      </div>

      {/* Mode tabs */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
        <div className="rmx-mode-tabs">
          {(['compare', 'refine', 'background'] as const).map(m => (
            <button
              key={m}
              className={`rmx-mode-tab${mode === m ? ' active' : ''}`}
              onClick={() => setMode(m)}
            >
              {m === 'refine' && <PencilIcon />}
              {m === 'background' && <LayersIcon />}
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </button>
          ))}
          <button
            className={`rmx-mode-tab${showZoom ? ' active' : ''}`}
            onClick={() => setShowZoom(true)}
            title="Zoom inspect"
          >
            <ZoomInIcon /> Zoom
          </button>
          {supportsClipboard && (
            <button
              className={`rmx-mode-tab${copied ? ' active' : ''}`}
              onClick={handleCopy}
            >
              <CopyIcon /> {copied ? 'Copied!' : 'Copy'}
            </button>
          )}
        </div>
      </div>

      {/* Background picker */}
      {mode === 'background' && (
        <BackgroundPicker resultURL={activeURL} onComposite={handleBgComposite} />
      )}

      {/* Comparison slider */}
      <div
        ref={containerRef}
        className="rmx-comparison rmx-checker"
        style={{ aspectRatio: '4/3', maxHeight: 600, touchAction: 'none' }}
        onMouseDown={(e) => { setIsDragging(true); calcPos(e.clientX); }}
        onTouchStart={(e) => calcPos(e.touches[0].clientX)}
      >
        <img src={original} alt="Original" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' }} draggable={false} />

        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}>
          <img src={activeURL} alt="Result" style={{ width: '100%', height: '100%', objectFit: 'contain' }} draggable={false} />
        </div>

        {/* Divider */}
        <div
          className="rmx-comparison-divider"
          style={{ left: `${sliderPos}%` }}
        >
          <div className="rmx-comparison-handle">
            <div style={{ display: 'flex', gap: 3 }}>
              <div style={{ width: 2, height: 16, background: 'rgba(0,0,0,0.2)', borderRadius: 2 }} />
              <div style={{ width: 2, height: 16, background: 'rgba(0,0,0,0.2)', borderRadius: 2 }} />
            </div>
          </div>
        </div>

        {/* Labels */}
        <div className="rmx-comparison-label" style={{ left: 16 }}>Original</div>
        <div className="rmx-comparison-label" style={{ right: 16, background: 'rgba(124,92,252,0.75)', color: '#fff' }}>Removix</div>
      </div>

      <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text3)', marginTop: 10 }}>
        Drag to compare · Your image never left your device
      </p>

      {/* Actions */}
      <div className="rmx-result-actions">
        <button className="btn-download" onClick={() => onDownload(activeURL)}>
          <DownloadIcon /> Download PNG
        </button>
        <button className="btn btn-ghost" onClick={onReset}>
          <RefreshIcon /> Remove Another
        </button>
      </div>
    </div>
  );
}
