import Anthropic from '@anthropic-ai/sdk'
import { getMarketData } from '@/lib/marketData'

// AI相場推定 API
// 入力: 車種 + 年式 + 走行距離 + 取得日 → Claude → AA相場推定値 + 根拠 + 信頼度
// モデル: claude-sonnet-4-6（指定モデル）。APIキーはサーバー側のみ（クライアント非露出）。

export const dynamic = 'force-dynamic'

type EstimateRequest = {
  name: string
  plate?: string
  km?: number | null
  acquired?: string
  cost?: number
  book_value?: number
}

type EstimateResult = {
  estimate: number
  rationale: string
  confidence: 'high' | 'medium' | 'low'
}

const CONFIDENCE = new Set(['high', 'medium', 'low'])

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(
      { error: 'ANTHROPIC_API_KEY が未設定です。.env.local に設定してください。' },
      { status: 500 },
    )
  }

  let body: EstimateRequest
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'リクエストボディが不正です。' }, { status: 400 })
  }

  if (!body?.name) {
    return Response.json({ error: '車種（name）は必須です。' }, { status: 400 })
  }

  const md = getMarketData(body.name)
  const marketRef = md
    ? `参考相場（${md.label}, 2023年式, ${md.updatedAt}時点）: 小売 ¥${md.retailMin.toLocaleString()}〜¥${md.retailMax.toLocaleString()}、買取 ¥${md.buyoutMin.toLocaleString()}〜¥${md.buyoutMax.toLocaleString()}、AA推定 ¥${md.aaEstimate.toLocaleString()}、前月比トレンド ${md.trend}(${md.trendPct}%)`
    : '参考相場データなし（一般的な中古EV相場から推定すること）。'

  const client = new Anthropic()

  const system = [
    'あなたは日本の中古車オートオークション（AA）相場に精通したプロの査定士です。',
    '入力された車両情報から、業者間流通（AA）での落札見込み価格を円単位で推定します。',
    'AA相場は一般に小売相場を下回り、買取相場（買取中央値×0.85前後）に近い水準です。',
    '走行距離が多いほど、また経過年数が長いほど価格は下がります。',
    '必ず次のJSON形式のみで回答してください。前置き・後置き・マークダウンのコードフェンスは一切禁止です。',
    '{"estimate": <整数・円>, "rationale": "<推定根拠を1〜2文の日本語で>", "confidence": "<high|medium|low>"}',
  ].join('\n')

  const user = [
    `車種: ${body.name}`,
    body.plate ? `ナンバー: ${body.plate}` : '',
    body.acquired ? `取得日（初度登録の目安）: ${body.acquired}` : '',
    body.km != null ? `走行距離: ${body.km.toLocaleString()} km` : '走行距離: 不明',
    body.cost != null ? `新車取得価額（参考）: ¥${body.cost.toLocaleString()}` : '',
    body.book_value != null ? `現在簿価（参考）: ¥${body.book_value.toLocaleString()}` : '',
    marketRef,
    '',
    '上記からAA相場推定値を算出し、指定のJSON形式のみで回答してください。',
  ]
    .filter(Boolean)
    .join('\n')

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 512,
      system,
      messages: [{ role: 'user', content: user }],
    })

    if (message.stop_reason === 'refusal') {
      return Response.json({ error: 'モデルが回答を拒否しました。' }, { status: 502 })
    }

    const text = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map(b => b.text)
      .join('')
      .trim()

    const parsed = parseEstimate(text)
    if (!parsed) {
      return Response.json(
        { error: 'モデル応答を解析できませんでした。', raw: text },
        { status: 502 },
      )
    }

    return Response.json(parsed)
  } catch (err) {
    if (err instanceof Anthropic.APIError) {
      return Response.json(
        { error: `Claude API エラー (${err.status}): ${err.message}` },
        { status: 502 },
      )
    }
    return Response.json({ error: '推定処理でエラーが発生しました。' }, { status: 500 })
  }
}

// モデル応答からJSONを抽出・検証（コードフェンスが混入しても許容）
function parseEstimate(text: string): EstimateResult | null {
  const cleaned = text.replace(/```(?:json)?/gi, '').trim()
  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) return null

  let obj: unknown
  try {
    obj = JSON.parse(cleaned.slice(start, end + 1))
  } catch {
    return null
  }

  if (typeof obj !== 'object' || obj === null) return null
  const o = obj as Record<string, unknown>
  const estimate = typeof o.estimate === 'number' ? Math.round(o.estimate) : NaN
  const rationale = typeof o.rationale === 'string' ? o.rationale : ''
  const confidence = typeof o.confidence === 'string' ? o.confidence.toLowerCase() : ''

  if (!Number.isFinite(estimate) || estimate <= 0) return null
  if (!CONFIDENCE.has(confidence)) return null

  return { estimate, rationale, confidence: confidence as EstimateResult['confidence'] }
}
