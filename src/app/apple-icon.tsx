import { ImageResponse } from 'next/og';

// Apple touch icon (180×180) — auto-linked by Next as <link rel="apple-touch-icon">.
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #4A2088, #301460)',
          color: '#D4EC4C',
          fontSize: 58,
          fontWeight: 900,
          letterSpacing: -3,
        }}
      >
        mimi
      </div>
    ),
    { ...size },
  );
}
