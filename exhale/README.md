# exhale ✦
*an astral AI therapist companion*

## setup

```bash
npm install
```

Edit `.env` and add your keys:
```
OPENAI_API_KEY=sk-...        # for voice transcription (optional)
ANTHROPIC_API_KEY=sk-ant-... # for AI analysis (required for real maps)
PORT=3000
```

```bash
npm start
# → http://localhost:3000
```

For hot-reload during dev:
```bash
npm run dev
```

## what works without keys
- Full UI, starfield, animated mind map
- Voice input via browser SpeechRecognition (free, no key)
- Demo mind maps with basic keyword detection
- Journal + trends (localStorage)

## what needs keys
- `ANTHROPIC_API_KEY` → real context-aware AI analysis, proper mood detection, crisis detection
- `OPENAI_API_KEY` → Whisper transcription (upgrade from browser SpeechRecognition)

## context-aware responses
- **vent** → reflection only, no action steps
- **action** → short validation + concrete gentle steps with now/today/soon tags
- **mixed** → both, reflection first
- **crisis** → pure presence, crisis resource link, no productivity advice

## stack
- Node.js + Express backend (API key proxy, serves static files)
- Vanilla JS frontend (no framework)
- Canvas API for the animated astral mind map
- Web Speech API for free local transcription
- Whisper API for production-quality transcription
- Claude Sonnet for emotional analysis
