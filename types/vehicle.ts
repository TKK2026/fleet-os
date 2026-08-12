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
  gain: number | null
  gain2: number | null
  corp_tax_amount: number
  ct_amount: number | null
  take_home: number | null
}
