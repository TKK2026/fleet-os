import { Vehicle } from '@/types/vehicle'
import { getMarketData } from './marketData'
import { elapsedMonths } from './calc'

export type ScoreBreakdown = {
  total: number        // 0-100
  bookGap: number      // ① 簿価乖離率 / 30
  kmRisk: number       // ② 走行距離リスク / 25
  trend: number        // ③ 市場トレンド / 25
  elapsed: number      // ④ 経過月数 / 20
  hasAA: boolean       // AA相場が入力済みか（未入力だと①が0点）
}

export type ScoreRating = {
  label: string
  color: 'green' | 'amber' | 'blue' | 'red'
}

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n))

// ① 簿価乖離率（30点）: AA相場 / (簿価+補助金)。比率0.5→0点、1.3以上→30点の線形。
function scoreBookGap(v: Vehicle): number {
  const ref = v.bv_subsidy > 0 ? v.bv_subsidy : v.book_value
  if (!v.aa_price || ref <= 0) return 0
  const ratio = v.aa_price / ref
  return Math.round(clamp((ratio - 0.5) / 0.8 * 30, 0, 30))
}

// ② 走行距離リスク（25点）
function scoreKmRisk(v: Vehicle): number {
  const km = v.km
  if (km === null || km === undefined) return 15 // 未入力は中立
  if (km < 30000) return 25
  if (km <= 50000) return 15
  return 5
}

// ③ 市場トレンド（25点）: 下落は早期売却を優遇、横ばいは中立
function scoreTrend(v: Vehicle): number {
  const md = getMarketData(v.name)
  if (!md) return 13
  if (md.trend === 'down') return 25
  if (md.trend === 'flat') return 13
  return 5 // up: 急ぐ必要が薄い
}

// ④ 経過月数（20点）: 耐用年数の後半に入るほど高スコア
function scoreElapsed(v: Vehicle): number {
  const totalMonths = v.life * 12
  if (totalMonths <= 0) return 0
  const p = clamp(elapsedMonths(v.acquired) / totalMonths, 0, 1)
  return Math.round(p * 20)
}

export function calcScore(v: Vehicle): ScoreBreakdown {
  const bookGap = scoreBookGap(v)
  const kmRisk = scoreKmRisk(v)
  const trend = scoreTrend(v)
  const elapsed = scoreElapsed(v)
  return {
    total: bookGap + kmRisk + trend + elapsed,
    bookGap,
    kmRisk,
    trend,
    elapsed,
    hasAA: !!v.aa_price,
  }
}

export function scoreRating(total: number): ScoreRating {
  if (total >= 80) return { label: '売却推奨', color: 'green' }
  if (total >= 60) return { label: '売却検討', color: 'amber' }
  if (total >= 40) return { label: '保留', color: 'blue' }
  return { label: '継続保有', color: 'red' }
}
