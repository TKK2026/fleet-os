import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'fleet-os | フォーチュンレンタカー 車両売却管理',
  description: '固定資産台帳連動 | 簿価 × AA相場 × 税引後手取り',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <header style={{
          borderBottom: '1px solid #E4E2DC',
          background: '#FFFFFF',
          padding: '0 20px',
          display: 'flex',
          alignItems: 'center',
          height: '56px',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <svg viewBox="180 55 320 110" width="72" height="28" role="img" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <defs>
                  <linearGradient id="ic1" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#042C53"/>
                    <stop offset="50%" stopColor="#185FA5"/>
                    <stop offset="100%" stopColor="#378ADD"/>
                  </linearGradient>
                  <linearGradient id="ic2" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#042C53" stopOpacity="0"/>
                    <stop offset="20%" stopColor="#185FA5"/>
                    <stop offset="80%" stopColor="#378ADD"/>
                    <stop offset="100%" stopColor="#85B7EB" stopOpacity="0"/>
                  </linearGradient>
                </defs>
                <g transform="translate(180, 60)">
                  <rect x="10" y="68" width="300" height="52" rx="8" fill="url(#ic1)"/>
                  <path d="M 55 68 Q 70 30 110 20 L 230 20 Q 265 20 280 68 Z" fill="url(#ic1)"/>
                  <rect x="290" y="90" width="24" height="20" rx="4" fill="#378ADD"/>
                  <rect x="6" y="90" width="20" height="20" rx="4" fill="#185FA5"/>
                  <path d="M 62 65 Q 74 36 108 26 L 180 26 L 180 65 Z" fill="#B5D4F4" opacity="0.6"/>
                  <path d="M 184 26 L 228 26 Q 258 26 272 65 L 184 65 Z" fill="#85B7EB" opacity="0.5"/>
                  <rect x="294" y="74" width="18" height="4" rx="2" fill="#85B7EB"/>
                  <rect x="304" y="96" width="8" height="10" rx="2" fill="#B5D4F4" opacity="0.9"/>
                  <circle cx="308" cy="101" r="2.5" fill="#042C53"/>
                  <circle cx="75" cy="122" r="34" fill="#042C53"/>
                  <circle cx="245" cy="122" r="34" fill="#042C53"/>
                  <circle cx="75" cy="122" r="26" fill="#0C447C"/>
                  <circle cx="245" cy="122" r="26" fill="#0C447C"/>
                  <g stroke="#185FA5" strokeWidth="2.5" opacity="0.8">
                    <line x1="75" y1="100" x2="75" y2="144"/>
                    <line x1="57" y1="110" x2="93" y2="134"/>
                    <line x1="57" y1="134" x2="93" y2="110"/>
                    <line x1="245" y1="100" x2="245" y2="144"/>
                    <line x1="227" y1="110" x2="263" y2="134"/>
                    <line x1="227" y1="134" x2="263" y2="110"/>
                  </g>
                  <circle cx="75" cy="122" r="8" fill="#378ADD"/>
                  <circle cx="245" cy="122" r="8" fill="#378ADD"/>
                  <circle cx="75" cy="122" r="3" fill="#B5D4F4"/>
                  <circle cx="245" cy="122" r="3" fill="#B5D4F4"/>
                  <rect x="0" y="154" width="320" height="2" rx="1" fill="url(#ic2)" opacity="0.6"/>
                </g>
              </svg>
              <span style={{
                fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                fontSize: '18px',
                fontWeight: 500,
                letterSpacing: '-0.5px',
                background: 'linear-gradient(90deg, #042C53 0%, #185FA5 40%, #378ADD 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                fleet<span style={{ fontWeight: 300 }}>-os</span>
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '20px', background: '#E6F1FB', color: '#0C447C', border: '1px solid #85B7EB' }}>フォーチュンレンタカー 宮古島</span>
              <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '20px', background: '#F2F0EC', color: '#5A5850', border: '1px solid #E4E2DC' }}>2026年8月</span>
            </div>
          </div>
        </header>
        {children}
      </body>
    </html>
  )
}
