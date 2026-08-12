export type MarketData = {
  model: string
  label: string
  retailMin: number
  retailMax: number
  retailAvg: number
  buyoutMin: number
  buyoutMax: number
  aaEstimate: number
  trend: 'up' | 'flat' | 'down'
  trendPct: number
  source: string
  updatedAt: string
}

export const MARKET_DATA: MarketData[] = [
  { model:'BYD ATTO3', label:'BYD ATTO3', retailMin:2380000, retailMax:3390000, retailAvg:2800000, buyoutMin:1400000, buyoutMax:1750000, aaEstimate:1450000, trend:'down', trendPct:-3.2, source:'車選びドットコム / ガリバー', updatedAt:'2026-08-12' },
  { model:'BYD DOLPHIN', label:'BYD DOLPHIN', retailMin:1747000, retailMax:3280000, retailAvg:2164000, buyoutMin:1200000, buyoutMax:1600000, aaEstimate:1250000, trend:'down', trendPct:-1.6, source:'carview! / ガリバー', updatedAt:'2026-08-12' },
  { model:'DOLPHIN LR', label:'BYD DOLPHIN LR', retailMin:2190000, retailMax:3190000, retailAvg:2500000, buyoutMin:1400000, buyoutMax:1800000, aaEstimate:1500000, trend:'down', trendPct:-1.6, source:'carview! / ガリバー（LR推定）', updatedAt:'2026-08-12' },
  { model:'Audi Q4', label:'Audi Q4 e-tron', retailMin:3180000, retailMax:4890000, retailAvg:3900000, buyoutMin:2120000, buyoutMax:2791000, aaEstimate:2600000, trend:'flat', trendPct:0.5, source:'グーネット買取 / ユーカーパック', updatedAt:'2026-08-12' },
]

export function getMarketData(modelName: string): MarketData | null {
  if (modelName.includes('ATTO3')) return MARKET_DATA.find(m => m.model === 'BYD ATTO3') ?? null
  if (modelName.includes('LR')) return MARKET_DATA.find(m => m.model === 'DOLPHIN LR') ?? null
  if (modelName.includes('DOLPHIN')) return MARKET_DATA.find(m => m.model === 'BYD DOLPHIN') ?? null
  if (modelName.includes('Q4') || modelName.includes('Audi')) return MARKET_DATA.find(m => m.model === 'Audi Q4') ?? null
  return null
}
