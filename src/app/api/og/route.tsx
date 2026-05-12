import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          background: 'linear-gradient(135deg, #0a0a0a 0%, #0f0a1e 60%, #1a0a2e 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Grid pattern */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(rgba(124,58,237,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,0.06) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />

        {/* Glow */}
        <div style={{
          position: 'absolute', top: '-120px', right: '-80px',
          width: '500px', height: '500px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124,58,237,0.25) 0%, transparent 70%)',
        }} />

        {/* Badge */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.4)',
          borderRadius: '100px', padding: '8px 20px',
          color: '#a78bfa', fontSize: '13px', fontWeight: 700,
          letterSpacing: '0.1em', textTransform: 'uppercase',
          marginBottom: '28px',
        }}>
          100% Free · No Signup · Runs In Your Browser
        </div>

        {/* Wordmark */}
        <div style={{
          fontSize: '88px', fontWeight: 900, letterSpacing: '-0.03em',
          background: 'linear-gradient(135deg, #ffffff 30%, #a78bfa 100%)',
          backgroundClip: 'text', color: 'transparent',
          marginBottom: '20px',
        }}>
          Removix
        </div>

        {/* Tagline */}
        <div style={{
          fontSize: '26px', color: 'rgba(255,255,255,0.55)', fontWeight: 400,
          textAlign: 'center', maxWidth: '700px', lineHeight: 1.4,
          marginBottom: '50px',
        }}>
          AI background removal · Instant · Private · Free
        </div>

        {/* Before / After visual */}
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          {/* Before box */}
          <div style={{
            width: '180px', height: '130px', borderRadius: '20px',
            background: 'linear-gradient(135deg, #1e1e2e, #2a1a3e)',
            border: '1px solid rgba(255,255,255,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
              Original
            </div>
          </div>

          <div style={{ fontSize: '28px', color: 'rgba(255,255,255,0.2)' }}>→</div>

          {/* After box — checkerboard */}
          <div style={{
            width: '180px', height: '130px', borderRadius: '20px',
            border: '1px solid rgba(124,58,237,0.4)',
            background: 'repeating-conic-gradient(#1a1a2e 0% 25%, #111124 0% 50%) 0 0 / 20px 20px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{
              background: 'rgba(124,58,237,0.8)', borderRadius: '10px',
              padding: '6px 14px', fontSize: '11px', color: '#fff',
              fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
            }}>
              Removix AI
            </div>
          </div>
        </div>

        {/* Privacy badge */}
        <div style={{
          position: 'absolute', bottom: '32px',
          fontSize: '12px', color: 'rgba(255,255,255,0.2)',
          letterSpacing: '0.08em',
        }}>
          removix.vercel.app
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
