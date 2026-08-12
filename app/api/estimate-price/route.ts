import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { name, year, km, acquired, cost } = await req.json()

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { ok: false, error: 'ANTHROPIC_API_KEY が未設定です。.env.local に設定してください。' },
      { status: 500 },
    )
  }

  const prompt = `あなたは日本の中古車市場に精通したアナリストです。
以下の車両の2026年8月時点における「AAオークション相場（業者間取引価格）」を推定してください。

【車両情報】
- 車種: ${name}
- 年式: ${year}年
- 走行距離: ${km !== null && km !== undefined ? km.toLocaleString() + 'km' : '不明'}
- 取得日: ${acquired}
- 取得価額: ¥${cost.toLocaleString()}

【前提知識】
- AA相場とはUSS・TAAなどの業者間オークションの落札価格帯（小売価格より20〜30%低い）
- BYD ATTO3（2023年式）の小売相場: 238〜339万円、AA相場: 130〜160万円帯
- BYD DOLPHIN（2023年式）の小売相場: 175〜328万円、AA相場: 110〜145万円帯
- BYD DOLPHIN LR（2023年式）の小売相場: 219〜319万円、AA相場: 135〜165万円帯
- Audi Q4 e-tron（2023年式）の小売相場: 318〜489万円、AA相場: 200〜280万円帯
- EV全般: 走行距離3万km未満は高評価、5万km超で急落する傾向
- 下落トレンド: BYD全般は月次-1〜-3%の下落傾向（2026年現在）
- 宮古島のレンタカーは塩害リスクがわずかにマイナス査定される場合あり

以下のJSON形式のみで回答してください（説明文は不要）:
{
  "estimatedAA": 数値（円・整数）,
  "rangeMin": 数値（円・下限）,
  "rangeMax": 数値（円・上限）,
  "confidence": "high" | "medium" | "low",
  "reasoning": "根拠を100字以内で",
  "trend": "up" | "flat" | "down",
  "trendNote": "トレンドの補足を50字以内で"
}`

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
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    const data = await response.json()
    const text = data.content?.[0]?.text ?? ''

    // JSON抽出
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('JSON parse failed')
    const result = JSON.parse(match[0])

    return NextResponse.json({ ok: true, ...result })
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}
