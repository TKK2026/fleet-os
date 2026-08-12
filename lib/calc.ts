import { Vehicle, SaleCalc, TaxSettings } from '@/types/vehicle'

export function calcSale(v: Vehicle, settings: TaxSettings): SaleCalc {
  const aa = v.aa_price
  if (!aa) {
    return { aa: null, gain: null, gain2: null, corp_tax_amount: 0, ct_amount: null, take_home: null }
  }
  const gain = aa - v.bv_subsidy
  const gain2 = aa - v.book_value
  const corp_tax_amount = gain > 0 ? Math.round(gain * (settings.corp_tax / 100)) : 0
  const ct_amount = Math.round(aa * (settings.consumption_tax / 100))
  const take_home = aa - corp_tax_amount
  return { aa, gain, gain2, corp_tax_amount, ct_amount, take_home }
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
