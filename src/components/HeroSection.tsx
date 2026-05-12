import React from 'react';

const HeroSection: React.FC = () => (
  <div className="rmx-hero">
    <div className="rmx-hero-bg" />
    <div className="rmx-hero-orb" style={{ width: 600, height: 600, top: -200, left: -100, background: 'var(--accent)' }} />
    <div className="rmx-hero-orb" style={{ width: 400, height: 400, bottom: -100, right: -50, background: 'var(--pink)' }} />

    <div className="rmx-hero-badge">
      <span className="rmx-hero-badge-dot" />
      AI-Powered Background Removal
    </div>

    <h1>
      Remove Backgrounds<br />
      <span className="grad">Instantly.</span> Perfectly.
    </h1>

    <p className="rmx-hero-sub">
      Upload any image — our AI cuts out the background in seconds with pixel-perfect precision.
      No Photoshop. No skills required. 100% free.
    </p>

    <div className="rmx-hero-trust">
      <span className="badge badge-dim">ISNet</span>
      <span className="badge badge-dim">WebGPU</span>
      <span className="badge badge-dim">Privacy First</span>
      <span className="badge badge-dim">ONNX Runtime</span>
      <span className="badge badge-dim">100% Browser</span>
    </div>
  </div>
);

export default HeroSection;
