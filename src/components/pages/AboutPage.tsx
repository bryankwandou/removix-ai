import React from 'react';

const tech = [
  { n: 'ISNet fp16', d: 'State-of-the-art background segmentation' },
  { n: 'ONNX Runtime Web', d: 'Browser inference engine' },
  { n: 'WebGPU', d: 'GPU-accelerated inference' },
  { n: 'WebAssembly SIMD', d: 'CPU fallback, no GPU required' },
  { n: 'Next.js 15', d: 'App Router + Server Components' },
  { n: 'TypeScript', d: 'Type-safe everywhere' },
];

export default function AboutPage() {
  return (
    <div className="rmx-page">
      <div className="rmx-page-inner rmx-page-narrow">
        <div className="rmx-page-header">
          <span className="badge badge-purple">About</span>
          <h1>About Removix</h1>
          <p>Open-source AI background removal that runs 100% in your browser.</p>
        </div>

        <p className="rmx-lead">
          Removix is a production-grade background removal tool powered by ISNet — the same neural network architecture
          used by professional tools — running entirely in your browser via ONNX Runtime Web with WebGPU acceleration.
        </p>
        <p className="rmx-lead">
          Your images never leave your device. There is no server, no upload, no account required.
          Everything is processed locally with GPU-accelerated inference for speed without compromising privacy.
        </p>

        <div className="rmx-card">
          <div className="rmx-card-title">Technology Stack</div>
          <div className="rmx-tech-grid">
            {tech.map((x, i) => (
              <div key={i} className="rmx-tech-item">
                <span className="rmx-tech-name">{x.n}</span>
                <span className="rmx-tech-desc">{x.d}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rmx-card" style={{ marginTop: 16 }}>
          <div className="rmx-card-title">Principles</div>
          <ul className="rmx-bullet-list">
            <li>Privacy first — your images never touch a server</li>
            <li>Free forever — no subscriptions, no limits, no watermarks</li>
            <li>Open source — MIT licensed, self-host anywhere</li>
            <li>Performance — WebGPU acceleration, sub-3s processing</li>
            <li>Accessible — works on any modern browser, no install needed</li>
          </ul>
        </div>

        <div style={{ textAlign: 'center', marginTop: 40 }}>
          <a
            className="btn btn-primary"
            href="https://github.com/nayrbryanGaming/removix-ai"
            target="_blank"
            rel="noopener noreferrer"
          >
            View on GitHub ↗
          </a>
        </div>
      </div>
    </div>
  );
}
