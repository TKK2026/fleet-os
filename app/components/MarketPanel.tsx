'use client'
import { MARKET_DATA, MarketData } from '@/lib/marketData'
import { TrendingUp, TrendingDown, Minus, ExternalLink } from 'lucide-react'

function yen(n: number) {
  return '¥' + Math.round(n / 10000).toLocaleString() + '万'
}

function TrendIcon({ trend, pct }: { trend: MarketData['trend']; pct: number }) {
  if (trend === 'up') return <span className="flex items-center gap-1 text-[#27500A]"><TrendingUp size={12} />前月比 +{pct}%</span>
  if (trend === 'down') return <span className="flex items-center gap-1 text-[#791F1F]"><TrendingDown size={12} />前月比 {pct}%</span>
  return <span className="flex items-center gap-1 text-[#5A5850]"><Minus size={12} />前月比 {pct > 0 ? '+' : ''}{pct}%</span>
}

function ModelCard({ m }: { m: MarketData }) {
  const rangeW = m.retailMax - m.retailMin
  const avgPct = Math.round(((m.retailAvg - m.retailMin) / rangeW) * 100)
  const buyPct = Math.round(((m.buyoutMax - m.retailMin) / rangeW) * 100)
  const aaPct = Math.min(100, Math.round(((m.aaEstimate - m.retailMin) / rangeW) * 100))
  const sourceLinks: Record<string, string> = {
    'BYD ATTO3':   'https://221616.com/search/market-price/byd_atto3/',
    'BYD DOLPHIN': 'https://221616.com/search/market-price/byd_dolphin/',
    'DOLPHIN LR':  'https://kakaku.com/kuruma/used/maker/BYD/DOLPHIN/',
    'Audi Q4':     'https://www.goo-net.com/kaitori/maker_guide/show/2010/20102535/',
  }
  return (
    <div className="bg-white border border-[#E4E2DC] rounded-xl p-5 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="text-sm font-medium text-[#1A1916]">{m.label}</div>
          <div className="text-[10px] text-[#9A9890] mt-0.5">2023年式 相場 ｜ {m.updatedAt} 更新</div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-xs"><TrendIcon trend={m.trend} pct={m.trendPct} /></div>
          {sourceLinks[m.model] && (
            <a href={sourceLinks[m.model]} target="_blank" rel="noopener noreferrer" className="text-[#9A9890] hover:text-[#0C447C]">
              <ExternalLink size={12} />
            </a>
          )}
        </div>
      </div>
      <div className="mb-4">
        <div className="flex justify-between text-[10px] text-[#9A9890] mb-1">
          <span>{yen(m.retailMin)}</span><span>小売相場</span><span>{yen(m.retailMax)}</span>
        </div>
        <div className="relative h-3 bg-[#F2F0EC] rounded-full overflow-hidden border border-[#E4E2DC]">
          <div className="absolute top-0 h-full bg-[#85B7EB] opacity-40 rounded-full" style={{ width: `${avgPct}%` }} />
          <div className="absolute top-0 h-full w-0.5 bg-[#EF9F27]" style={{ left: `${aaPct}%` }} />
          <div className="absolute top-0 h-full w-0.5 bg-[#639922]" style={{ left: `${Math.min(100, buyPct)}%` }} />
        </div>
        <div className="flex gap-3 mt-1.5 text-[10px] text-[#9A9890]">
          <span><span className="inline-block w-2 h-2 bg-[#85B7EB] rounded-sm align-middle mr-1 opacity-60" />小売平均</span>
          <span><span className="inline-block w-0.5 h-3 bg-[#EF9F27] align-middle mr-1" />AA推定</span>
          <span><span className="inline-block w-0.5 h-3 bg-[#639922] align-middle mr-1" />買取上限</span>
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between items-center py-2 border-b border-[#F2F0EC]">
          <span className="text-xs text-[#5A5850]">小売相場（参考）</span>
          <span className="text-xs font-medium text-[#1A1916]">{yen(m.retailMin)} 〜 {yen(m.retailMax)}</span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-[#F2F0EC]">
          <span className="text-xs text-[#5A5850]">買取相場</span>
          <span className="text-xs font-medium text-[#0C447C]">{yen(m.buyoutMin)} 〜 {yen(m.buyoutMax)}</span>
        </div>
        <div className="flex justify-between items-center py-2">
          <span className="text-xs text-[#5A5850] font-medium">AA相場 推定値</span>
          <span className="text-sm font-semibold text-[#633806]">{yen(m.aaEstimate)}</span>
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-[#F2F0EC]">
        <div className="text-[10px] text-[#9A9890]">出典: {m.source}</div>
        <div className="text-[10px] text-[#9A9890] mt-0.5">※AA相場=買取中央値×0.85（業者間流通想定）</div>
      </div>
    </div>
  )
}

export default function MarketPanel() {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-sm font-medium text-[#1A1916]">中古車市場相場</div>
          <div className="text-xs text-[#9A9890] mt-0.5">カーセンサー / グーネット / ガリバー 参照 ｜ 毎月更新予定</div>
        </div>
        <span className="text-[10px] px-2.5 py-1 rounded-full bg-[#FAEEDA] text-[#633806] border border-[#EF9F27]">2026年8月時点</span>
      </div>
      <div className="grid grid-cols-4 gap-3 mb-4">
        {MARKET_DATA.map(m => <ModelCard key={m.model} m={m} />)}
      </div>
      <div className="bg-[#F2F0EC] rounded-lg p-3 text-[11px] text-[#5A5850] leading-relaxed">
        💡 <strong>AA相場の使い方:</strong> 各車両のAA相場欄に上記「AA相場推定値」を入力すると売却損益・税引後手取りが計算されます。
      </div>
    </div>
  )
}
