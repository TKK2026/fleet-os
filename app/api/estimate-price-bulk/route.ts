import { NextRequest, NextResponse } from 'next/server'

type VehicleInput = {
  no: number
  name: string
  acquired: string
  km: number | null
  cost: number
  subsidy: number
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { ok: false, error: 'ANTHROPIC_API_KEY が未設定です。.env.local に設定してください。' },
      { status: 500 },
    )
  }

  const vehicles: VehicleInput[] = await req.json()

  const vehicleList = vehicles.map(v =>
    `No.${v.no} | ${v.name} | 取得:${v.acquired} | 走行:${v.km !== null ? v.km.toLocaleString() + 'km' : '不明'} | 取得価額:¥${v.cost.toLocaleString()} | 補助金:¥${v.subsidy.toLocaleString()}`
  ).join('\n')

  const prompt = `あなたは日本の中古車市場に精通したアナリストです。
2026年8月時点における以下の車両それぞれの「AAオークション相場（業者間取引価格）」を推定してください。

【市場前提知識】
- AA相場 = 業者間オークション（USS・TAA等）の落札価格帯。小売価格より20〜30%低い
- BYD ATTO3（2023〜2024年式）: AA相場 130〜160万円帯。走行距離が少ないほど高い
- BYD DOLPHIN（2023〜2024年式）: AA相場 80〜95万円帯。下落トレンド継続中
- BYD DOLPHIN（2025年式・走行少）: AA相場 110〜130万円帯
- BYD ATTO3（2025年式・高額版・取得価額320万円超）: AA相場 190〜210万円帯
- BYD ATTO3（補助金なし・2025年式）: AA相場 110〜160万円帯（走行距離で変動）
- ハイエース（2025年式）: AA相場 280〜320万円帯（需要安定）
- EV全般: 走行3万km未満→高評価、3〜5万km→普通、5万km超→下落
- 宮古島レンタカー: 塩害リスクで若干マイナス査定
- BYD全般: 月次-1〜-3%の下落トレンド（2026年現在）
- 事故車は30〜40%減額

【対象車両】
${vehicleList}

以下のJSON配列のみで回答してください（説明文・マークダウン不要）:
[
  {"no": 車両No, "aa": 推定AA相場(円・整数), "min": 下限(円), "max": 上限(円), "confidence": "high"|"medium"|"low", "reason": "根拠50字以内"},
  ...
]`

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 4000,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    const data = await response.json()
    const text = data.content?.[0]?.text ?? ''

    // JSON配列を抽出
    const match = text.match(/\[[\s\S]*\]/)
    if (!match) throw new Error('JSON parse failed: ' + text.slice(0, 200))
    const results = JSON.parse(match[0])

    return NextResponse.json({ ok: true, results, estimatedAt: new Date().toISOString() })
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}
