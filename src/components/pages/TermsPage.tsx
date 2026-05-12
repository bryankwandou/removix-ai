import React from 'react';

export default function TermsPage() {
  return (
    <div className="rmx-page">
      <div className="rmx-page-inner rmx-page-narrow">
        <div className="rmx-page-header">
          <span className="badge badge-dim">Legal</span>
          <h1>Terms of Service</h1>
          <p>Last updated: 2026-01-15</p>
        </div>

        <p className="rmx-lead">
          By using Removix you agree to the following terms. These are intentionally minimal —
          Removix is a free, open-source tool and these terms exist mainly to clarify expectations.
        </p>

        <div className="rmx-card">
          <h3>1. Service</h3>
          <p>
            Removix is provided &quot;as-is&quot; with no warranty of any kind. The AI model runs in your
            browser; results may vary depending on image content and your device capabilities.
          </p>

          <h3>2. Acceptable use</h3>
          <p>
            You agree not to use Removix to process content that is illegal in your jurisdiction,
            including but not limited to non-consensual intimate imagery, content involving minors, or
            content that infringes third-party intellectual property rights.
          </p>

          <h3>3. Your content</h3>
          <p>
            You retain all rights to images you process. Removix claims no license over them.
            Because processing is local, we never receive your images.
          </p>

          <h3>4. Liability</h3>
          <p>
            Removix and its contributors are not liable for any direct or indirect damages arising
            from your use of the tool. Output quality varies by image; always verify results before
            commercial use.
          </p>

          <h3>5. Open source</h3>
          <p>
            Removix is MIT licensed. You may fork, modify, and self-host it subject to the terms
            of the MIT License as found in the{' '}
            <a href="https://github.com/nayrbryanGaming/removix-ai/blob/main/LICENSE" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent2)' }}>
              repository ↗
            </a>.
          </p>

          <h3>6. Changes</h3>
          <p>
            These terms may change. The &quot;last updated&quot; date above will reflect any modification.
            Continued use constitutes acceptance of the revised terms.
          </p>
        </div>
      </div>
    </div>
  );
}
