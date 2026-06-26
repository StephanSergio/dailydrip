// DailyDrip Anthropic proxy (Cloudflare Worker).
//
// Holds the Anthropic API key as an encrypted Worker secret (env.ANTHROPIC_API_KEY)
// so it never ships in the public site bundle. The frontend POSTs a Messages API
// body here; the Worker injects the key and forwards to Anthropic.
//
// Note: a browser-callable proxy can't be fully locked down (the site is public),
// so this caps the model + max_tokens to bound abuse and restricts CORS to the
// app's origins. Keep an Anthropic spend limit as the real backstop.

const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:4173',
  'https://stephansergio.github.io',
]

const ALLOWED_MODEL = 'claude-sonnet-4-6'
const MAX_TOKENS_CAP = 2000

function corsHeaders(origin) {
  const allow = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  }
}

function json(obj, status, origin) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json', ...corsHeaders(origin) },
  })
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || ''

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders(origin) })
    }
    if (request.method !== 'POST') {
      return json({ error: 'Method not allowed' }, 405, origin)
    }
    if (!env.ANTHROPIC_API_KEY) {
      return json({ error: 'Proxy missing ANTHROPIC_API_KEY secret' }, 500, origin)
    }

    let body
    try {
      body = await request.json()
    } catch {
      return json({ error: 'Invalid JSON body' }, 400, origin)
    }

    // Bound cost: force the expected model and cap output tokens.
    body.model = ALLOWED_MODEL
    if (typeof body.max_tokens !== 'number' || body.max_tokens > MAX_TOKENS_CAP) {
      body.max_tokens = MAX_TOKENS_CAP
    }

    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    })

    const text = await upstream.text()
    return new Response(text, {
      status: upstream.status,
      headers: { 'content-type': 'application/json', ...corsHeaders(origin) },
    })
  },
}
