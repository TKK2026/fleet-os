import { NextRequest, NextResponse } from 'next/server'

// 全台一括 AA相場推定
// 34台分を1回のClaudeリクエストで送信し、JSON配列で全台の推定値を受け取る。
// APIキーはサーバー側のみ（クライアント非露出）。

export const dynamic = 'force-dynamic'

type BulkVehicle = {
  no: number
  name: string
  year?: number
  km?: number | null
  acquired?: string
  cost?: number
}

type BulkEstimate = {
  no: number
  estimatedAA: number
  confidence: 'high' | 'medium' | 'low'
  trend: 'up' | 'flat' | 'down'
}

const CONFIDENCE = new Set(['high', 'medium', 'low'])
const TREND = new Set(['up', 'flat', 'down'])

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { ok: false, error: 'ANTHROPIC_API_KEY が未設定です。.env.local に設定してください。' },
      { status: 500 },
    )
  }

  let vehicles: BulkVehicle[]
  try {
    const body = await req.json()
    vehicles = body?.vehicles
  } catch {
    return NextResponse.json({ ok: false, error: 'リクエストボディが不正です。' }, { status: 400 })
  }

  if (!Array.isArray(vehicles) || vehicles.length === 0) {
    return NextResponse.json({ ok: false, error: 'vehicles 配列が必要です。' }, { status: 400 })
  }

  const rows = vehicles
    .map(v => {
      const year = v.year ?? (v.acquired ? new Date(v.acquired.replace(/\//g, '-')).getFullYear() : '不明')
      const km = v.km != null ? `${v.km.toLocaleString()}km` : '不明'
      const cost = v.cost != null ? `¥${v.cost.toLocaleString()}` : '不明'
      return `- No.${v.no} | ${v.name} | ${year}年式 | 走行${km} | 取得日${v.acquired ?? '不明'} | 取得価額${cost}`
    })
    .join('\n')

  const prompt = `あなたは日本の中古車市場に精通したアナリストです。
以下の${vehicles.length}台について、2026年8月時点における「AAオークション相場（業者間取引価格）」を各台推定してください。

【車両リスト】
${rows}

【前提知識】
- AA相場とはUSS・TAAなどの業者間オークションの落札価格帯（小売価格より20〜30%低い）
- BYD ATTO3（2023年式）の小売相場: 238〜339万円、AA相場: 130〜160万円帯
- BYD DOLPHIN（2023年式）の小売相場: 175〜328万円、AA相場: 110〜145万円帯
- BYD DOLPHIN LR（2023年式）の小売相場: 219〜319万円、AA相場: 135〜165万円帯
- Audi Q4 e-tron（2023年式）の小売相場: 318〜489万円、AA相場: 200〜280万円帯
- EV全般: 走行距離3万km未満は高評価、5万km超で急落する傾向
- 下落トレンド: BYD全般は月次-1〜-3%の下落傾向（2026年現在）
- 宮古島のレンタカーは塩害リスクがわずかにマイナス査定される場合あり

必ず全${vehicles.length}台分を、以下のJSON配列形式のみで回答してください（説明文・マークダウン不要）:
[
  { "no": 車両No（整数）, "estimatedAA": 推定AA相場（円・整数）, "confidence": "high"|"medium"|"low", "trend": "up"|"flat"|"down" }
]`

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 8000,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    const data = await response.json()
    if (!response.ok) {
      return NextResponse.json(
        { ok: false, error: `Claude API エラー (${response.status}): ${data?.error?.message ?? 'unknown'}` },
        { status: 502 },
      )
    }

    const text = data.content?.[0]?.text ?? ''
    const estimates = parseBulk(text)
    if (!estimates) {
      return NextResponse.json({ ok: false, error: 'モデル応答を解析できませんでした。', raw: text }, { status: 502 })
    }

    return NextResponse.json({ ok: true, estimates, count: estimates.length })
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}

// モデル応答からJSON配列を抽出・検証
function parseBulk(text: string): BulkEstimate[] | null {
  const cleaned = text.replace(/```(?:json)?/gi, '').trim()
  const start = cleaned.indexOf('[')
  const end = cleaned.lastIndexOf(']')
  if (start === -1 || end === -1 || end <= start) return null

  let arr: unknown
  try {
    arr = JSON.parse(cleaned.slice(start, end + 1))
  } catch {
    return null
  }
  if (!Array.isArray(arr)) return null

  const out: BulkEstimate[] = []
  for (const item of arr) {
    if (typeof item !== 'object' || item === null) continue
    const o = item as Record<string, unknown>
    const no = typeof o.no === 'number' ? o.no : NaN
    const estimatedAA = typeof o.estimatedAA === 'number' ? Math.round(o.estimatedAA) : NaN
    const confidence = typeof o.confidence === 'string' ? o.confidence.toLowerCase() : ''
    const trend = typeof o.trend === 'string' ? o.trend.toLowerCase() : 'flat'
    if (!Number.isFinite(no) || !Number.isFinite(estimatedAA) || estimatedAA <= 0) continue
    out.push({
      no,
      estimatedAA,
      confidence: CONFIDENCE.has(confidence) ? (confidence as BulkEstimate['confidence']) : 'medium',
      trend: TREND.has(trend) ? (trend as BulkEstimate['trend']) : 'flat',
    })
  }
  return out.length > 0 ? out : null
}
