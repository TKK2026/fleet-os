import { Vehicle, SaleCalc, TaxSettings } from '@/types/vehicle'
import { calcSubsidyReturn } from '@/lib/subsidyCalc'

export function calcSale(v: Vehicle, settings: TaxSettings): SaleCalc {
  const aa = v.aa_price
  if (!aa) {
    return {
      aa: null, gain: null, gain2: null,
      corp_tax_amount: 0, ct_amount: null, take_home: null,
      subsidy_return: 0, take_home_after_subsidy: null,
    }
  }

  const gain = aa - v.bv_subsidy   // 売却損益②（相場 − 簿価+補助金）
  const gain2 = aa - v.book_value  // 売却損益①（相場 − 簿価のみ）

  // 法人税：売却損益②が益の場合のみ課税
  const corp_tax_amount = gain > 0 ? Math.round(gain * (settings.corp_tax / 100)) : 0
  const ct_amount = Math.round(aa * (settings.consumption_tax / 100))

  // CEV補助金返納額（NeV公式計算式）
  const subsidyCalc = calcSubsidyReturn(v, aa)
  const subsidy_return = subsidyCalc.returnAmount ?? 0

  // 税引後手取り（法人税のみ控除）
  const take_home = aa - corp_tax_amount

  // 補助金返納後の実質手取り（法人税 + 補助金返納を控除）
  const take_home_after_subsidy = aa - corp_tax_amount - subsidy_return

  return {
    aa, gain, gain2,
    corp_tax_amount, ct_amount,
    take_home,
    subsidy_return,
    take_home_after_subsidy,
  }
}

export function yenM(n: number | null): string {
  if (n === null || n === undefined) return '−'
  const abs = Math.abs(n)
  const sign = n < 0 ? '△' : ''
  return sign + '¥' + Math.round(abs / 10000).toLocaleString() + '万'
}

export function yen(n: number | null): string {
  if (n === null || n === undefined) return '−'
  const abs = Math.abs(n)
  const sign = n < 0 ? '△' : ''
  return sign + '¥' + Math.round(abs).toLocaleString()
}

export function elapsedMonths(acquired: string): number {
  const d = new Date(acquired.replace(/\//g, '-'))
  return Math.round((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24 * 30.5))
}
