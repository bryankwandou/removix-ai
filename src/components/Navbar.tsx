'use client';

import React, { useState, useEffect, useRef } from 'react';

export type PageId =
  | 'home' | 'settings' | 'about' | 'pricing' | 'docs'
  | 'privacy' | 'terms' | 'contact' | 'changelog';

interface NavbarProps {
  page: PageId;
  onNav: (p: PageId) => void;
}

const SunIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
);
const MoonIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
);
const CogIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
);
const GlobeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="2" y1="12" x2="22" y2="12"/>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  </svg>
);

const mainLinks: { id: PageId; label: string }[] = [
  { id: 'home', label: 'Home' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'docs', label: 'Docs' },
  { id: 'about', label: 'About' },
];

const moreLinks: { id: PageId; label: string }[] = [
  { id: 'changelog', label: 'Changelog' },
  { id: 'contact', label: 'Contact' },
  { id: 'privacy', label: 'Privacy' },
  { id: 'terms', label: 'Terms' },
];

export default function Navbar({ page, onNav }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [lang, setLang] = useState<'EN' | 'ID'>('EN');
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem('rmx-theme') as 'dark' | 'light' | null;
    if (stored) applyTheme(stored);
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const applyTheme = (t: 'dark' | 'light') => {
    setTheme(t);
    document.documentElement.setAttribute('data-theme', t);
    localStorage.setItem('rmx-theme', t);
  };

  const toggleTheme = () => applyTheme(theme === 'dark' ? 'light' : 'dark');
  const toggleLang = () => setLang(l => l === 'EN' ? 'ID' : 'EN');

  const goto = (id: PageId) => {
    onNav(id);
    setMobileOpen(false);
    setMoreOpen(false);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  return (
    <>
      <nav className={`rmx-nav${scrolled ? ' scrolled' : ''}`}>
        {/* Logo */}
        <button className="rmx-nav-logo" onClick={() => goto('home')}>
          <span className="rmx-nav-logo-icon">✦</span>
          Removix
        </button>

        {/* Center links */}
        <div className="rmx-nav-links">
          {mainLinks.map(l => (
            <button
              key={l.id}
              className={`rmx-nav-link${page === l.id ? ' active' : ''}`}
              onClick={() => goto(l.id)}
            >
              {l.label}
            </button>
          ))}
          <div className="rmx-nav-more" ref={moreRef}>
            <button
              className={`rmx-nav-link${moreLinks.some(l => l.id === page) ? ' active' : ''}`}
              onClick={() => setMoreOpen(o => !o)}
            >
              More ▾
            </button>
            {moreOpen && (
              <div className="rmx-dropdown">
                {moreLinks.map(l => (
                  <button key={l.id} className="rmx-dropdown-item" onClick={() => goto(l.id)}>
                    {l.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right actions */}
        <div className="rmx-nav-right">
          <button className="rmx-icon-btn" onClick={toggleLang} title="Toggle language">
            <GlobeIcon />
            <span style={{ fontSize: 11, fontWeight: 700, marginLeft: 2 }}>{lang}</span>
          </button>
          <button className="rmx-icon-btn" onClick={toggleTheme} title={theme === 'dark' ? 'Light mode' : 'Dark mode'}>
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>
          <button
            className="rmx-icon-btn"
            onClick={() => goto('settings')}
            title="Settings"
            style={page === 'settings' ? { color: 'var(--accent2)', borderColor: 'rgba(124,92,252,0.4)', background: 'rgba(124,92,252,0.1)' } : undefined}
          >
            <CogIcon />
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => goto('home')}>
            Try Free →
          </button>
          <button
            className="rmx-hamburger"
            onClick={() => setMobileOpen(o => !o)}
            aria-label="Menu"
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </nav>

      {mobileOpen && (
        <div className="rmx-mobile-menu">
          {[...mainLinks, ...moreLinks, { id: 'settings' as PageId, label: 'Settings' }].map(l => (
            <button
              key={l.id}
              className={`rmx-nav-link${page === l.id ? ' active' : ''}`}
              onClick={() => goto(l.id)}
            >
              {l.label}
            </button>
          ))}
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button className="rmx-icon-btn" onClick={toggleTheme}>
              {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
              <span style={{ fontSize: 12, marginLeft: 6 }}>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
