'use client';

import React from 'react';
import type { PageId } from './Navbar';

interface FooterProps {
  onNav?: (p: PageId) => void;
}

const Footer: React.FC<FooterProps> = ({ onNav }) => {
  const go = (p: PageId) => {
    onNav?.(p);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  return (
    <footer className="rmx-footer">
      <div className="rmx-footer-grid">
        {/* Brand */}
        <div>
          <div className="rmx-footer-logo">
            <span className="rmx-footer-logo-icon">✦</span>
            Removix
          </div>
          <p className="rmx-footer-tagline">
            AI-powered background removal that runs entirely in your browser.
            Free, private, no signup required.
          </p>
        </div>

        {/* Product */}
        <div>
          <div className="rmx-footer-col-title">Product</div>
          <div className="rmx-footer-links">
            <button className="rmx-footer-link" onClick={() => go('home')}>Home</button>
            <button className="rmx-footer-link" onClick={() => go('pricing')}>Pricing</button>
            <button className="rmx-footer-link" onClick={() => go('docs')}>Docs</button>
            <button className="rmx-footer-link" onClick={() => go('changelog')}>Changelog</button>
          </div>
        </div>

        {/* Company */}
        <div>
          <div className="rmx-footer-col-title">Company</div>
          <div className="rmx-footer-links">
            <button className="rmx-footer-link" onClick={() => go('about')}>About</button>
            <button className="rmx-footer-link" onClick={() => go('contact')}>Contact</button>
            <button className="rmx-footer-link" onClick={() => go('privacy')}>Privacy</button>
            <button className="rmx-footer-link" onClick={() => go('terms')}>Terms</button>
            <a
              className="rmx-footer-link"
              href="https://github.com/nayrbryanGaming/removix-ai"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub ↗
            </a>
          </div>
        </div>
      </div>

      <div className="rmx-footer-bottom">
        <span>© 2026 Removix — AI Background Remover</span>
        <span>100% browser-local · Privacy first · Open source</span>
      </div>
    </footer>
  );
};

export default Footer;
