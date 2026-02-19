# AnimeRoom — Full Workflow Guide

> Your complete roadmap from "user types a prompt" to "user watches a progressively streaming roast-battle video."

---

## Table of Contents

1. [The Big Picture](#1-the-big-picture)
2. [Why Multiple Services? (And Not One File)](#2-why-multiple-services-and-not-one-file)
3. [The Three Layers of Your System](#3-the-three-layers-of-your-system)
4. [Complete Data Flow — Step by Step](#4-complete-data-flow--step-by-step)
5. [Deep Dive: Each Step Explained](#5-deep-dive-each-step-explained)
6. [Parallelism — What Can Run at the Same Time](#6-parallelism--what-can-run-at-the-same-time)
7. [Progressive Streaming — How the User Sees Video Growing](#7-progressive-streaming--how-the-user-sees-video-growing)
8. [Project Structure — Where Everything Lives](#8-project-structure--where-everything-lives)
9. [Tech Stack Cheat Sheet](#9-tech-stack-cheat-sheet)
10. [Glossary](#10-glossary)

---

## 1. The Big Picture

Think of AnimeRoom like a **factory assembly line**:

```
User's Prompt
    ↓
  [BRAIN]  →  LLM decides what the video should contain
    ↓
  [WORKERS]  →  Multiple AI models generate the raw materials (images + audio) in parallel
    ↓
  [ASSEMBLER]  →  Remotion stitches everything into a video
    ↓
  [DELIVERY]  →  Video chunks stream to the user as they're ready
```

Each stage has a clear input and a clear output. That's the whole system. Everything else is just details about **how** each stage works.

---

## 2. Why Multiple Services? (And Not One File)

This is the most important thing to understand first.

### The Problem with One File

Imagine you put everything — the website, the AI calls, the video rendering — all in one file. Here's what would happen:

- The AI call takes **10-30 seconds**. Your website freezes while waiting.
- Image generation takes **20-60 seconds**. The user stares at a blank page.
- Audio generation takes **15-30 seconds**. Still nothing on screen.
- Video rendering takes **60-120 seconds**. The user has left by now.

**Total wait time: 2-4 minutes of nothing.** That's a terrible experience.

### The Solution: Separate Concerns

By splitting into layers, you get two massive benefits:

1. **Parallelism** — While the LLM is generating dialogue for Round 3, the image model is already generating images for Round 1, AND the audio model is already converting Round 1's dialogue to speech. Everything runs at the same time.

2. **Progressive delivery** — As soon as Round 1's image + audio are ready, Remotion can render that chunk and send it to the user. The user sees 5 seconds of video while the rest is still being made.

### How to Think About It

You don't need separate **projects** (repositories). You need separate **concerns** (files/folders with clear responsibilities) inside **one project**. Your Next.js app is the perfect home for everything:

| Concern            | Where it lives                           | Why                                        |
| ------------------ | ---------------------------------------- | ------------------------------------------ |
| Website (UI)       | `src/app/`                               | Next.js handles the frontend               |
| API routes (brain) | `src/app/api/` or `src/server/` via tRPC | Next.js API routes handle backend logic    |
| AI SDK calls       | `src/lib/sdk/`                           | Reusable functions, called from API routes |
| Video rendering    | `src/remotion/`                          | Remotion composes the video                |

**One project, multiple folders, clear boundaries.**

---

## 3. The Three Layers of Your System

```
┌─────────────────────────────────────────────────┐
│                  LAYER 1: FRONTEND               │
│                                                   │
│  What the user sees and interacts with.           │
│  • Prompt input box                               │
│  • "Generate" button                              │
│  • Video player that shows progressive chunks     │
│  • Loading states / progress indicators           │
│                                                   │
│  Tech: Next.js (React) + your existing UI         │
└──────────────────────┬──────────────────────────┘
                       │ HTTP request (prompt)
                       ▼
┌─────────────────────────────────────────────────┐
│                  LAYER 2: BACKEND                │
│                                                   │
│  The "brain" that orchestrates everything.        │
│  • Receives the user's prompt                     │
│  • Calls the LLM to generate the battle JSON      │
│  • Dispatches image + audio generation jobs       │
│  • Tracks progress of each job                    │
│  • Triggers Remotion rendering                    │
│  • Streams video chunks back to frontend          │
│                                                   │
│  Tech: Next.js API Routes / tRPC                  │
└──────────────────────┬──────────────────────────┘
                       │ API calls
                       ▼
┌─────────────────────────────────────────────────┐
│              LAYER 3: EXTERNAL SERVICES          │
│                                                   │
│  The "workers" — 3rd party AI models.             │
│  • LLM (Grok via xAI) → structured JSON          │
│  • Image model (via Replicate) → character imgs   │
│  • Audio model (Chatterbox via Replicate) → voice │
│  • Remotion renderer → final video                │
│                                                   │
│  Tech: Replicate API, xAI API, Remotion CLI/Lambda│
└─────────────────────────────────────────────────┘
```

### Why Three Layers?

- **Frontend** knows nothing about AI models. It just sends a prompt and receives video. If you swap Grok for GPT tomorrow, the frontend doesn't change.
- **Backend** knows nothing about how video looks. It just passes data to Remotion. If you redesign the video template, the backend doesn't change.
- **External Services** are replaceable. Swap Replicate for another image provider, the backend just changes one function.

This separation is called **"Separation of Concerns"** — each layer only worries about its own job.

---

## 4. Complete Data Flow — Step by Step

Here's every single step, from prompt to video:

```
USER types: "Goku vs Naruto roast battle"
  │
  ▼
┌──────────────────────────────────────────────┐
│ STEP 1: Frontend sends prompt to backend     │
│                                              │
│ POST /api/generate                           │
│ Body: { prompt: "Goku vs Naruto roast..." }  │
└──────────────────┬───────────────────────────┘
                   ▼
┌──────────────────────────────────────────────┐
│ STEP 2: LLM generates the battle script     │
│                                              │
│ Input:  User prompt                          │
│ Output: Structured JSON matching your        │
│         RoastBattleSchema                    │
│                                              │
│ This JSON contains:                          │
│  • character1: { name, title, stats, skills }│
│  • character2: { name, title, stats, skills }│
│  • rounds: [{ attacker, dialogue, damage }]  │
│  • imagePrompts: descriptions for each char  │
│                                              │
│ WHY: The LLM is the "writer". It decides     │
│ what happens in the video. Without this,     │
│ you'd have to manually write every battle.   │
└──────────────────┬───────────────────────────┘
                   ▼
┌──────────────────────────────────────────────┐
│ STEP 3: Extract what we need from the JSON   │
│                                              │
│ From the LLM response, we pull out:          │
│                                              │
│  A) Image prompts (descriptions of each      │
│     character's appearance)                  │
│                                              │
│  B) Dialogue texts (what each character says │
│     in each round — these become audio)      │
│                                              │
│ WHY: We need to transform the LLM's "script" │
│ into tasks for the image and audio models.   │
└─────────┬────────────────────┬───────────────┘
          │                    │
          ▼                    ▼
  ┌───────────────┐   ┌────────────────┐
  │ STEP 4A:      │   │ STEP 4B:       │
  │ Generate      │   │ Generate       │
  │ Images        │   │ Audio          │
  │               │   │                │
  │ • char1 front │   │ • Round 1 voice│
  │ • char1 side  │   │ • Round 2 voice│
  │ • char1 prof  │   │ • Round 3 voice│
  │ • char2 front │   │ • Round 4 voice│
  │ • char2 side  │   │ • Round 5 voice│
  │ • char2 prof  │   │ • Round 6 voice│
  │               │   │                │
  │ Via Replicate │   │ Via Chatterbox │
  │ (image model) │   │ on Replicate   │
  └───────┬───────┘   └───────┬────────┘
          │                    │
          │  THESE RUN IN      │
          │  PARALLEL (same    │
          │  time) ←───────────┘
          │                    │
          ▼                    ▼
┌──────────────────────────────────────────────┐
│ STEP 5: Collect all assets                   │
│                                              │
│ At this point we have:                       │
│  ✓ Battle script (JSON from LLM)             │
│  ✓ Character images (URLs from Replicate)    │
│  ✓ Voice audio files (URLs from Replicate)   │
│                                              │
│ WHY: Remotion needs ALL the raw materials    │
│ before it can compose the video. Think of    │
│ it like having all your ingredients before   │
│ you start cooking.                           │
└──────────────────┬───────────────────────────┘
                   ▼
┌──────────────────────────────────────────────┐
│ STEP 6: Feed everything into Remotion        │
│                                              │
│ Remotion receives the JSON as "input props": │
│  {                                           │
│    character1: { images, name, stats, ... }, │
│    character2: { images, name, stats, ... }, │
│    rounds: [{ audio, dialogue, damage }],    │
│  }                                           │
│                                              │
│ Your existing Composition.tsx already knows  │
│ how to render scenes from this data.         │
│                                              │
│ WHY: Remotion is your "video editor". It     │
│ takes the raw images + audio + data and      │
│ turns them into an MP4 video, frame by frame.│
└──────────────────┬───────────────────────────┘
                   ▼
┌──────────────────────────────────────────────┐
│ STEP 7: Stream the video to the user         │
│                                              │
│ Remotion renders the video. As chunks are    │
│ ready, they stream to the frontend.          │
│                                              │
│ The user sees:                               │
│  • 0s → "Generating script..."              │
│  • 5s → "Generating images & audio..."      │
│  • 15s → First 5 seconds of video appear    │
│  • 25s → 15 seconds of video now visible    │
│  • ...and so on until complete               │
│                                              │
│ WHY: Nobody wants to wait 2+ minutes to see  │
│ anything. Progressive streaming keeps the    │
│ user engaged and gives them something to     │
│ watch while the rest renders.                │
└──────────────────────────────────────────────┘
```

---

## 5. Deep Dive: Each Step Explained

### Step 1 — Frontend → Backend (Sending the Prompt)

**What happens:** The user types "Goku vs Naruto" and clicks Generate. The frontend sends this to your backend.

**Why it matters:** This is the entry point. The prompt is the ONLY thing the user provides. Everything else is generated by AI.

**How it connects:** You already have tRPC set up in `src/trpc/`. You'll create a new tRPC procedure (think of it as a function the frontend can call) called something like `generate.create`. This procedure receives the prompt and kicks off the whole pipeline.

**Why tRPC and not a plain API route?** You already have tRPC set up. tRPC gives you type-safety between frontend and backend — meaning if the backend expects a string prompt, TypeScript will enforce that on the frontend too. Fewer bugs.

---

### Step 2 — LLM Generates the Battle Script

**What happens:** Your backend takes the user's prompt and sends it to Grok (xAI) with instructions like: "Generate a roast battle between these two characters. Return structured JSON."

**Why it matters:** The LLM is the **creative brain**. It writes:

- Character names and titles
- Stats and skills (the fun stuff like "Ego Shield" and "Ratio Beam")
- The actual roast dialogue for each round
- Damage values for each round
- Image prompts describing how each character looks

**What you already have:** Your `src/lib/sdk/grok.ts` already does this! It calls Grok and uses `RoastBattleSchema` to get structured JSON back.

**What needs to change:** Right now the prompt is hardcoded to "Gogeta vs Vegito". You'll make it dynamic — the user's prompt gets injected. You'll also add an `imagePrompt` field to the schema so the LLM describes each character's appearance for the image model.

**Why structured output (not free text)?** Because every downstream step needs specific pieces of data in specific formats. If the LLM returns free text like "Goku has 85 strength", you'd have to parse that yourself. With structured output (Zod schema), the LLM returns `{ stats: [{ label: "Strength", value: 85 }] }` — already in the exact format Remotion needs.

---

### Step 3 — Extract Image Prompts and Dialogue

**What happens:** You take the JSON from Step 2 and split it into two task lists:

- **Image tasks:** "Generate an anime-style image of [character description]"
- **Audio tasks:** "Convert this dialogue text to speech using [character voice]"

**Why it matters:** This is the **coordination step**. You're turning one big response into many small, independent tasks that can run in parallel.

**Why not just have the LLM generate images directly?** Because LLMs generate text, not images. You need a specialized image model for that. Similarly, you need a specialized TTS (text-to-speech) model for voice audio. Each model is good at one thing.

---

### Step 4A — Image Generation (via Replicate)

**What happens:** For each character, you need multiple image variants:

1. **Front-facing** — used in battle scenes (the character speaking)
2. **Side-facing** — used in the stats introduction scene
3. **Profile** — used as the small avatar in the health bar HUD

That's 3 images × 2 characters = **6 image generation calls**.

**Why Replicate?** Replicate lets you run AI models via a simple API call. You don't need to set up GPUs or manage infrastructure. You pick an image model (like Flux, SDXL, or any anime model), send it a text prompt, and get an image URL back.

**Why multiple images per character?** Look at your current `Composition.tsx` — you already use `gogetaSingle`, `gogetaSide`, `gogetaProfile`. Each is used in a different scene. Right now they're static files in `/public`. You'll replace them with dynamically generated images.

**How it connects:** Each image comes back as a URL. You download it and either:

- Save it to a temp folder so Remotion can access it as a static file
- Or pass it directly as a prop URL to Remotion components

---

### Step 4B — Audio Generation (Chatterbox via Replicate)

**What happens:** For each round's dialogue, you send the text to Chatterbox (a text-to-speech model) and get back an audio file.

With 6 rounds, that's **6 audio generation calls**.

**Why Chatterbox?** It's a high-quality TTS model that can produce expressive, character-like voices. You're running it through Replicate, same as the image model.

**Why separate audio per round?** Each round is a separate dialogue by a different character. In your current composition, they're files like `vegitoD1.mp3`, `gogetaD1.mp3`. You'll replace these with AI-generated audio.

**How it connects:** Each audio comes back as a URL. Similar to images, you download them for Remotion to use.

---

### Step 4 — Why Parallel? (Important Concept)

Steps 4A and 4B run **at the same time**. Here's why:

```
Sequential (bad):                     Parallel (good):
─────────────────                     ─────────────────
Image 1: ████                         Image 1: ████
Image 2:     ████                     Image 2: ████
Image 3:         ████                 Image 3: ████
Image 4:             ████             Image 4: ████
Image 5:                 ████         Image 5: ████
Image 6:                     ████     Image 6: ████
Audio 1:                         ██   Audio 1: ██
Audio 2:                           ██ Audio 2: ██
Audio 3:                             ██ Audio 3: ██
Audio 4:                               ██ Audio 4: ██
Audio 5:                                 ██ Audio 5: ██
Audio 6:                                   ██ Audio 6: ██
                                      ──────────
Total: ~~~36 units                    Total: ~6 units
```

In code, this means using `Promise.all()` — JavaScript's way of saying "start all these tasks and wait for all of them to finish."

Images and audio don't depend on each other. Round 1's audio doesn't need Round 1's image. So there's no reason to wait.

---

### Step 5 — Collect All Assets

**What happens:** You wait for all image + audio promises to resolve. Now you have:

- 6 image URLs (or local file paths)
- 6 audio URLs (or local file paths)
- The battle JSON from the LLM

**Why this step exists:** This is just a checkpoint. Before moving to rendering, you make sure everything is ready. If any image or audio generation failed, this is where you handle the error — maybe retry the failed ones, or show the user an error message.

---

### Step 6 — Remotion Rendering

**What happens:** You pass all the data (JSON + image paths + audio paths) as **input props** to your Remotion composition. Remotion then renders the video frame-by-frame.

**What you already have:** Your `Composition.tsx` already renders Introduction → CharacterStats → BattleRounds. Right now the data is hardcoded. You'll change it to accept dynamic props.

**How rendering works (two options):**

| Option                                | How it works                          | Best for                 |
| ------------------------------------- | ------------------------------------- | ------------------------ |
| **Local rendering** (Remotion CLI)    | Runs `remotion render` on your server | Development, small scale |
| **Cloud rendering** (Remotion Lambda) | Renders on AWS Lambda, much faster    | Production, many users   |

For your first version, **local rendering is fine**. You can upgrade to Lambda later.

**Why Remotion and not ffmpeg directly?** Because you already have a beautiful React-based template. Writing battle scenes with health bars, animations, and timed sequences in raw ffmpeg would be a nightmare. Remotion lets you use React (which you already know) to compose video.

---

### Step 7 — Progressive Streaming

**What happens:** As Remotion renders each chunk/segment of the video, the backend streams it to the frontend. The user's video player progressively plays what's available.

**Why it matters:** This is the "magic" of sites like maxroom.co. The user doesn't wait for the full video. They see progress:

```
[====>                    ]  20% — Playing intro scene
[============>            ]  50% — Round 2 roast playing
[========================>] 100% — Full video ready
```

**How to implement this (simplified):**

1. **Option A: Polling (simplest for v1)**
   - Backend renders full video, saves to a file.
   - Frontend polls `/api/status?jobId=123` every few seconds.
   - When status = "complete", frontend loads the video.
   - Not truly streaming, but simple and works.

2. **Option B: Server-Sent Events (SSE)**
   - Backend sends progress updates to the frontend in real-time.
   - "Step 1 complete: Script generated" → "Step 2: 3/6 images done" → "Rendering: 40%"
   - Video plays when rendering reaches a threshold.

3. **Option C: True chunk streaming (advanced)**
   - Remotion renders video in segments (intro, stats, round 1, round 2...).
   - Each segment is sent to the frontend as it's ready.
   - Frontend concatenates segments using Media Source Extensions (MSE).

**Recommendation for your first version:** Start with **Option A** (polling). It's dead simple. You can upgrade to Option B or C later.

---

## 6. Parallelism — What Can Run at the Same Time

Here's a dependency map. An arrow means "B depends on A finishing first":

```
User Prompt
    │
    ▼
LLM Call (Step 2)
    │
    ├──────────────────────────┐
    ▼                          ▼
Image Generation (4A)    Audio Generation (4B)
    │                          │
    └──────────┬───────────────┘
               ▼
    All Assets Collected (5)
               │
               ▼
    Remotion Rendering (6)
               │
               ▼
    Stream to User (7)
```

**Rules:**

- Steps 4A and 4B **CAN** run in parallel (no dependency between them).
- Steps 4A and 4B **CANNOT** start before Step 2 finishes (they need the LLM's JSON).
- Step 6 **CANNOT** start before Step 5 (it needs all assets).
- Within Step 4A, all 6 image requests **CAN** run in parallel.
- Within Step 4B, all 6 audio requests **CAN** run in parallel.

**Even more aggressive parallelism (advanced, for later):**

You could start rendering scenes as soon as their specific assets are ready:

- Intro scene needs only the background → render immediately after LLM call.
- Stats scenes need side images → render as soon as those 2 images are done.
- Battle Round 1 needs front image + audio 1 → render as soon as both are done.

This is harder to implement but gives the best user experience.

---

## 7. Progressive Streaming — How the User Sees Video Growing

This is the experience you described: "5 seconds is completed, then the user will see 5 seconds, then 10 seconds..."

### How This Works Conceptually

Your video has a natural structure:

```
Video Timeline:
[Intro ~6s] [Stats1 ~3s] [Stats2 ~3s] [R1 ~10s] [R2 ~10s] [R3 ~10s] [R4 ~10s] [R5 ~10s] [R6 ~10s]
```

Instead of rendering the whole 72-second (or similar) video at once, you could render scene-by-scene:

1. Render Intro (needs: background, announcer image, announcer audio)
2. → **Send to user** — user starts watching Intro
3. Render Stats1 (needs: character1 side image, stats data)
4. → **Append to user's video** — user now has Intro + Stats1
5. Render Round1 (needs: character2 front image, audio 1)
6. → **Append** — user now has Intro + Stats1 + Stats2 + Round1
7. ...and so on

### The Key Technical Challenge

The tricky part is making the video player "grow." There are a few ways:

1. **Re-render and replace:** Each time a new scene is ready, render a longer video and replace the old one. Simple but wasteful. The user's player jumps back.

2. **Separate video segments:** Render each scene as a separate .mp4 clip. Use a playlist (like HLS) to play them in order. When a new segment is ready, add it to the playlist.

3. **Progress updates only:** Render the full video on the backend. Send progress percentage to the frontend. The user sees a progress bar. When done, they can hit play. This is what most sites actually do.

**Honest recommendation:** Option 3 is what most "video generation" sites (including maxroom.co) actually do under the hood. The "streaming" is just a progress indicator, not actual video streaming during render. Start here.

---

## 8. Project Structure — Where Everything Lives

Here's how your project should be organized. Items marked 🆕 are new things you'll add:

```
AnimeRoom/
├── src/
│   ├── app/                          ← Next.js frontend
│   │   ├── page.tsx                  ← Homepage with prompt input 🆕
│   │   ├── generate/
│   │   │   └── [jobId]/
│   │   │       └── page.tsx          ← Video generation status page 🆕
│   │   └── api/                      ← (tRPC handles this, but for reference)
│   │
│   ├── server/                       ← Backend logic
│   │   ├── api/
│   │   │   ├── routers/
│   │   │   │   └── generate.ts       ← tRPC router for the generate endpoint 🆕
│   │   │   └── root.ts
│   │   └── db/                       ← Database (store job status, results)
│   │
│   ├── lib/
│   │   └── sdk/
│   │       ├── grok.ts               ← LLM calls (already exists, needs updating)
│   │       ├── replicate.ts          ← Image & audio generation via Replicate 🆕
│   │       └── outputSchema.ts       ← Zod schema (already exists, needs updating)
│   │
│   ├── remotion/
│   │   ├── Root.tsx                  ← Remotion entry point (exists)
│   │   ├── Composition.tsx           ← Main composition (exists, needs dynamic props)
│   │   ├── scenes/                   ← Scene components (exist)
│   │   ├── components/               ← UI components (exist)
│   │   └── lib/                      ← Utilities (exist)
│   │
│   └── trpc/                         ← tRPC client setup (exists)
│
├── public/                           ← Static assets (existing images/audio)
├── tmp/                              ← Temporary generated assets 🆕
│   └── jobs/
│       └── [jobId]/
│           ├── images/               ← Downloaded generated images
│           ├── audio/                ← Downloaded generated audio
│           └── output.mp4            ← Rendered video
│
└── out/                              ← Final rendered videos
```

### Why This Structure?

- **`src/lib/sdk/`** — All external API calls live here. If Replicate changes their API, you only update one file.
- **`src/server/api/routers/generate.ts`** — The orchestrator. It calls the SDK functions in the right order.
- **`tmp/jobs/[jobId]/`** — Each generation job gets its own folder. This way multiple users can generate at the same time without files overwriting each other.

---

## 9. Tech Stack Cheat Sheet

| Tool                   | Role                        | Why This One?                                                   |
| ---------------------- | --------------------------- | --------------------------------------------------------------- |
| **Next.js**            | Frontend + API server       | You already have it. Full-stack in one framework.               |
| **tRPC**               | Type-safe API layer         | You already have it. Frontend↔Backend types stay in sync.       |
| **Remotion**           | Video composition           | You already have it. React-based video = familiar.              |
| **Grok (xAI)**         | LLM for script generation   | You already have it set up. Fast, structured output support.    |
| **Replicate**          | Image + audio model hosting | Simple API. No GPU management. Pay per use.                     |
| **Chatterbox**         | Text-to-speech              | Expressive voices. Available on Replicate.                      |
| **Drizzle + Postgres** | Database                    | You already have it. Store job status, user data.               |
| **Zod**                | Schema validation           | You already use it. Ensures LLM output matches expected format. |

---

## 10. Glossary

| Term                  | What It Means                                                                                         |
| --------------------- | ----------------------------------------------------------------------------------------------------- |
| **Prompt**            | The text the user types (e.g., "Goku vs Naruto roast battle")                                         |
| **Structured output** | When the LLM returns data in a specific JSON format (defined by your Zod schema) instead of free text |
| **Input props**       | Data you pass into a Remotion composition that controls what the video shows                          |
| **Replicate**         | A platform that lets you run AI models (image, audio, etc.) via API calls without managing servers    |
| **Chatterbox**        | A text-to-speech AI model that converts text into realistic spoken audio                              |
| **HLS**               | HTTP Live Streaming — a protocol for streaming video in chunks. Used by YouTube, Netflix, etc.        |
| **SSE**               | Server-Sent Events — a way for the server to push updates to the browser in real-time                 |
| **tRPC**              | A TypeScript framework for building type-safe APIs. "Type-safe Remote Procedure Call"                 |
| **Orchestrator**      | The piece of code that coordinates all the steps (calls LLM, then images, then audio, then render)    |
| **Job**               | One complete generation request. Each user prompt creates one job with a unique ID                    |
| **`Promise.all()`**   | JavaScript method that runs multiple async operations in parallel and waits for all to finish         |

---

## What to Build First (Recommended Order)

> [!TIP]
> Build in this order. Each step is independently testable — you can verify it works before moving on.

### Phase 1: Make your existing video dynamic

- [ ] Update `outputSchema.ts` to include `imagePrompt` and any new fields
- [ ] Update `grok.ts` to accept a dynamic prompt from the user
- [ ] Update `Composition.tsx` to accept all data as input props (instead of hardcoded values)
- [ ] Test: Run `grok.ts` with a new prompt → paste the JSON into Remotion → video renders correctly

### Phase 2: Add Replicate integration

- [ ] Create `replicate.ts` in `src/lib/sdk/`
- [ ] Add a function to generate images from text prompts
- [ ] Add a function to generate audio from text (Chatterbox)
- [ ] Test: Call each function independently → images and audio files are saved correctly

### Phase 3: Build the orchestrator

- [ ] Create the `generate.ts` tRPC router
- [ ] Wire up: prompt → LLM → images + audio (parallel) → collect assets
- [ ] Test: Call the tRPC endpoint → all assets are generated and saved in `tmp/jobs/[jobId]/`

### Phase 4: Render the video

- [ ] Pass collected assets to Remotion as input props
- [ ] Trigger `remotion render` programmatically from the backend
- [ ] Test: Full pipeline works — prompt in, video out

### Phase 5: Build the frontend

- [ ] Create the prompt input page
- [ ] Create the status/progress page
- [ ] Add polling for job status
- [ ] Show the video when rendering is complete

### Phase 6: Add progressive streaming (optional, advanced)

- [ ] Add SSE or WebSocket for real-time progress
- [ ] Implement scene-by-scene rendering
- [ ] Stream video chunks to the frontend

---

> [!IMPORTANT]
> **Start with Phase 1.** Don't jump to Phase 5 or 6. Each phase builds on the previous one. If Phase 1 doesn't work, nothing else will.

---

_Last updated: February 14, 2026_
