import React from 'react';

export default function ChangelogPage() {
  return (
    <div className="rmx-page">
      <div className="rmx-page-inner rmx-page-narrow">
        <div className="rmx-page-header">
          <span className="badge badge-dim">Changelog</span>
          <h1>Changelog</h1>
          <p>Release history and what&apos;s new in Removix.</p>
        </div>

        <div className="rmx-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, color: 'var(--text)' }}>v1.1.0</div>
            <span className="badge badge-green">Latest</span>
          </div>
          <div style={{ fontSize: 13, color: 'var(--text3)', fontFamily: 'var(--mono)', marginBottom: 16 }}>2026-05-07</div>
          <ul className="rmx-bullet-list">
            <li>Server-side background removal API route for improved compatibility</li>
            <li>Fixed &quot;Invalid base URL&quot; crash on initialization</li>
            <li>Upgraded to Next.js 15.5 with improved build stability</li>
            <li>Redesigned UI matching clean reference design system</li>
            <li>Added multi-page navigation: Settings, Pricing, Docs, About, and more</li>
            <li>Dark/light theme toggle with system preference detection</li>
            <li>Language toggle (EN / ID)</li>
          </ul>
        </div>

        <div className="rmx-card">
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, color: 'var(--text)', marginBottom: 12 }}>v1.0.0</div>
          <div style={{ fontSize: 13, color: 'var(--text3)', fontFamily: 'var(--mono)', marginBottom: 16 }}>2026-04-20</div>
          <ul className="rmx-bullet-list">
            <li>Initial production release</li>
            <li>ISNet fp16 background removal via ONNX Runtime Web</li>
            <li>WebGPU acceleration with WASM fallback</li>
            <li>Single image and batch processing (up to 10 files)</li>
            <li>Comparison slider, edge refinement, background picker</li>
            <li>PNG download with transparency</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
