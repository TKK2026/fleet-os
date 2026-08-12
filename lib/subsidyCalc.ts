// CEV補助金 返納額計算
// 根拠: 次世代自動車振興センター(NeV)公式交付要綱
// 返納額 = max(売却額, NeV残存簿価) × 補助金比率
// 補助金比率 = 補助金額 ÷ 車両購入費用（修正取得額）
// NeV残存簿価 = 取得価額 × (1 - 0.500)^経過年数（4年定率法）
// 返納額上限 = 補助金交付額
// 保有義務期間 = 48ヶ月（EV・2024年度〜）

import { Vehicle } from '@/types/vehicle'

const OBLIGATION_MONTHS = 48
const OBLIGATION_RATE = 0.500

export type SubsidyReturnCalc = {
  hasSubsidy: boolean
  subsidyAmount: number
  subsidyRatio: number
  obligationMonths: number
  elapsedMonths: number
  remainingMonths: number
  isWithinObligation: boolean
  obligationEndDate: string
  nevResidualBV: number
  baseAmount: number | null
  returnAmount: number | null
  returnAmountCap: number
  netProceedsAfterReturn: number | null
  note: string
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

  const acqDate = new Date(v.acquired.replace(/\//g, '-'))
  const now = new Date()
  const elapsedMonths = Math.floor(
    (now.getTime() - acqDate.getTime()) / (1000 * 60 * 60 * 24 * 30.4375)
  )
  const remainingMonths = Math.max(0, OBLIGATION_MONTHS - elapsedMonths)
  const isWithinObligation = remainingMonths > 0

  const obligationEnd = new Date(acqDate)
  obligationEnd.setMonth(obligationEnd.getMonth() + OBLIGATION_MONTHS)
  const obligationEndDate = obligationEnd.toLocaleDateString('ja-JP', {
    year: 'numeric', month: 'long', day: 'numeric'
  })

  const subsidyRatio = v.subsidy / v.cost
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
      note: `処分制限期間（${OBLIGATION_MONTHS}ヶ月）満了済み。返納義務なし。満了日: ${obligationEndDate}`,
    }
  }

  let returnAmount: number | null = null
  let baseAmount: number | null = null
  let netProceedsAfterReturn: number | null = null

  if (aaSalePrice !== null) {
    baseAmount = Math.max(aaSalePrice, nevResidualBV)
    returnAmount = Math.min(
      Math.round(baseAmount * subsidyRatio),
      v.subsidy
    )
    netProceedsAfterReturn = aaSalePrice - returnAmount
  }

  const note = [
    `補助金比率: ${(subsidyRatio * 100).toFixed(1)}%（¥${v.subsidy.toLocaleString()} ÷ ¥${v.cost.toLocaleString()}）`,
    `NeV残存簿価: ¥${nevResidualBV.toLocaleString()}（取得価額×(1-0.500)^${elapsedYears.toFixed(2)}年）`,
    aaSalePrice ? `算定基礎: max(売却額¥${aaSalePrice.toLocaleString()}, 残存簿価¥${nevResidualBV.toLocaleString()}) = ¥${baseAmount?.toLocaleString()}` : '',
    `返納上限: ¥${v.subsidy.toLocaleString()}（補助金交付額）`,
    `満了日: ${obligationEndDate}（残${remainingMonths}ヶ月）`,
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
