import React from 'react';

const ZapIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
);
const ShieldIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);
const SparklesIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z"/><path d="M19 3l.5 1.5L21 5l-1.5.5L19 7l-.5-1.5L17 5l1.5-.5z"/><path d="M5 17l.5 1.5L7 19l-1.5.5L5 21l-.5-1.5L3 19l1.5-.5z"/>
  </svg>
);
const InfinityIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 12c-2-2.5-4-4-6-4a4 4 0 0 0 0 8c2 0 4-1.5 6-4z"/><path d="M12 12c2 2.5 4 4 6 4a4 4 0 0 0 0-8c-2 0-4 1.5-6 4z"/>
  </svg>
);

const features = [
  {
    icon: ZapIcon,
    title: 'Instant AI Processing',
    desc: 'ISNet neural network runs directly in your browser via WebGPU/WASM. No waiting for server round-trips.',
    color: 'rgba(124,92,252,0.15)',
    iconColor: 'var(--accent2)',
  },
  {
    icon: ShieldIcon,
    title: 'Complete Privacy',
    desc: 'Your images never leave your device. Zero data transmission. Zero storage. Your files stay yours.',
    color: 'rgba(74,222,128,0.12)',
    iconColor: 'var(--green)',
  },
  {
    icon: SparklesIcon,
    title: 'Professional Quality',
    desc: 'Same model technology powering commercial tools. Clean edges, preserved hair detail, accurate subject isolation.',
    color: 'rgba(244,114,182,0.12)',
    iconColor: 'var(--pink)',
  },
  {
    icon: InfinityIcon,
    title: 'Unlimited & Free',
    desc: 'No account required. No watermarks. No hidden limits. Process as many images as you need at zero cost.',
    color: 'rgba(34,211,238,0.1)',
    iconColor: 'var(--cyan)',
  },
];

const FeatureGrid: React.FC = () => (
  <div className="rmx-features-grid" style={{ maxWidth: 1000, margin: '0 auto', padding: '0 0 80px' }}>
    {features.map((f, i) => (
      <div key={i} className="rmx-feat-card">
        <div className="rmx-feat-icon" style={{ background: f.color, color: f.iconColor }}>
          <f.icon />
        </div>
        <div className="rmx-feat-title">{f.title}</div>
        <div className="rmx-feat-desc">{f.desc}</div>
      </div>
    ))}
  </div>
);

export default FeatureGrid;
