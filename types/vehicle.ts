export type Vehicle = {
  id?: string
  no: number
  owner: string
  name: string
  plate: string
  vin: string
  acquired: string
  cost: number
  subsidy: number
  rate: number
  life: number
  book_value: number
  bv_subsidy: number
  aa_price: number | null
  priority: string
  km: number | null
  color: string
  dep_monthly: number
  year?: number
  note?: string
  created_at?: string
  updated_at?: string
}

export type TaxSettings = {
  corp_tax: number
  consumption_tax: number
}

export type SaleCalc = {
  aa: number | null
  gain: number | null           // 売却損益②（相場 − 簿価+補助金）
  gain2: number | null          // 売却損益①（相場 − 簿価のみ）
  corp_tax_amount: number       // 法人税負担
  ct_amount: number | null      // 消費税（参考）
  take_home: number | null      // 税引後手取り（法人税のみ）
  subsidy_return: number        // CEV補助金返納額（NeV公式）
  take_home_after_subsidy: number | null  // 実質手取り（法人税+補助金返納後）
}
