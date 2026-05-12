/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { X, ZoomIn, ZoomOut } from 'lucide-react';

interface ZoomOverlayProps {
  imageURL: string;
  onClose: () => void;
}

const ZoomOverlay: React.FC<ZoomOverlayProps> = ({ imageURL, onClose }) => {
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const clampScale = (s: number) => Math.min(4, Math.max(1, s));

  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setScale(s => clampScale(s - e.deltaY * 0.002));
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    if (scale <= 1) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setIsPanning(true);
    lastPos.current = { x: e.clientX, y: e.clientY };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isPanning) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    lastPos.current = { x: e.clientX, y: e.clientY };
    setPan(p => ({ x: p.x + dx, y: p.y + dy }));
  };

  const onPointerUp = () => setIsPanning(false);

  // Reset pan when scale goes to 1
  useEffect(() => {
    if (scale === 1) setPan({ x: 0, y: 0 });
  }, [scale]);

  // Pinch-to-zoom
  const lastPinchDist = useRef<number | null>(null);
  const onTouchMove = useCallback((e: TouchEvent) => {
    if (e.touches.length !== 2) return;
    e.preventDefault();
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (lastPinchDist.current !== null) {
      const delta = dist - lastPinchDist.current;
      setScale(s => clampScale(s + delta * 0.01));
    }
    lastPinchDist.current = dist;
  }, []);

  const onTouchEnd = () => { lastPinchDist.current = null; };

  useEffect(() => {
    const el = overlayRef.current;
    if (!el) return;
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd);
    return () => {
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, [onTouchMove]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center"
      onClick={handleBackdropClick}
      onWheel={onWheel}
    >
      {/* Controls */}
      <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
        <button
          onClick={() => setScale(s => clampScale(s + 0.5))}
          className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => setScale(s => clampScale(s - 0.5))}
          className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <span className="px-3 py-1.5 rounded-xl bg-white/5 text-white/50 text-xs font-mono">
          {Math.round(scale * 100)}%
        </span>
        <button
          onClick={onClose}
          className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Image */}
      <div
        className="relative"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
          cursor: scale > 1 ? (isPanning ? 'grabbing' : 'grab') : 'default',
          transition: isPanning ? 'none' : 'transform 0.1s ease-out',
          touchAction: 'none',
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        <div
          className="max-w-[90vw] max-h-[90vh] rounded-2xl overflow-hidden"
          style={{
            backgroundImage: `linear-gradient(45deg,#222 25%,transparent 25%),linear-gradient(-45deg,#222 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#222 75%),linear-gradient(-45deg,transparent 75%,#222 75%)`,
            backgroundSize: '16px 16px',
            backgroundPosition: '0 0,0 8px,8px -8px,-8px 0px',
            backgroundColor: '#111',
          }}
        >
          <img
            src={imageURL}
            alt="Zoom inspect"
            className="max-w-[90vw] max-h-[90vh] object-contain pointer-events-none select-none"
            draggable={false}
          />
        </div>
      </div>

      <p className="absolute bottom-4 text-xs text-white/30">
        Scroll to zoom · Drag to pan · Press Escape to close
      </p>
    </div>
  );
};

export default ZoomOverlay;
