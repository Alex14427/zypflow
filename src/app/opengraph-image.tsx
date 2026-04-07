import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Zypflow — Revenue OS for Aesthetics Clinics';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px',
          background: '#09090b',
          fontFamily: 'system-ui, sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background gradient blobs */}
        <div
          style={{
            position: 'absolute',
            top: -120,
            left: -100,
            width: 500,
            height: 500,
            borderRadius: '50%',
            background: 'rgba(210, 102, 69, 0.12)',
            filter: 'blur(80px)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -80,
            right: -60,
            width: 400,
            height: 400,
            borderRadius: '50%',
            background: 'rgba(168, 85, 247, 0.08)',
            filter: 'blur(80px)',
          }}
        />

        {/* Brand mark */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 40,
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #d26645, #b84f31)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: 24,
              fontWeight: 800,
            }}
          >
            Z
          </div>
          <span style={{ fontSize: 28, fontWeight: 700, color: '#fafafa' }}>
            Zypflow
          </span>
        </div>

        {/* Headline */}
        <div
          style={{
            fontSize: 64,
            fontWeight: 700,
            lineHeight: 1.1,
            color: '#fafafa',
            letterSpacing: '-0.03em',
            maxWidth: 800,
          }}
        >
          Your clinic&apos;s revenue system,{' '}
          <span style={{ color: '#d26645' }}>automated.</span>
        </div>

        {/* Subline */}
        <div
          style={{
            fontSize: 24,
            color: '#a1a1aa',
            marginTop: 24,
            maxWidth: 600,
            lineHeight: 1.5,
          }}
        >
          AI-powered patient acquisition for UK aesthetics clinics.
          Faster responses. More bookings. Zero admin.
        </div>

        {/* Bottom bar */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 4,
            background: 'linear-gradient(90deg, #d26645, #a855f7, #d26645)',
          }}
        />
      </div>
    ),
    { ...size },
  );
}
