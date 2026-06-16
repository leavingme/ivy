import { NextRequest, NextResponse } from 'next/server'

/**
 * Extract a single target Chinese character from natural-language speech.
 *
 * Uses MiniMax-M3. Server-side only — API key never leaves the server.
 *
 * POST /api/extract-char
 * Body: { text: string, alternatives?: string[] }
 * Returns: { char: string, confidence: number, source: 'llm' | 'rule' }
 */

const SYSTEM_PROMPT = `从用户的话里提取他们想查的目标汉字。

只返回 JSON: {"char": "讯", "confidence": 0.95}

完全无目标字时 char 返回空字符串。

注意: 输入来自语音识别,可能含错误(添字/丢字/换字)。如果"X的Y字怎么写"这种句式里的 Y 根本不出现在 X 里(如"准备的被字怎么写"——"被"不在"准备"里),说明 ASR 听错了,返回空字符串。多个候选时挑最像原话的那个。`

interface ExtractRequest {
  text: string
  alternatives?: string[]
}

interface ExtractResponse {
  char: string | null
  confidence: number
  source: 'llm' | 'rule'
  /** echo the raw model output for debugging */
  raw?: string
}

export async function POST(req: NextRequest) {
  let body: ExtractRequest
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid JSON' }, { status: 400 })
  }

  const text = (body.text ?? '').trim()
  if (!text) {
    return NextResponse.json<ExtractResponse>({
      char: null,
      confidence: 0,
      source: 'rule',
    })
  }

  // Read API key — support both naming conventions
  const apiKey = process.env.MINIMAX_API_KEY || process.env.MINIMAX_CN_API_KEY
  const baseUrl = process.env.MINIMAX_BASE_URL || 'https://api.minimaxi.com/v1'
  const model = process.env.MINIMAX_MODEL || 'MiniMax-M3'

  if (!apiKey) {
    return NextResponse.json<ExtractResponse>({
      char: null,
      confidence: 0,
      source: 'rule',
    })
  }

  // Build user prompt — include alternatives if available
  const altText = body.alternatives && body.alternatives.length > 0
    ? `\n候选 ASR 结果(选最可能正确的):\n${body.alternatives.map((a, i) => `  ${i + 1}. ${a}`).join('\n')}`
    : ''

  const userPrompt = `用户说的话(可能含 ASR 错误):
"""${text}"""${altText}

提取目标汉字,只返回 JSON:`

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0,
        max_tokens: 500,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
      }),
    })

    if (!response.ok) {
      throw new Error(`LLM ${response.status}: ${await response.text().catch(() => '')}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content ?? ''

    // Parse model JSON output
    let parsed: { char?: string | null; confidence?: number } = {}
    try {
      parsed = JSON.parse(content)
    } catch {
      // Try to extract JSON from a possibly noisy response
      const m = content.match(/\{[\s\S]*\}/)
      if (m) parsed = JSON.parse(m[0])
    }

    const char =
      typeof parsed.char === 'string' && /[\u4e00-\u9fff]/.test(parsed.char)
        ? parsed.char
        : null

    return NextResponse.json<ExtractResponse>({
      char,
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.9,
      source: 'llm',
      raw: content.slice(0, 200),
    })
  } catch (err) {
    // LLM failed — log and return null so caller can prompt user to retry
    console.error('[extract-char] LLM failed:', err)
    return NextResponse.json<ExtractResponse>({
      char: null,
      confidence: 0,
      source: 'rule',
    })
  }
}

// Block other methods
export async function GET() {
  return NextResponse.json({ error: 'POST only' }, { status: 405 })
}
