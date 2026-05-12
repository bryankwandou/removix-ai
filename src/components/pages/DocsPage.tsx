'use client';

import React, { useState } from 'react';

type DocId = 'overview' | 'quickstart' | 'architecture' | 'api' | 'deploy';

const nav: { id: DocId; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'quickstart', label: 'Quick Start' },
  { id: 'architecture', label: 'Architecture' },
  { id: 'api', label: 'API Reference' },
  { id: 'deploy', label: 'Deployment' },
];

const docs: Record<DocId, React.ReactNode> = {
  overview: (
    <div>
      <h1>Removix Docs</h1>
      <p>Everything you need to understand, deploy, and extend Removix.</p>
      <h2>What is Removix?</h2>
      <p>
        Production-grade AI background removal that runs entirely in the browser using ISNet
        via ONNX Runtime Web. No server required — images are processed locally with WebGPU
        acceleration for speed and complete privacy.
      </p>
      <div className="rmx-code-block">{'// Core usage:\nconst result = await processImage(blob, onProgress);'}</div>
      <h2>Key features</h2>
      <ul className="rmx-bullet-list" style={{ marginTop: 8 }}>
        <li>ISNet fp16 — state-of-the-art segmentation quality</li>
        <li>WebGPU acceleration with WASM fallback</li>
        <li>Single and batch processing</li>
        <li>Background replacement + manual edge refinement</li>
        <li>100% browser-local — zero server uploads</li>
      </ul>
    </div>
  ),
  quickstart: (
    <div>
      <h1>Quick Start</h1>
      <p>Get Removix running locally in under 5 minutes.</p>
      <h2>Clone & run</h2>
      <div className="rmx-code-block">
        {'git clone https://github.com/nayrbryanGaming/removix-ai\ncd removix-ai\nnpm install\nnpm run dev'}
      </div>
      <h2>Environment</h2>
      <p>No environment variables are required for local development. The app works out of the box.</p>
      <div className="rmx-code-block">{'# Optional: Hugging Face token for model CDN fallback\nHUGGINGFACE_TOKEN=hf_...'}</div>
    </div>
  ),
  architecture: (
    <div>
      <h1>Architecture</h1>
      <p>How Removix processes images end-to-end, entirely in the browser.</p>
      <div className="rmx-code-block">
        {'File → validate → resize (1024×1024)\n  → ONNX Runtime (WebGPU → WASM fallback)\n  → ISNet fp16 forward pass\n  → alpha matte extraction\n  → Canvas compositing\n  → PNG Blob (transparent background)'}
      </div>
      <h2>Model loading</h2>
      <p>
        On first use, the ISNet fp16 model (~40 MB) is downloaded from the CDN and cached
        in the browser via the Cache API. Subsequent uses load instantly from cache.
      </p>
      <h2>CORS headers</h2>
      <p>The app requires <code>Cross-Origin-Embedder-Policy: require-corp</code> and <code>Cross-Origin-Opener-Policy: same-origin</code> for SharedArrayBuffer support. These are set in <code>vercel.json</code>.</p>
    </div>
  ),
  api: (
    <div>
      <h1>API Reference</h1>
      <p>Core library functions.</p>
      <h2>processImage()</h2>
      <div className="rmx-code-block">
        {'async function processImage(\n  imageBlob: Blob,\n  onProgress: (pct: number, stage: string) => void\n): Promise<Blob>'}
      </div>
      <p>Removes the background from the provided image blob. Calls <code>onProgress</code> periodically with a percentage (0–100) and a stage label.</p>
      <h2>POST /api/remove-bg</h2>
      <div className="rmx-code-block">
        {'// Request: multipart/form-data\n// Field: "image" (file)\n\n// Response: image/png blob\n// Error: { "error": "..." }'}
      </div>
    </div>
  ),
  deploy: (
    <div>
      <h1>Deployment</h1>
      <p>Deploy to Vercel in minutes.</p>
      <h2>One-click deploy</h2>
      <p>Push your fork to GitHub, then connect it to Vercel. Next.js is auto-detected.</p>
      <div className="rmx-code-block">
        {'# Required headers (already in vercel.json):\nCross-Origin-Opener-Policy: same-origin\nCross-Origin-Embedder-Policy: require-corp'}
      </div>
      <h2>Environment variables</h2>
      <div className="rmx-code-block">{'HUGGINGFACE_TOKEN=hf_...  # optional model CDN fallback'}</div>
      <h2>Self-host alternatives</h2>
      <ul className="rmx-bullet-list" style={{ marginTop: 8 }}>
        <li>Netlify — set headers in <code>netlify.toml</code></li>
        <li>Cloudflare Pages — set headers in <code>_headers</code> file</li>
        <li>Docker — standard Next.js standalone build</li>
      </ul>
    </div>
  ),
};

export default function DocsPage() {
  const [active, setActive] = useState<DocId>('overview');

  return (
    <div className="rmx-docs-layout">
      <aside className="rmx-docs-sidebar">
        <div className="rmx-docs-nav-title">Documentation</div>
        {nav.map(n => (
          <button
            type="button"
            key={n.id}
            className={`rmx-docs-nav-item${active === n.id ? ' active' : ''}`}
            onClick={() => setActive(n.id)}
          >
            {n.label}
          </button>
        ))}
      </aside>
      <div className="rmx-docs-content page-fade">
        {docs[active]}
      </div>
    </div>
  );
}
