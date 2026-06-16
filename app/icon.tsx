import { ImageResponse } from 'next/og'

export const size = { width: 512, height: 512 }
export const contentType = 'image/png'

// Brand: dark background + accent-yellow "i" letterform
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 360,
          background: '#1a1a1a',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fbbf24',
          fontWeight: 900,
          fontFamily: 'system-ui',
          letterSpacing: '-0.05em',
        }}
      >
        ivy
      </div>
    ),
    { ...size }
  )
}
