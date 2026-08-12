'use client'
import { useState } from 'react'
import { Vehicle } from '@/types/vehicle'
import { Sparkles, TrendingDown, TrendingUp, Minus, AlertCircle } from 'lucide-react'

type EstimateResult = {
  estimatedAA: number
  rangeMin: number
  rangeMax: number
  confidence: 'high' | 'medium' | 'low'
  reasoning: string
  trend: 'up' | 'flat' | 'down'
  trendNote: string
}

type Props = {
  vehicle: Vehicle
  onApply: (price: number) => void
}

function yen(n: number) {
  return '¥' + Math.round(n / 10000).toLocaleString() + '万'
}

const confidenceLabel = { high: '高', medium: '中', low: '低' }
const confidenceColor = {
  high: 'text-[#27500A] bg-[#EAF3DE] border-[#97C459]',
  medium: 'text-[#633806] bg-[#FAEEDA] border-[#EF9F27]',
  low: 'text-[#791F1F] bg-[#FCEBEB] border-[#F09595]',
}

export default function AiPriceEstimator({ vehicle: v, onApply }: Props) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<EstimateResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleEstimate = async () => {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch('/api/estimate-price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: v.name,
          year: v.year ?? new Date(v.acquired.replace(/\//g,'-')).getFullYear(),
          km: v.km,
          acquired: v.acquired,
          cost: v.cost,
        }),
      })
      const data = await res.json()
      if (!data.ok) throw new Error(data.error)
      setResult(data)
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="border-t border-[#E4E2DC] pt-4 mt-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-[10px] font-semibold tracking-widest uppercase text-[#5A5850]">
            AI相場推定
          </div>
          <div className="text-[10px] text-[#9A9890] mt-0.5">
            車種・走行距離・市場トレンドからClaudeが推定
          </div>
        </div>
        <button
          onClick={handleEstimate}
          disabled={loading}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium bg-[#0C447C] text-white hover:bg-[#185FA5] disabled:opacity-50 transition-colors"
        >
          <Sparkles size={12} />
          {loading ? '推定中…' : 'AI相場を推定'}
        </button>
      </div>

      {loading && (
        <div className="bg-[#E6F1FB] rounded-lg p-4 text-xs text-[#0C447C] flex items-center gap-2">
          <div className="w-3 h-3 border-2 border-[#0C447C] border-t-transparent rounded-full animate-spin" />
          Claude が市場データを分析中…
        </div>
      )}

      {error && (
        <div className="bg-[#FCEBEB] rounded-lg p-3 text-xs text-[#791F1F] flex items-center gap-2">
          <AlertCircle size={12} />
          推定に失敗しました: {error}
        </div>
      )}

      {result && (
        <div className="bg-[#E6F1FB] border border-[#85B7EB] rounded-lg p-4">
          {/* メイン推定値 */}
          <div className="flex items-baseline gap-3 mb-3">
            <div>
              <div className="text-[10px] text-[#0C447C] mb-0.5">推定AA相場</div>
              <div className="text-2xl font-semibold text-[#042C53]">{yen(result.estimatedAA)}</div>
              <div className="text-[10px] text-[#5A5850] mt-0.5">
                レンジ: {yen(result.rangeMin)} 〜 {yen(result.rangeMax)}
              </div>
            </div>
            <div className="ml-auto flex flex-col items-end gap-1.5">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${confidenceColor[result.confidence]}`}>
                信頼度: {confidenceLabel[result.confidence]}
              </span>
              <span className="flex items-center gap-1 text-[10px] text-[#5A5850]">
                {result.trend === 'down' && <><TrendingDown size={11} className="text-[#791F1F]" /><span className="text-[#791F1F]">下落傾向</span></>}
                {result.trend === 'up'   && <><TrendingUp size={11} className="text-[#27500A]" /><span className="text-[#27500A]">上昇傾向</span></>}
                {result.trend === 'flat' && <><Minus size={11} /><span>横ばい</span></>}
              </span>
            </div>
          </div>

          {/* 根拠 */}
          <div className="text-[10px] text-[#0C447C] bg-white bg-opacity-60 rounded p-2 mb-3 leading-relaxed">
            <span className="font-medium">推定根拠: </span>{result.reasoning}
            {result.trendNote && <span className="block mt-0.5 text-[#378ADD]">{result.trendNote}</span>}
          </div>

          {/* 適用ボタン */}
          <div className="flex gap-2">
            <button
              onClick={() => onApply(result.estimatedAA)}
              className="flex-1 py-2 text-xs font-medium bg-[#0C447C] text-white rounded-lg hover:bg-[#185FA5] transition-colors"
            >
              この金額をAA相場にセット（{yen(result.estimatedAA)}）
            </button>
            <button
              onClick={() => onApply(result.rangeMin)}
              className="px-3 py-2 text-xs text-[#0C447C] border border-[#85B7EB] rounded-lg hover:bg-white transition-colors"
            >
              下限値
            </button>
            <button
              onClick={() => onApply(result.rangeMax)}
              className="px-3 py-2 text-xs text-[#0C447C] border border-[#85B7EB] rounded-lg hover:bg-white transition-colors"
            >
              上限値
            </button>
          </div>

          <div className="mt-2 text-[9px] text-[#85B7EB]">
            ※AI推定値は参考値です。実際のオークション落札価格は車両状態・時期により変動します。
          </div>
        </div>
      )}
    </div>
  )
}
