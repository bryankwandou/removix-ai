'use client';

import React, { useState, useEffect } from 'react';

type Theme = 'dark' | 'light' | 'system';
type OutputFmt = 'png' | 'jpg';

interface Settings {
  model: 'fp16' | 'quint8';
  engine: 'auto' | 'gpu' | 'wasm';
  output: OutputFmt;
  quality: number;
  telemetry: boolean;
  keepHistory: boolean;
}

const DEFAULT: Settings = { model: 'fp16', engine: 'auto', output: 'png', quality: 90, telemetry: false, keepHistory: false };

function load(): Settings {
  try { return { ...DEFAULT, ...JSON.parse(localStorage.getItem('rmx-settings') ?? '{}') }; } catch { return DEFAULT; }
}
function save(s: Settings) {
  try { localStorage.setItem('rmx-settings', JSON.stringify(s)); } catch { /* ignore */ }
}

export default function SettingsPage() {
  const [theme, setThemeState] = useState<Theme>('dark');
  const [lang, setLang] = useState<'en' | 'id'>('en');
  const [s, setS] = useState<Settings>(DEFAULT);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setS(load());
    const t = (localStorage.getItem('rmx-theme') as Theme) ?? 'dark';
    setThemeState(t);
  }, []);

  const flash = () => { setSaved(true); setTimeout(() => setSaved(false), 1600); };

  const applyTheme = (t: Theme) => {
    setThemeState(t);
    const resolved = t === 'system' ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : t;
    document.documentElement.setAttribute('data-theme', resolved);
    localStorage.setItem('rmx-theme', t);
    flash();
  };

  const update = (partial: Partial<Settings>) => {
    const next = { ...s, ...partial };
    setS(next);
    save(next);
    flash();
  };

  const SunIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>;
  const MoonIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>;
  const CogIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>;

  return (
    <div className="rmx-page">
      <div className="rmx-page-inner rmx-page-narrow">
        <div className="rmx-page-header">
          <span className="badge badge-purple">Settings</span>
          <h1>Settings</h1>
          <p>Customize your Removix experience.</p>
        </div>

        {saved && (
          <div className="rmx-toast show" style={{ position: 'relative', bottom: 'auto', left: 'auto', transform: 'none', marginBottom: 20, display: 'inline-block' }}>
            ✓ Saved
          </div>
        )}

        {/* Appearance */}
        <div className="rmx-card">
          <div className="rmx-settings-title">Appearance</div>

          <div className="rmx-setting-row">
            <div>
              <div className="rmx-setting-label">Theme</div>
            </div>
            <div className="rmx-seg">
              {(['dark', 'light', 'system'] as Theme[]).map(t => (
                <button type="button" key={t} className={`rmx-seg-btn${theme === t ? ' active' : ''}`} onClick={() => applyTheme(t)}>
                  {t === 'dark' && <MoonIcon />}
                  {t === 'light' && <SunIcon />}
                  {t === 'system' && <CogIcon />}
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="rmx-setting-row">
            <div>
              <div className="rmx-setting-label">Language</div>
            </div>
            <div className="rmx-seg">
              {(['en', 'id'] as const).map(l => (
                <button type="button" key={l} className={`rmx-seg-btn${lang === l ? ' active' : ''}`} onClick={() => { setLang(l); flash(); }}>
                  {l === 'en' ? '🇬🇧 English' : '🇮🇩 Bahasa'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Processing */}
        <div className="rmx-card">
          <div className="rmx-settings-title">Processing</div>

          <div className="rmx-setting-row">
            <div>
              <div className="rmx-setting-label">AI Model</div>
            </div>
            <select className="rmx-select" value={s.model} onChange={e => update({ model: e.target.value as Settings['model'] })}>
              <option value="fp16">ISNet fp16 (recommended)</option>
              <option value="quint8">ISNet quantized INT8 (smaller)</option>
            </select>
          </div>

          <div className="rmx-setting-row">
            <div>
              <div className="rmx-setting-label">Inference Engine</div>
            </div>
            <select className="rmx-select" value={s.engine} onChange={e => update({ engine: e.target.value as Settings['engine'] })}>
              <option value="auto">Auto-detect (recommended)</option>
              <option value="gpu">Force WebGPU</option>
              <option value="wasm">Force WebAssembly</option>
            </select>
          </div>

          <div className="rmx-setting-row">
            <div>
              <div className="rmx-setting-label">Output Format</div>
            </div>
            <div className="rmx-seg">
              {(['png', 'jpg'] as OutputFmt[]).map(f => (
                <button type="button" key={f} className={`rmx-seg-btn${s.output === f ? ' active' : ''}`} onClick={() => update({ output: f })}>
                  {f.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="rmx-setting-row">
            <div>
              <div className="rmx-setting-label">JPEG Quality</div>
              <div className="rmx-setting-desc">{s.quality}%</div>
            </div>
            <input type="range" min={10} max={100} step={5} value={s.quality} className="rmx-range" onChange={e => update({ quality: parseInt(e.target.value) })} />
          </div>
        </div>

        {/* Privacy */}
        <div className="rmx-card">
          <div className="rmx-settings-title">Privacy</div>

          <div className="rmx-setting-row">
            <div>
              <div className="rmx-setting-label">Anonymous telemetry</div>
              <div className="rmx-setting-desc">Help improve Removix by sending crash-only anonymous reports.</div>
            </div>
            <button type="button" className={`rmx-toggle${s.telemetry ? ' on' : ''}`} onClick={() => update({ telemetry: !s.telemetry })}>
              <span className="rmx-toggle-knob" />
            </button>
          </div>

          <div className="rmx-setting-row">
            <div>
              <div className="rmx-setting-label">Keep history</div>
              <div className="rmx-setting-desc">Store processed image list in localStorage for this session.</div>
            </div>
            <button type="button" className={`rmx-toggle${s.keepHistory ? ' on' : ''}`} onClick={() => update({ keepHistory: !s.keepHistory })}>
              <span className="rmx-toggle-knob" />
            </button>
          </div>
        </div>

        {/* Danger */}
        <div className="rmx-card danger">
          <div className="rmx-settings-title" style={{ color: 'var(--red)' }}>Danger Zone</div>
          <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 4 }}>These actions cannot be undone.</p>
          <div className="rmx-danger-actions">
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => { caches.keys().then(ks => ks.forEach(k => caches.delete(k))); flash(); }}>
              Clear cache
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => { localStorage.removeItem('rmx-history'); flash(); }}>
              Clear history
            </button>
            <button type="button" className="btn btn-danger btn-sm" onClick={() => { save(DEFAULT); setS(DEFAULT); flash(); }}>
              Reset to defaults
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
