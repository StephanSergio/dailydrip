import { OCCASION_STYLE } from './options'
import type { WardrobeItem, OutfitResult, Mode } from '../types'

// The Anthropic key never lives in the browser. We POST the Messages API body
// to our Cloudflare Worker proxy, which injects the key server-side. The proxy
// URL is public (safe to ship in the bundle).
const PROXY_URL = import.meta.env.VITE_ANTHROPIC_PROXY_URL
const MODEL = 'claude-sonnet-4-6'

const SYSTEM_PROMPT = `You are DailyDrip, a personal AI stylist for one specific user.

USER PROFILE:
- Early 30s dark-skinned male, 176cm, 82kg
- Build: stocky athletic — broad chest and shoulders, muscular legs
- Height awareness: avoid cropped fits; straight/slim trouser to elongate;
  mid-thigh or above-knee shorts; fitted tops, never oversized
- Skin tone: dark — earth tones (camel, rust, olive, burgundy, forest
  green) and clean brights (white, cobalt, coral) land exceptionally well;
  avoid washed-out pastels and light beige close to the skin
- Style: clean basics as the foundation, exactly ONE accent piece per look
- Base palette: white, grey, navy, black, camel
- Accent rule: one hero item (bold sneaker, statement jacket, jewellery,
  color pop) — the rest of the outfit supports it, never competes
- Fragrance: fresh/clean for day; woody/bold for evening

RULES:
- Color harmony: cool tone base; max 1 accent color per look
- Style consistency: all items must match the occasion's style context
- Build awareness: fitted and structured; elongating proportions;
  straight/slim on the bottom; never shapeless or oversized formal pieces
- Weather logic:
    hot/sunny  -> light colors, breathable, no coat or sweater
    cold/rainy -> layering, darker tones, always outerwear
    mild       -> jacket/sweater optional
- Mood alignment across the full look
- Footwear must match the overall formality level of the outfit
- Headwear, bags, jewellery: only when contextually appropriate
- Never violate the "never combine" rules from the outfit modes
- One accent rule: flag in styleNote if two items compete for attention
- Actively suggest earth tones and clean brights when wardrobe allows
- If only one item exists in a category, always pick it

OUTFIT MODES:
- lifestyle: bottoms (pants/shorts), exactly one top, footwear, fragrance.
  Optional by context: sweater, jacket, coat, rainjacket, cap/beanie, bag,
  jewellery. Never two tops; never coat+rainjacket; never dress shoes with
  sporty/jogger bottoms; never cap with formal/work; never swimwear outside
  beach; never blazer with training shoe; never chelsea boot with athletic
  shorts.
- sport: sportbottoms, sporttop or tanktop, sneakers (runner/training only).
  Optional: fragrance (fresh/aquatic), sweater/rainjacket (cold/rainy),
  backpack, cap/beanie. Never dress shirts, dress shoes, boots, coats,
  blazers, knitwear, turtlenecks, jewellery, formal pants.
- beach: swimwear, tanktop or loose tshirt, casual sneakers or slides,
  fragrance (fresh/aquatic). Optional: cap/bucket hat, tote/backpack, light
  overshirt cover-up.

Always return TWO complete outfits per generation:
  1. Primary — best match for the inputs
  2. Backup  — alternative direction or different vibe

Pick items ONLY from the wardrobe provided in the user message, referencing
each by its exact documentId (the "id" field). If a slot has no suitable
item, return null for it.

Return ONLY valid JSON, no markdown, no preamble:
{
  "mode": "lifestyle" | "sport" | "beach",
  "primary": {
    "bottoms": "documentId",
    "top": "documentId",
    "outerwear": "documentId or null",
    "footwear": "documentId",
    "headwear": "documentId or null",
    "bag": "documentId or null",
    "jewellery": "documentId or null",
    "fragrance": "documentId or null",
    "explanation": "2-3 sentences on why this works for this user"
  },
  "backup": {
    "bottoms": "documentId",
    "top": "documentId",
    "outerwear": "documentId or null",
    "footwear": "documentId",
    "headwear": "documentId or null",
    "bag": "documentId or null",
    "jewellery": "documentId or null",
    "fragrance": "documentId or null",
    "explanation": "2-3 sentences on the alternative direction"
  },
  "styleNote": "one sentence — flag if any item clashes with user profile"
}`

interface LeanItem {
  id: string
  name: string
  category: string
  subcategory: string
  colors: string[]
  style: string[]
}

// Strip every wardrobe item down to the lean payload Claude needs. Never send
// photoURL, photoPath, createdAt, or any other field.
function leanWardrobe(items: WardrobeItem[]): LeanItem[] {
  return items.map((i) => ({
    id: i.id,
    name: i.name,
    category: i.category,
    subcategory: i.subcategory,
    colors: i.colors || [],
    style: i.style || [],
  }))
}

function parseOutfitJSON(text: string): OutfitResult {
  // The model is asked for raw JSON, but defend against stray prose/fences.
  const trimmed = text.trim()
  const start = trimmed.indexOf('{')
  const end = trimmed.lastIndexOf('}')
  if (start === -1 || end === -1) {
    throw new Error('No JSON found in stylist response')
  }
  return JSON.parse(trimmed.slice(start, end + 1)) as OutfitResult
}

interface AnthropicTextBlock {
  type: string
  text?: string
}
interface AnthropicResponse {
  content?: AnthropicTextBlock[]
  error?: { message?: string }
}

export interface GenerateArgs {
  wardrobe: WardrobeItem[]
  mode: Mode
  weather: string
  occasion: string
  mood: string
}

export async function generateOutfits({
  wardrobe,
  mode,
  weather,
  occasion,
  mood,
}: GenerateArgs): Promise<OutfitResult> {
  if (!PROXY_URL) {
    throw new Error(
      'Stylist not configured — set VITE_ANTHROPIC_PROXY_URL to your Cloudflare Worker URL.',
    )
  }

  const lean = leanWardrobe(wardrobe)

  const contextLines = [`Mode: ${mode}`]
  if (mode !== 'sport') {
    contextLines.push(`Occasion: ${occasion} (${OCCASION_STYLE[occasion] || ''})`)
  }
  contextLines.push(`Weather: ${weather}`)
  contextLines.push(`Mood: ${mood}`)

  const userMessage = `${contextLines.join('\n')}

WARDROBE (pick items by their "id"):
${JSON.stringify(lean)}

Build the primary and backup outfits for the inputs above. Return ONLY the JSON object.`

  const res = await fetch(PROXY_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    }),
  })

  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(`Stylist request failed (${res.status}). ${detail.slice(0, 200)}`)
  }

  const data = (await res.json()) as AnthropicResponse
  if (data.error) {
    throw new Error(data.error.message || 'Stylist returned an error')
  }

  const text = (data.content || [])
    .filter((b) => b.type === 'text')
    .map((b) => b.text || '')
    .join('')

  return parseOutfitJSON(text)
}
