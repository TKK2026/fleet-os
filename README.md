# fleet-os

フォーチュンレンタカー 宮古島 車両売却管理システム

## 概要
固定資産台帳連動 | 簿価（200%定率法）× AA相場 × 税引後手取りを一括可視化するWebOSです。

## 機能
- 全34台（Fortune. / 賢英）の簿価・AA相場・売却損益をリアルタイム計算
- 売却損益① = AA相場 − 簿価、売却損益② = AA相場 − 簿価+補助金（実質コスト換算）
- 法人税（実効税率23.2%）・消費税（10%）を考慮した税引後手取りシミュレーション
- 簿価推移チャート（定率法）
- 売却優先順位①〜④フィルタリング
- 将来的にオークション相場APIと連動予定

## Tech Stack
- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- Supabase（予定）

## Deploy
Vercel: https://fleet-os.vercel.app（予定）

## Setup
\`\`\`bash
npm install
cp .env.local.example .env.local  # Supabase credentials
npm run dev
\`\`\`
