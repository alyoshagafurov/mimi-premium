import { ImageResponse } from 'next/og';

// Node runtime for portability (Railway / any self-hosted Node server).
export const runtime = 'nodejs';
export const alt = 'mimi — minimise marketing agency';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #3C1975 0%, #0A0712 70%)',
          padding: '72px',
        }}
      >
        <div style={{ display: 'flex', fontSize: 28, letterSpacing: 8, color: '#FC9603', textTransform: 'uppercase' }}>
          minimise marketing agency · 2026
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', fontSize: 220, fontWeight: 900, color: '#D4EC4C', lineHeight: 1, letterSpacing: -8 }}>
            mımı
          </div>
          <div style={{ display: 'flex', marginTop: 24, fontSize: 40, color: '#F5F1FA', maxWidth: 900 }}>
            Minimise the noise. Maximise the impact.
          </div>
        </div>
        <div style={{ display: 'flex', fontSize: 26, color: 'rgba(245,241,250,0.6)' }}>
          Системный маркетинг в Таджикистане
        </div>
      </div>
    ),
    { ...size },
  );
}
