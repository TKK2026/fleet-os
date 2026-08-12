// CEV補助金 返納額計算
// 根拠: 次世代自動車振興センター(NeV)公式交付要綱
// https://www.cev-pc.or.jp/hojo/cev_h29.html
//
// 返納額 = max(売却額, 残存簿価) × 補助金比率
// 補助金比率 = 補助金額 ÷ 車両購入費用（修正取得額）
// 残存簿価 = 保有義務期間(48ヶ月)を償却期間とし定率法で算出
// 保有義務期間: EV 4年（2024年度〜）
// 返納額上限: 補助金交付額

import { Vehicle } from '@/types/vehicle'

// 保有義務期間（月数）: EVは4年=48ヶ月
const OBLIGATION_MONTHS = 48

// 定率法 残存簿価計算（保有義務期間ベース）
// NeV規定: 保有義務期間を償却期間とし定率法で算出
// 4年定率法の償却率 = 0.500
const OBLIGATION_RATE = 0.500

export type SubsidyReturnCalc = {
  hasSubsidy: boolean          // 補助金受給あり
  subsidyAmount: number        // 補助金交付額
  subsidyRatio: number         // 補助金比率（小数）
  obligationMonths: number     // 保有義務期間（月）
  elapsedMonths: number        // 経過月数
  remainingMonths: number      // 残存期間（月）
  isWithinObligation: boolean  // 処分制限期間内か
  obligationEndDate: string    // 処分制限期間満了日
  // NeV公式計算式
  nevResidualBV: number        // NeV残存簿価（保有義務期間ベース定率法）
  baseAmount: number | null    // max(売却額, NeV残存簿価)
  returnAmount: number | null  // 返納額（AA相場入力時）
  returnAmountCap: number      // 返納額上限（補助金交付額）
  // 手取り計算
  netProceedsAfterReturn: number | null  // AA相場 − 返納額
  note: string                  // 計算根拠メモ
}

export function calcSubsidyReturn(v: Vehicle, aaSalePrice: number | null): SubsidyReturnCalc {
  const hasSubsidy = v.subsidy > 0

  if (!hasSubsidy) {
    return {
      hasSubsidy: false,
      subsidyAmount: 0,
      subsidyRatio: 0,
      obligationMonths: OBLIGATION_MONTHS,
      elapsedMonths: 0,
      remainingMonths: 0,
      isWithinObligation: false,
      obligationEndDate: '',
      nevResidualBV: 0,
      baseAmount: aaSalePrice,
      returnAmount: 0,
      returnAmountCap: 0,
      netProceedsAfterReturn: aaSalePrice,
      note: '補助金受給なし。返納義務なし。',
    }
  }

  // 経過月数計算
  const acqDate = new Date(v.acquired.replace(/\//g, '-'))
  const now = new Date()
  const elapsedMs = now.getTime() - acqDate.getTime()
  const elapsedMonths = Math.floor(elapsedMs / (1000 * 60 * 60 * 24 * 30.4375))
  const remainingMonths = Math.max(0, OBLIGATION_MONTHS - elapsedMonths)
  const isWithinObligation = remainingMonths > 0

  // 処分制限期間満了日
  const obligationEnd = new Date(acqDate)
  obligationEnd.setMonth(obligationEnd.getMonth() + OBLIGATION_MONTHS)
  const obligationEndDate = obligationEnd.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })

  // 補助金比率 = 補助金額 ÷ 車両購入費用
  const subsidyRatio = v.subsidy / v.cost

  // NeV残存簿価 = 取得価額 × (1 - 0.500)^(経過月数/12)
  // 保有義務期間(4年)を基準とした定率法
  const elapsedYears = elapsedMonths / 12
  const nevResidualBV = Math.max(0, Math.round(v.cost * Math.pow(1 - OBLIGATION_RATE, elapsedYears)))

  if (!isWithinObligation) {
    return {
      hasSubsidy: true,
      subsidyAmount: v.subsidy,
      subsidyRatio,
      obligationMonths: OBLIGATION_MONTHS,
      elapsedMonths,
      remainingMonths: 0,
      isWithinObligation: false,
      obligationEndDate,
      nevResidualBV,
      baseAmount: aaSalePrice,
      returnAmount: 0,
      returnAmountCap: v.subsidy,
      netProceedsAfterReturn: aaSalePrice,
      note: `処分制限期間（${OBLIGATION_MONTHS}ヶ月）満了済み。返納義務なし。`,
    }
  }

  // 返納額計算（NeV公式）
  // 返納額 = max(売却額, NeV残存簿価) × 補助金比率
  let returnAmount: number | null = null
  let baseAmount: number | null = null
  let netProceedsAfterReturn: number | null = null

  if (aaSalePrice !== null) {
    baseAmount = Math.max(aaSalePrice, nevResidualBV)
    returnAmount = Math.min(
      Math.round(baseAmount * subsidyRatio),
      v.subsidy  // 上限: 補助金交付額
    )
    netProceedsAfterReturn = aaSalePrice - returnAmount
  }

  const note = [
    `補助金比率: ${(subsidyRatio * 100).toFixed(1)}%（${v.subsidy.toLocaleString()}円 ÷ ${v.cost.toLocaleString()}円）`,
    `NeV残存簿価: ¥${nevResidualBV.toLocaleString()}（取得価額×(1-0.500)^${elapsedYears.toFixed(2)}年）`,
    aaSalePrice ? `算定基礎: max(売却額¥${aaSalePrice.toLocaleString()}, 残存簿価¥${nevResidualBV.toLocaleString()}) = ¥${baseAmount?.toLocaleString()}` : '',
    `返納上限: ¥${v.subsidy.toLocaleString()}（補助金交付額）`,
    `根拠: NeV交付要綱 Ⅲ.財産処分`,
  ].filter(Boolean).join(' / ')

  return {
    hasSubsidy: true,
    subsidyAmount: v.subsidy,
    subsidyRatio,
    obligationMonths: OBLIGATION_MONTHS,
    elapsedMonths,
    remainingMonths,
    isWithinObligation,
    obligationEndDate,
    nevResidualBV,
    baseAmount,
    returnAmount,
    returnAmountCap: v.subsidy,
    netProceedsAfterReturn,
    note,
  }
}
