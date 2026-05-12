import React from 'react';

const notCollect = [
  'Images you process — they never leave your device',
  'Image filenames or metadata',
  'IP addresses or location data',
  'Cookies for analytics or tracking',
  'Email or contact info (unless you choose to provide it)',
  'Device fingerprints or cross-site identifiers',
];

const mayCollect = [
  'Anonymous performance metrics (only if you enable telemetry in settings)',
  'Crash-only reports without any identifying info (only if telemetry is on)',
  'Account email (only if you create an account — feature not yet live)',
];

export default function PrivacyPage() {
  return (
    <div className="rmx-page">
      <div className="rmx-page-inner rmx-page-narrow">
        <div className="rmx-page-header">
          <span className="badge badge-green">Privacy</span>
          <h1>Privacy Policy</h1>
          <p>Last updated: 2026-01-15</p>
        </div>

        <p className="rmx-lead">
          Removix is designed from the ground up to be privacy-respecting. The core premise
          is simple: your images are processed locally in your browser and never transmitted
          to any server.
        </p>

        <div className="rmx-card">
          <div className="rmx-card-title" style={{ color: 'var(--green)' }}>✓ What we do NOT collect</div>
          <ul className="rmx-bullet-list">
            {notCollect.map((x, i) => <li key={i}>{x}</li>)}
          </ul>
        </div>

        <div className="rmx-card">
          <div className="rmx-card-title">What we may collect</div>
          <ul className="rmx-bullet-list">
            {mayCollect.map((x, i) => <li key={i}>{x}</li>)}
          </ul>
        </div>

        <div className="rmx-card">
          <div className="rmx-card-title">Local storage</div>
          <p>
            Removix uses <code>localStorage</code> solely for your settings preferences (theme, model choice, etc.)
            and the ONNX Runtime model cache. No personal data is stored. You can clear this at any time
            in Settings → Danger Zone.
          </p>
        </div>

        <p style={{ marginTop: 24, color: 'var(--text2)', fontSize: 14 }}>
          Questions? Contact us at{' '}
          <a href="mailto:hello@removix.app" style={{ color: 'var(--accent2)' }}>hello@removix.app</a>
        </p>
      </div>
    </div>
  );
}
