/* eslint-disable @next/next/no-img-element */
'use client';

import React from 'react';

interface ProcessingViewProps {
  progress: number;
  stage: string;
  originalURL: string | null;
  timeEstimate: string | null;
}

function RingProgress({ pct }: { pct: number }) {
  const r = 34, c = 2 * Math.PI * r;
  return (
    <div className="rmx-ring">
      <div className="rmx-ring-pulse" />
      <svg width="88" height="88" viewBox="0 0 88 88">
        <defs>
          <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--accent)" />
            <stop offset="100%" stopColor="var(--pink)" />
          </linearGradient>
        </defs>
        <circle className="rmx-ring-bg" cx="44" cy="44" r={r} />
        <circle
          className="rmx-ring-fill"
          cx="44" cy="44" r={r}
          strokeDasharray={c}
          strokeDashoffset={c - (pct / 100) * c}
          style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}
        />
      </svg>
      <div className="rmx-ring-pct">{Math.round(pct)}%</div>
    </div>
  );
}

const ShieldIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);

const ProcessingView: React.FC<ProcessingViewProps> = ({ progress, stage, originalURL, timeEstimate }) => {
  const isDownloading = stage.toLowerCase().includes('download');

  return (
    <div className="rmx-processing-view">
      <div className="rmx-processing-card">
        {originalURL && (
          <div className="rmx-processing-thumb">
            <img src={originalURL} alt="Original" />
            <div className="rmx-processing-thumb-overlay">
              <RingProgress pct={progress} />
            </div>
          </div>
        )}
        {!originalURL && (
          <div style={{ height: 80, background: 'var(--bg2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <RingProgress pct={progress} />
          </div>
        )}

        <div className="rmx-processing-body">
          <div className="rmx-stage-label">{stage || 'Starting…'}</div>

          <div className="rmx-progress-track">
            <div className="rmx-progress-fill" style={{ width: `${progress}%` }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text3)', fontFamily: 'var(--mono)', marginBottom: 16 }}>
            <span>{progress}%</span>
            {isDownloading ? (
              <span style={{ color: 'var(--accent2)' }}>~40 MB · First-run only</span>
            ) : timeEstimate ? (
              <span>Est. {timeEstimate}</span>
            ) : null}
          </div>

          {isDownloading && (
            <div style={{
              padding: '12px 16px', borderRadius: 'var(--radius-sm)',
              background: 'rgba(124,92,252,0.08)', border: '1px solid rgba(124,92,252,0.2)',
              marginBottom: 16,
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent2)', marginBottom: 4 }}>Downloading AI model (~40 MB)</div>
              <div style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.5 }}>
                One-time download — cached in your browser for instant future use.
              </div>
            </div>
          )}

          <div className="rmx-privacy-note">
            <ShieldIcon />
            <span>Your image never leaves your device</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProcessingView;
