import { NextRequest, NextResponse } from 'next/server'

/**
 * Extract a single target Chinese character from natural-language speech.
 *
 * Uses DeepSeek (or legacy MiniMax-M3). Server-side only — API key never leaves the server.
 *
 * POST /api/extract-char
 * Body: { text: string, alternatives?: string[] }
 * Returns: { char: string | null, source: 'llm' | 'rule' }
 */

const SYSTEM_PROMPT = `从用户的话里提取他们想查的目标汉字。

只返回 JSON: {"char": "讯"}

完全无目标字时 char 返回空字符串。

输入来自语音识别,可能有错别字。先结合上下文和汉语常识判断哪些字可能是 ASR 听错的,用最可能的正确字替代后再提取目标字。`

interface ExtractRequest {
  text: string
  alternatives?: string[]
}

interface ExtractResponse {
  char: string | null
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
      source: 'rule',
    })
  }

  // Read API key — primary DeepSeek, fallback MiniMax for legacy
  const apiKey = process.env.DEEPSEEK_API_KEY || process.env.MINIMAX_API_KEY || process.env.MINIMAX_CN_API_KEY
  const baseUrl = process.env.DEEPSEEK_BASE_URL || process.env.MINIMAX_BASE_URL || 'https://api.deepseek.com/v1'
  const model = process.env.DEEPSEEK_MODEL || process.env.MINIMAX_MODEL || 'deepseek-v4-flash'

  if (!apiKey) {
    return NextResponse.json<ExtractResponse>({
      char: null,
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
    let parsed: { char?: string | null } = {}
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
      source: 'llm',
      raw: content.slice(0, 200),
    })
  } catch (err) {
    // LLM failed — log and return null so caller can prompt user to retry
    console.error('[extract-char] LLM failed:', err)
    return NextResponse.json<ExtractResponse>({
      char: null,
      source: 'rule',
    })
  }
}

// Block other methods
export async function GET() {
  return NextResponse.json({ error: 'POST only' }, { status: 405 })
}
