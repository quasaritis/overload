// analyze-meal — estimate what's on a plate from a photo.
//
// POST { image: <base64 JPEG/WebP, no data: prefix>, mime?: 'image/jpeg' | 'image/webp', hint?: string }
// →    { items: Item[], note: string, provider: string, remaining: number }
//
// Secrets (supabase secrets set …): set ONE of
//   GEMINI_API_KEY     (+ optional GEMINI_MODEL, default gemini-3.8-flash)   — has a free tier
//   ANTHROPIC_API_KEY  (+ optional ANTHROPIC_MODEL, default claude-haiku-5-5)
// Optional: AI_PROVIDER=gemini|anthropic to pick when both are set; SCAN_DAILY_LIMIT (default 40).
import { createClient } from 'npm:@supabase/supabase-js@2.45.4';
import { CATALOG } from './catalog.ts';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

const DISH_IDS = new Set(CATALOG.split('\n').map((l) => l.split('|')[0]));
const DAILY_LIMIT = Number(Deno.env.get('SCAN_DAILY_LIMIT') ?? 40);
const MAX_B64 = 2_800_000; // ≈2 MB image

const PROMPT = `You estimate the nutrition of food in a photo for an Indian calorie-tracking app used by people who lift weights.

Identify every distinct food or drink in the photo and estimate the portion actually served.
- Estimate edible, cooked weight in grams. Use visual scale: a steel katori holds ~150 g of dal/sabzi, a full thali plate is ~28 cm, a roti is ~15 cm and ~40 g, an idli ~40 g, a dosa ~80 g plain. Count pieces (rotis, idlis, pieces of chicken).
- Assume home-style Indian cooking oil/ghee unless the food looks restaurant-style, glossy or fried; then account for the extra fat. Include visible ghee, butter, cream or oil.
- Give kcal, protein, carbs (available carbohydrate), fat and fibre for the portion you see, not per 100 g.
- If the user's note gives quantities or ingredients, trust it over what you see.
- For each item, if it is the same dish as one in this catalog (regional names and minor variations count), put its id in dish_id; otherwise dish_id is null. Catalog lines are id|name|standard serving:
${CATALOG}

Reply with ONLY a JSON object, no prose, in exactly this shape:
{"is_food": true, "items": [{"name": "Dal tadka", "dish_id": "dal_tadka", "portion": "1 katori", "grams": 150, "kcal": 150, "protein_g": 7, "carbs_g": 19, "fat_g": 5, "fibre_g": 3, "confidence": "high"}], "note": "one short sentence on what was hard to judge"}
confidence is "high", "medium" or "low". At most 12 items. If there is no food or drink in the photo, reply {"is_food": false, "items": [], "note": "…"}.`;

interface Item {
  name: string;
  dish_id: string | null;
  portion: string;
  grams: number;
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fibre_g: number;
  confidence: 'high' | 'medium' | 'low';
}

const num = (v: unknown, max: number) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(Math.max(Math.round(n * 10) / 10, 0), max) : 0;
};

function clean(raw: unknown): { items: Item[]; note: string; isFood: boolean } {
  const o = (raw ?? {}) as Record<string, unknown>;
  const list = Array.isArray(o.items) ? o.items.slice(0, 12) : [];
  const items: Item[] = list
    .map((x) => {
      const i = (x ?? {}) as Record<string, unknown>;
      const dish = typeof i.dish_id === 'string' && DISH_IDS.has(i.dish_id) ? i.dish_id : null;
      const conf = i.confidence === 'high' || i.confidence === 'low' ? i.confidence : 'medium';
      return {
        name: String(i.name ?? '').trim().slice(0, 80),
        dish_id: dish,
        portion: String(i.portion ?? '').trim().slice(0, 40),
        grams: num(i.grams, 3000),
        kcal: num(i.kcal, 5000),
        protein_g: num(i.protein_g, 400),
        carbs_g: num(i.carbs_g, 800),
        fat_g: num(i.fat_g, 400),
        fibre_g: num(i.fibre_g, 200),
        confidence: conf as Item['confidence'],
      };
    })
    .filter((i) => i.name && (i.kcal > 0 || i.grams > 0));
  return { items, note: String(o.note ?? '').slice(0, 240), isFood: o.is_food !== false };
}

function parseJson(text: string): unknown {
  const t = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
  const start = t.indexOf('{');
  const end = t.lastIndexOf('}');
  return JSON.parse(start >= 0 && end > start ? t.slice(start, end + 1) : t);
}

async function askGemini(key: string, b64: string, mime: string, hint: string) {
  const model = Deno.env.get('GEMINI_MODEL') ?? 'gemini-3.8-flash';
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify({
      contents: [{
        parts: [
          { text: PROMPT + (hint ? `\n\nUser's note: ${hint}` : '') },
          { inline_data: { mime_type: mime, data: b64 } },
        ],
      }],
      generationConfig: { response_mime_type: 'application/json', temperature: 0.2 },
    }),
  });
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const body = await res.json();
  const text = body?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? '').join('') ?? '';
  return parseJson(text);
}

async function askAnthropic(key: string, b64: string, mime: string, hint: string) {
  const model = Deno.env.get('ANTHROPIC_MODEL') ?? 'claude-haiku-5-5';
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model,
      max_tokens: 1500,
      temperature: 0.2,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mime, data: b64 } },
          { type: 'text', text: PROMPT + (hint ? `\n\nUser's note: ${hint}` : '') },
        ],
      }],
    }),
  });
  if (!res.ok) throw new Error(`Anthropic ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const body = await res.json();
  const text = (body?.content ?? []).map((c: { text?: string }) => c.text ?? '').join('');
  return parseJson(text);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Use POST.' }, 405);

  const gemini = Deno.env.get('GEMINI_API_KEY');
  const anthropic = Deno.env.get('ANTHROPIC_API_KEY');
  const pref = Deno.env.get('AI_PROVIDER');
  const provider = pref === 'anthropic' && anthropic ? 'anthropic' : pref === 'gemini' && gemini ? 'gemini' : gemini ? 'gemini' : anthropic ? 'anthropic' : null;
  if (!provider) return json({ error: 'Photo scanning isn’t set up yet: add a GEMINI_API_KEY or ANTHROPIC_API_KEY secret to the analyze-meal function.', code: 'not_configured' }, 503);

  const auth = req.headers.get('Authorization') ?? '';
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: auth } },
  });
  const { data: userData, error: userErr } = await supabase.auth.getUser(auth.replace(/^Bearer\s+/i, ''));
  if (userErr || !userData?.user) return json({ error: 'Sign in again to scan photos.' }, 401);

  let body: { image?: string; mime?: string; hint?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Bad request.' }, 400);
  }
  const b64 = (body.image ?? '').replace(/^data:[^,]+,/, '');
  const mime = body.mime === 'image/webp' ? 'image/webp' : 'image/jpeg';
  const hint = String(body.hint ?? '').slice(0, 300);
  if (!b64 || b64.length > MAX_B64) return json({ error: 'That photo is too large. Try again — the app shrinks it before sending.' }, 413);

  // Daily cap per user
  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const { count } = await supabase.from('food_scans').select('id', { count: 'exact', head: true }).gte('created_at', since);
  const used = count ?? 0;
  if (used >= DAILY_LIMIT) return json({ error: `You’ve used all ${DAILY_LIMIT} photo scans for today. Log from Indian meals or ingredients instead.`, code: 'limit' }, 429);
  const { error: insErr } = await supabase.from('food_scans').insert({});
  if (insErr) return json({ error: 'Couldn’t start the scan. Try again.' }, 500);

  try {
    const raw = provider === 'gemini' ? await askGemini(gemini!, b64, mime, hint) : await askAnthropic(anthropic!, b64, mime, hint);
    const { items, note, isFood } = clean(raw);
    if (!isFood || items.length === 0) {
      return json({ items: [], note: note || 'No food found in that photo.', provider, remaining: DAILY_LIMIT - used - 1 });
    }
    return json({ items, note, provider, remaining: DAILY_LIMIT - used - 1 });
  } catch (e) {
    console.error('analyze-meal', e);
    return json({ error: 'Couldn’t read that photo. Try a clearer, top-down shot in good light.' }, 502);
  }
});
