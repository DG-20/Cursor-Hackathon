# Clarity — Project Brief
> A 24-hour hackathon project. An AI-powered brain dump tool that helps overwhelmed people work smarter by organizing their thoughts, managing their tasks, and reflecting on their progress.

---

## 1. Concept

When someone is overwhelmed, the hardest part isn't doing the work — it's knowing where to start. Clarity lets users dump everything on their mind (via voice or text), and instantly transforms that chaos into a structured, prioritized action plan. Users can then manage tasks visually (Kanban or Mind Map), mark things done, and close out their session with a guided journal reflection.

---

## 2. Core User Flow

```
Brain Dump (voice or text)
        ↓
STT transcription (if audio via Gemini)
        ↓
LLM processing (system prompt + transcript)
        ↓
Structured output (JSON) → parsed and sent to frontend
        ↓
Results Page: List View | Kanban | Mind Map (3 tabs)
        ↓
User works through tasks (mark complete, drag & drop, edit)
        ↓
"End Session" → AI-generated journal prompt
        ↓
User journals (voice or text) → AI session summary + mood tag
        ↓
Session saved to history → feeds into analytics dashboard
```

---

## 3. Pages & Routing

### Landing Page (`/`)
- Hero prompt: *"What's on your mind today?"*
- Voice input button (records audio → sends to backend for STT)
- Text input fallback (textarea)
- Submit triggers loading state → React Router navigates to `/results`

### Loading Page
- Intermediate route shown while backend processes the dump
- Animated, calming UI (not a spinner — something that reduces anxiety)
- React Router handles transition to `/results` once data is ready

### Results Page (`/results`) — 3 Tabs
1. **List View** — Prioritized WBS (Work Breakdown Structure) action plan
   - Numbered, ordered by urgency/importance
   - Each item: task name, priority badge, category tag, checkbox
   - Editable inline (rename, re-prioritize, delete)
   - "Add task" button at bottom

2. **Kanban Board**
   - Same WBS tasks, displayed in 3 columns: `TO DO` | `IN PROGRESS` | `COMPLETED`
   - Drag and drop between columns (`@dnd-kit`)
   - Cards editable inline
   - Reflects same state as List View (shared state)

3. **Mind Map**
   - Visual node-based layout (`ReactFlow`)
   - Central node = session theme (derived by LLM)
   - Child nodes = task categories
   - Leaf nodes = individual tasks
   - Nodes draggable and editable

### End Session Flow (modal/overlay on Results Page)
- Triggered by "End Session" button
- AI generates a contextual journal prompt based on:
  - Original dump
  - Completed vs. incomplete tasks
  - Example: *"You came in overwhelmed about work deadlines. You completed 3 of 5 tasks. How are you feeling now?"*
- User responds via voice or text
- AI returns a session summary
- User adds a mood tag (emoji scale: 😩 😕 😐 🙂 😊)
- Session saved

### History / Analytics Page (`/history`) *(stretch)*
- Log of all past sessions
- Mood/stress trend chart (Recharts)
- Mental load score over time
- Theme clustering (recurring topics)
- Word cloud from past dumps

---

## 4. Feature List

### Core Input
- [ ] Voice input (Whisper or Gemini STT)
- [ ] Text input fallback
- [ ] Session start prompt: *"What's on your mind today?"*
- [ ] LLM processes dump into structured JSON

### Task Management
- [ ] Prioritized list (AI-ranked by urgency/importance)
- [ ] Kanban board with drag & drop (`@dnd-kit`)
- [ ] Mind map view (`ReactFlow`)
- [ ] Toggle between Kanban ↔ Mind Map
- [ ] Mark tasks complete (checkbox)
- [ ] Edit tasks inline (rename, re-prioritize, delete)
- [ ] Add tasks manually after AI generation

### Journaling
- [ ] "End Session" button triggers journal flow
- [ ] AI-generated contextual journal prompt
- [ ] Voice or text journal response
- [ ] AI session summary
- [ ] Mood tag (emoji scale)

### Analytics & History *(stretch)*
- [ ] Session history log
- [ ] Mood/stress trend chart (Recharts)
- [ ] Mental load score per session
- [ ] Theme clustering across sessions
- [ ] Word cloud from past dumps

### Calendar Integration *(stretch)*
- [ ] Push tasks to Google Calendar with AI-suggested times
- [ ] Pull existing events to inform prioritization
- [ ] Conflict detection

### UX & Polish
- [ ] Minimal, calming UI (anxiety-reducing design)
- [ ] Dark / light mode
- [ ] Mobile-first responsive design
- [ ] Onboarding flow for first-time users
- [ ] Auth (Supabase — email or Google login)
- [ ] Persistent sessions (resume where you left off)

---

## 5. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js + Tailwind CSS |
| Routing | React Router |
| State Management | React Context or Zustand |
| Kanban | `@dnd-kit` |
| Mind Map | `ReactFlow` |
| Charts | `Recharts` |
| Voice / STT | Gemini STT (audio input) |
| LLM | Claude API or Gemini (task processing, journal prompts, summaries) |
| Backend | Node.js + Express (or FastAPI) |
| Database | Supabase (PostgreSQL + Auth) |
| Calendar *(stretch)* | Google Calendar API |

---

## 6. Backend Architecture

### Endpoint: `POST /api/session`
**Input:**
```json
{
  "type": "text" | "audio",
  "content": "raw text OR base64 audio blob"
}
```

**Processing Steps:**
1. If audio → run Gemini STT → get transcript
2. Pass transcript into LLM with system prompt
3. LLM returns structured JSON (see Output Template below)
4. Return JSON to frontend

### LLM System Prompt (template)
```
You are a productivity assistant helping someone who feels overwhelmed.
The user has done a brain dump of everything on their mind.
Your job is to:
1. Extract actionable tasks from the dump
2. Separate tasks from worries or venting (label them accordingly)
3. Prioritize tasks by urgency and importance (1 = highest)
4. Assign each task a category (e.g. Work, Personal, Health, Finance)
5. Identify a central theme for this session (1 short phrase)

Return ONLY valid JSON in this exact format — no preamble, no markdown:
{
  "session_theme": "string",
  "tasks": [
    {
      "id": "string",
      "title": "string",
      "priority": 1,
      "category": "string",
      "type": "task" | "worry" | "noise",
      "status": "todo"
    }
  ]
}
```

### Output JSON Schema
```json
{
  "session_theme": "Work deadlines and personal errands",
  "tasks": [
    {
      "id": "t1",
      "title": "Submit quarterly report",
      "priority": 1,
      "category": "Work",
      "type": "task",
      "status": "todo"
    },
    {
      "id": "t2",
      "title": "Pick up groceries",
      "priority": 3,
      "category": "Personal",
      "type": "task",
      "status": "todo"
    }
  ]
}
```

### Session Data Model (Supabase)
```
sessions
  - id
  - user_id
  - created_at
  - raw_dump (text)
  - session_theme (text)
  - tasks (jsonb[])
  - journal_prompt (text)
  - journal_response (text)
  - session_summary (text)
  - mood_score (int 1–5)
  - mental_load_score (int, AI-derived)
```

---

## 7. 24-Hour Build Plan

### Hours 0–2: Setup
- Init React + Tailwind project
- Set up React Router (Landing → Loading → Results)
- Set up Node/Express backend skeleton
- Connect Supabase (auth + sessions table)

### Hours 2–6: Core Pipeline
- Voice input + Gemini STT
- LLM integration (system prompt + JSON output)
- Parse and store session data
- Pass tasks to frontend

### Hours 6–12: Results Page
- List View tab (prioritized tasks, checkboxes, edit)
- Kanban board with `@dnd-kit`
- Shared state between tabs

### Hours 12–16: Mind Map + Toggle
- ReactFlow mind map
- Kanban ↔ Mind Map toggle
- Sync state across all 3 views

### Hours 16–20: Journaling Flow
- End Session button + modal
- AI journal prompt generation
- Voice/text journal input
- Session summary + mood tag
- Save to Supabase

### Hours 20–23: Polish
- Mobile responsiveness
- Calming UI design pass
- Loading/transition animations
- Dark mode (if time)

### Hour 23–24: Demo Prep
- Seed a demo session
- Test full flow end-to-end
- Fix critical bugs only

---

## 8. Suggested Team Split (3 people)

| Person | Responsibility |
|---|---|
| **Person 1** | Backend: STT → LLM pipeline, API routes, Supabase schema |
| **Person 2** | Frontend: Landing page, Results page, List View, Kanban |
| **Person 3** | Frontend: Mind Map (ReactFlow), Journaling flow, Charts |

---

## 9. MVP Demo Flow (What Judges Will See)

1. Open app → landing page with mic button
2. Speak a brain dump (or type one)
3. Loading screen → Results page appears
4. Show List View → scroll through prioritized tasks
5. Switch to Kanban → drag a task to "In Progress"
6. Switch to Mind Map → show visual layout
7. Click "End Session" → AI journal prompt appears
8. Type a quick response → session summary shown
9. *(Stretch)* Show history page with mood trend chart

---