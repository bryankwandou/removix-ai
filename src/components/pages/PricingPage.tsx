'use client';

import React from 'react';
import type { PageId } from '@/components/Navbar';

interface PricingPageProps {
  onNav?: (p: PageId) => void;
}

const freePlan = [
  'Unlimited background removals',
  'Full ISNet fp16 quality',
  'PNG with transparency',
  '25 MB file size limit',
  '100% browser-local processing',
  'No account required',
  'Batch processing (up to 10)',
];

const hostPlan = [
  'Full source code (MIT)',
  'Deploy to Vercel / Netlify',
  'Customize branding & colors',
  'API route integration',
  'White-label ready',
  'Community support on GitHub',
];

export default function PricingPage({ onNav }: PricingPageProps) {
  return (
    <div className="rmx-page">
      <div className="rmx-page-inner">
        <div className="rmx-page-header" style={{ textAlign: 'center' }}>
          <span className="badge badge-green">Pricing</span>
          <h1>Simple, honest pricing</h1>
          <p>No hidden fees. No subscriptions. Removix is free — forever.</p>
        </div>

        <div className="rmx-pricing-cards">
          {/* Free */}
          <div className="rmx-pricing-card">
            <div className="rmx-plan-name">Free Forever</div>
            <div className="rmx-plan-price"><sup>$</sup>0</div>
            <div className="rmx-plan-period">always free</div>
            <div className="rmx-divider-line" />
            <ul className="rmx-plan-features">
              {freePlan.map((f, i) => (
                <li key={i} className="rmx-plan-feat">
                  <span className="rmx-feat-check">✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <button type="button" className="btn btn-primary btn-block" onClick={() => onNav?.('home')}>
              Start removing →
            </button>
          </div>

          {/* Self-host */}
          <div className="rmx-pricing-card featured">
            <div className="rmx-featured-badge">Open Source</div>
            <div className="rmx-plan-name">Self-Host</div>
            <div className="rmx-plan-price"><sup>$</sup>0</div>
            <div className="rmx-plan-period">host it yourself</div>
            <div className="rmx-divider-line" />
            <ul className="rmx-plan-features">
              {hostPlan.map((f, i) => (
                <li key={i} className="rmx-plan-feat">
                  <span className="rmx-feat-check">✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <a
              className="btn btn-outline btn-block"
              href="https://github.com/nayrbryanGaming/removix-ai"
              target="_blank"
              rel="noopener noreferrer"
            >
              View on GitHub ↗
            </a>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 56, color: 'var(--text3)', fontSize: 14 }}>
          Questions? Reach out via{' '}
          <a href="https://github.com/nayrbryanGaming/removix-ai/issues" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent2)' }}>
            GitHub Issues ↗
          </a>
        </div>
      </div>
    </div>
  );
}
