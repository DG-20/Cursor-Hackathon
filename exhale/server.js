import 'dotenv/config';
import express from 'express';
import multer from 'multer';
import fetch from 'node-fetch';
import FormData from 'form-data';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app    = express();
const port   = process.env.PORT || 3000;
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

app.use(express.json());
app.use(express.static(join(__dirname, 'public')));

// ── Key detection ─────────────────────────────────────────────────────────────
const hasAnthropic = () => !!process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== 'your_anthropic_key_here';
const hasGemini    = () => !!process.env.GEMINI_API_KEY    && process.env.GEMINI_API_KEY    !== 'your_gemini_key_here';
const hasOpenAI    = () => !!process.env.OPENAI_API_KEY    && process.env.OPENAI_API_KEY    !== 'your_openai_key_here';
const hasAI        = () => hasAnthropic() || hasGemini();

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    ok:       true,
    whisper:  hasOpenAI(),
    claude:   hasAI(),   // frontend just checks this flag — true for either AI
    provider: hasAnthropic() ? 'anthropic' : hasGemini() ? 'gemini' : 'none',
  });
});

// ── Shared system prompt ──────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are a deeply empathetic AI therapist companion named Exhale.
You receive raw emotional venting and respond with structured analysis.

CONTEXT DETECTION — classify carefully:
- "vent": pure emotional processing. The person needs to be heard, not fixed.
- "action": a practical problem exists and the person is implicitly asking for help.
- "mixed": emotional processing AND a practical problem.
- "crisis": language suggests self-harm, hopelessness, or acute distress. NEVER give action steps for crisis — only presence and a resource.

RESPONSE RULES by type:
- vent: reflection only. Deep validation. Mirror their exact emotional language back. No silver linings. No advice.
- action: short validation (1 sentence), then 4-6 concrete gentle next steps.
- mixed: 2-sentence validation, then steps. Reflection comes before action.
- crisis: warm, human, present. 2-3 sentences. No map nodes beyond the single center. Include crisis_resource: true.

Respond ONLY with valid JSON. No markdown. No backticks. No preamble.

{
  "type": "vent|action|mixed|crisis",
  "mood": "single word — anxious|heavy|lost|frustrated|hopeful|tender|overwhelmed|raw|scared|numb|grieving|angry|hollow|restless",
  "mood_emoji": "single emoji",
  "intensity": 1-5,
  "center_theme": "2-4 words — the core of what this is about",
  "nodes": [
    {
      "label": "2-3 word theme",
      "color": "purple|rose|teal|amber|blue|gray",
      "emotion": "one word",
      "weight": 1-3,
      "children": ["1-4 word sub-thought", "1-4 word sub-thought"]
    }
  ],
  "reflection": "Warm, non-toxic validation. Match their tone. For vent: 3-4 sentences. For action/mixed: 1-2 sentences. For crisis: 2-3 sentences of pure human presence.",
  "actions": [],
  "journal_prompt": "One gentle open question that invites deeper self-inquiry. Not problem-solving. Not advice.",
  "crisis_resource": false
}

Node count by type:
- crisis: 1 node maximum
- vent: 3-4 nodes, each with 1-2 children
- action/mixed: 4-6 nodes, each with 1-3 children
- High intensity (4-5): more nodes, deeper children

Colors encode emotion type:
- purple: anxiety, overthinking, mental loops
- rose: grief, longing, tenderness, heartache
- teal: exhaustion, body-based feeling, numbness
- amber: frustration, anger, restlessness
- blue: fear, uncertainty, feeling lost
- gray: disconnection, emptiness, hollowness

Actions format (only for action/mixed):
{ "text": "specific gentle step", "timing": "now|today|soon", "why": "one sentence on why this helps", "estimatedTime": "e.g. 15 min" }`;

// ── Anthropic call ────────────────────────────────────────────────────────────
async function callAnthropic(text) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1200,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: text }],
    }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || `Anthropic HTTP ${response.status}`);

  const raw = data.content.filter(b => b.type === 'text').map(b => b.text).join('');
  return JSON.parse(raw.replace(/```json|```/g, '').trim());
}

// ── Gemini call ───────────────────────────────────────────────────────────────
async function callGemini(text) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ parts: [{ text }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 1200 },
    }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || `Gemini HTTP ${response.status}`);

  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  console.log('[Gemini] raw:', raw.slice(0, 150));

  // Aggressively strip any markdown fences Gemini adds
  const clean = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
  return JSON.parse(clean);
}

// ── Test Anthropic — visit /api/test-anthropic in browser ────────────────────
app.get('/api/test-anthropic', async (req, res) => {
  if (!hasAnthropic()) return res.json({ ok: false, error: 'No ANTHROPIC_API_KEY in .env' });
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 30,
        messages: [{ role: 'user', content: 'Reply with just the words: exhale is working' }],
      }),
    });
    const data = await response.json();
    if (!response.ok) return res.json({ ok: false, status: response.status, error: data.error?.message });
    const text = data.content?.[0]?.text || '';
    res.json({ ok: true, response: text.trim(), model: 'claude-sonnet-4-20250514' });
  } catch (err) {
    res.json({ ok: false, error: err.message });
  }
});

// ── List available models — visit /api/gemini-models to see what's available ──
app.get('/api/gemini-models', async (req, res) => {
  if (!hasGemini()) return res.json({ ok: false, error: 'No GEMINI_API_KEY in .env' });
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    if (!response.ok) return res.json({ ok: false, error: data.error?.message });
    const names = (data.models || []).map(m => m.name);
    res.json({ ok: true, models: names });
  } catch (err) {
    res.json({ ok: false, error: err.message });
  }
});

// ── Test endpoint — visit /api/test-gemini in browser to confirm key works ───
app.get('/api/test-gemini', async (req, res) => {
  if (!hasGemini()) return res.json({ ok: false, error: 'No GEMINI_API_KEY in .env' });
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: 'Reply with just the word: working' }] }] }),
    });
    const data = await response.json();
    if (!response.ok) return res.json({ ok: false, status: response.status, error: data.error?.message });
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    res.json({ ok: true, response: text.trim(), model: 'gemini-2.0-flash' });
  } catch (err) {
    res.json({ ok: false, error: err.message });
  }
});

// ── Whisper transcription ─────────────────────────────────────────────────────
app.post('/api/transcribe', upload.single('audio'), async (req, res) => {
  if (!hasOpenAI()) return res.status(400).json({ error: 'No OpenAI key configured' });
  if (!req.file)    return res.status(400).json({ error: 'No audio file received' });

  try {
    const form = new FormData();
    form.append('file', req.file.buffer, {
      filename:    'recording.webm',
      contentType: req.file.mimetype || 'audio/webm',
    });
    form.append('model', 'whisper-1');
    form.append('language', 'en');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method:  'POST',
      headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`, ...form.getHeaders() },
      body:    form,
    });

    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data.error?.message || 'Whisper error' });
    res.json({ transcript: data.text });

  } catch (err) {
    console.error('[Whisper]', err);
    res.status(500).json({ error: err.message });
  }
});

// ── AI analysis ───────────────────────────────────────────────────────────────
app.post('/api/analyse', async (req, res) => {
  if (!hasAI()) return res.status(400).json({ error: 'No AI key configured' });

  const { text } = req.body;
  if (!text?.trim()) return res.status(400).json({ error: 'No text provided' });

  try {
    const parsed = hasAnthropic() ? await callAnthropic(text) : await callGemini(text);

    // Normalise actions — ensure every action has a stable id + estimatedTime
    // (AI sometimes omits these fields)
    const timeMap = { now:'10 min', today:'30 min', soon:'1-2 hrs' };
    if (Array.isArray(parsed.actions)) {
      parsed.actions = parsed.actions.map((a, i) => ({
        ...a,
        id:            a.id || `ai_${Date.now()}_${i}`,
        estimatedTime: a.estimatedTime || timeMap[a.timing] || '30 min',
      }));
    } else {
      parsed.actions = [];
    }

    console.log(`[AI] type=${parsed.type} mood=${parsed.mood} actions=${parsed.actions.length} nodes=${parsed.nodes?.length}`);
    res.json(parsed);
  } catch (err) {
    console.error('[AI]', err);
    res.status(500).json({ error: err.message });
  }
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(port, () => {
  const provider = hasAnthropic() ? 'anthropic (claude)' : hasGemini() ? 'google (gemini)' : 'not set — demo mode';
  console.log(`\n  ✦ exhale running → http://localhost:${port}\n`);
  console.log(`  ai      : ${provider}`);
  console.log(`  whisper : ${hasOpenAI() ? '✓ configured' : '✗ not set (using browser speech)'}\n`);
});