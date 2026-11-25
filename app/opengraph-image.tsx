import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ImageResponse } from 'next/og'

// Preview card shown when the site link is shared (WhatsApp, LinkedIn, X, Slack …).
export const alt = 'A3A Staffing Solutions – Your strategic talent acquisition partner'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OpengraphImage() {
  const logo = await readFile(join(process.cwd(), 'public/brand/a3a-logo-512.jpg'))
  const logoSrc = `data:image/jpeg;base64,${logo.toString('base64')}`

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '64px 72px', background: '#061b3d', color: 'white', fontFamily: 'sans-serif', position: 'relative' }}>
        <div style={{ position: 'absolute', right: -120, top: -120, width: 420, height: 420, borderRadius: 9999, border: '56px solid rgba(244,115,20,0.22)', display: 'flex' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <img src={logoSrc} width={104} height={104} style={{ borderRadius: 9999, border: '5px solid #f47314' }} />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', fontSize: 52, fontWeight: 800, letterSpacing: -2 }}>
              A<span style={{ color: '#f47314' }}>3</span>A
            </div>
            <div style={{ display: 'flex', fontSize: 20, fontWeight: 700, letterSpacing: 5, color: '#cbd5e1' }}>STAFFING SOLUTIONS</div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', fontSize: 72, fontWeight: 800, letterSpacing: -3, lineHeight: 1.05 }}>
            Your strategic talent&nbsp;<span style={{ color: '#f88a35' }}>acquisition partner.</span>
          </div>
          <div style={{ display: 'flex', marginTop: 24, fontSize: 28, color: '#cbd5e1' }}>
            IT, Non-IT &amp; Leadership hiring for startups, SMEs and enterprises across India
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 22, color: '#f88a35', fontWeight: 700 }}>
          <div style={{ width: 40, height: 4, background: '#f47314', display: 'flex' }} />
          Right people · Right opportunities · Right time
        </div>
      </div>
    ),
    size,
  )
}
