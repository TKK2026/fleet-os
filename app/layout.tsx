import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'fleet-os | フォーチュンレンタカー 車両売却管理',
  description: '固定資産台帳連動 | 簿価 × AA相場 × 税引後手取り',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  )
}
