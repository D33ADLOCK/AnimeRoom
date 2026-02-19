# AnimeRoom — Tech Stack & Queue Decisions

> Deciding what tools to use and **why**, with a clear answer on the queue question.

---

## The Big Question: Do I Need a Queue?

### First — What IS a Queue?

Imagine a restaurant kitchen. When 10 orders come in at once, the chef doesn't cook all 10 simultaneously — they'd burn everything. Instead, orders go on a **ticket rail** (the queue). The chef picks up one ticket at a time, cooks it, and moves to the next.

A **task queue** in software does the same thing:

- Jobs (video generation requests) go into a queue
- Workers pick up jobs one-at-a-time (or a few at a time)
- If the server crashes, the jobs are still in the queue — they don't disappear
- If 50 users submit prompts at once, they line up instead of crashing your server

Popular queues: **BullMQ** (Redis-based), **Upstash QStash** (serverless), **Inngest** (event-driven).

### When You DON'T Need a Queue

You don't need a queue when:

- You're the only user (development/testing)
- You have very few users (< 5-10 concurrent)
- Jobs are fast (< 30 seconds)
- It's okay if a job is lost on server restart (you can just re-run it)

### When You DO Need a Queue

You need a queue when:

- Multiple users are generating videos simultaneously
- Jobs take a long time (yours takes 1-3 minutes)
- You need to limit how many jobs run at once (API rate limits, cost control)
- Jobs should survive server restarts
- You want to retry failed jobs automatically

### The Honest Answer for You

**Start WITHOUT a queue. Add one later when you need it.**

Here's why:

1. **Right now you're building, not scaling.** Adding a queue before your pipeline even works is premature optimization — solving a problem you don't have yet.

2. **A queue adds complexity.** You'd need Redis or an external service, a worker process, job serialization, error handling, dead letter queues... That's a lot of new concepts on top of an already new project.

3. **Your pipeline CAN work without one.** Here's how:

```
Without a queue (Phase 1 — what you'll build):
─────────────────────────────────────────────
User clicks "Generate"
    → API route starts an async function
    → Saves job ID + status "processing" to database
    → Returns job ID to frontend immediately
    → The async function runs in the background:
        → Calls LLM → generates images + audio → renders video
        → Updates database status as it progresses
    → Frontend polls GET /api/status/[jobId] every 3 seconds
    → When status = "complete", frontend shows the video
```

This works perfectly for 1-5 users. The "trick" is that you return the job ID **immediately** and do the work in the background. The user isn't waiting on the API — they're polling for updates.

### When to Add a Queue (Later)

When any of these become true, add a queue:

- You have real users and multiple videos are generating at the same time
- You're hitting Replicate API rate limits
- Your server restarts and users lose their in-progress videos
- You want to limit it to "3 videos rendering at a time, rest wait in line"

At that point, the upgrade path is clear:

```
With a queue (Phase 2 — when you have users):
──────────────────────────────────────────────
User clicks "Generate"
    → API route pushes a job into the queue
    → Returns job ID to frontend immediately
    → A separate worker process picks up the job
    → Worker: calls LLM → images + audio → renders video
    → Worker updates database status as it progresses
    → Frontend polls for updates (same as before)
```

Notice the frontend code **doesn't change at all**. You're only changing how the backend processes jobs. That's good architecture.

---

## The Final Tech Stack

Here's every technology you'll use, organized by layer:

### 🖥️ Frontend (What the User Sees)

| Technology         | What It Does                             | Why This One                                                                  |
| ------------------ | ---------------------------------------- | ----------------------------------------------------------------------------- |
| **Next.js 15**     | React framework, handles pages + routing | You already have it. Full-stack, so you don't need a separate backend server. |
| **React 19**       | UI library for building components       | Comes with Next.js. It's what you know.                                       |
| **Tailwind CSS 4** | Styling                                  | You already have it configured. Fast to build UIs.                            |

### 🔌 API Layer (Frontend ↔ Backend Communication)

| Technology                       | What It Does                             | Why This One                                                                                                                               |
| -------------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **tRPC**                         | Type-safe API calls                      | You already have it. When you change your API, TypeScript immediately tells the frontend what broke. Less bugs.                            |
| **TanStack Query** (React Query) | Handles polling, caching, loading states | You already have it (comes with tRPC). Makes polling for job status trivial.                                                               |
| **Zod**                          | Schema validation                        | You already have it. Validates that the LLM's JSON output matches your expected format. Catches malformed data before it crashes Remotion. |

### 🧠 AI & Generation Layer (The Brains)

| Technology                    | What It Does                           | Why This One                                                                            | Alternative            |
| ----------------------------- | -------------------------------------- | --------------------------------------------------------------------------------------- | ---------------------- |
| **Grok (xAI)**                | LLM — generates the battle script JSON | You already have it working. Fast, supports structured output.                          | GPT-4o, Claude, Gemini |
| **Replicate**                 | Runs image + audio models via API      | No GPU setup needed. Pay-per-use. Huge model library. One SDK for both image and audio. | fal.ai, RunPod         |
| **Flux (on Replicate)**       | Image generation model                 | High-quality anime/character images. Fast.                                              | SDXL, Midjourney API   |
| **Chatterbox (on Replicate)** | Text-to-Speech model                   | Expressive, character-like voices.                                                      | ElevenLabs, OpenAI TTS |

> [!NOTE]
> **Why Replicate for BOTH image and audio?** One API key, one SDK, one billing dashboard. Keeps things simple. You install `replicate` npm package once and use it for everything.

### 🎬 Video Layer (Assembling the Final Product)

| Technology                    | What It Does                              | Why This One                                                                                     |
| ----------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------ |
| **Remotion 4**                | React-based video composition + rendering | You already have a full template built. Your scenes, components, animations — all done in React. |
| **Remotion CLI**              | Renders video to MP4 locally              | Use this for development and small scale.                                                        |
| **Remotion Lambda** _(later)_ | Renders video on AWS Lambda (cloud)       | 10-20x faster rendering. Add this when you need speed/scale. Not needed for v1.                  |

### 💾 Data Layer (Storage & State)

| Technology                       | What It Does                                                | Why This One                                                                         |
| -------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| **PostgreSQL**                   | Database — stores job status, user data, generation history | You already have it. Relational, reliable, well-documented.                          |
| **Drizzle ORM**                  | TypeScript-first database client                            | You already have it. Type-safe queries.                                              |
| **Local filesystem** (`tmp/`)    | Temporary storage for generated images, audio, video        | Simplest option for v1. Files live in `tmp/jobs/[jobId]/`.                           |
| **S3 / Cloudflare R2** _(later)_ | Cloud storage for generated videos                          | Add this when you deploy to production. Local filesystem doesn't work on serverless. |

### 🚀 Deployment & Infrastructure _(for later)_

| Technology                  | What It Does                       | Why This One                                                      |
| --------------------------- | ---------------------------------- | ----------------------------------------------------------------- |
| **Vercel**                  | Hosts your Next.js app             | You've used it before. Easiest Next.js deployment.                |
| **Upstash Redis** _(later)_ | Queue + caching (serverless Redis) | If/when you add a queue. Works on Vercel (serverless-compatible). |
| **BullMQ** _(later)_        | Job queue built on Redis           | The most popular Node.js queue. Only needed when scaling.         |

---

## What You Need to Install (New Dependencies)

You already have most of these. Here's what's **new**:

```
pnpm add replicate          ← Replicate SDK (image + audio generation)
```

That's it. Seriously. Everything else you already have.

Later you might add:

```
pnpm add @upstash/redis      ← Only when adding queue
pnpm add bullmq              ← Only when adding queue
pnpm add @remotion/lambda     ← Only when adding cloud rendering
pnpm add @aws-sdk/client-s3   ← Only when adding cloud storage
```

---

## Why NOT These Alternatives?

Some stacks you might have heard about and why they're not the right fit **right now**:

| Tech                                 | Why Not (for now)                                                                                                           |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| **ffmpeg directly**                  | You already have Remotion with beautiful React scenes. ffmpeg is low-level — you'd be scripting frame stitching by hand.    |
| **Separate Express/Fastify backend** | Next.js API routes + tRPC already give you a backend. Adding another server adds deployment complexity.                     |
| **Redis / BullMQ right now**         | Adds a Redis dependency you need to host and manage. Overkill until you have concurrent users.                              |
| **ElevenLabs**                       | Great TTS, but expensive and a separate API from your image model. Chatterbox on Replicate keeps everything under one roof. |
| **Docker / Kubernetes**              | Way too much infrastructure for a first project. Deploy on Vercel, iterate fast.                                            |
| **Kafka / RabbitMQ**                 | Enterprise-grade queues for millions of messages per second. You're generating videos, not processing bank transactions.    |

---

## How the Pieces Connect (Visual)

```
┌──────────────────────────────────────────────────────────┐
│ FRONTEND (Next.js + React + Tailwind)                    │
│                                                          │
│  ┌─────────────┐    ┌──────────────────┐                 │
│  │ Prompt Page  │───→│ Status Page       │                │
│  │ (user types) │    │ (polls for updates│                │
│  └──────┬──────┘    │  shows video)     │                │
│         │           └────────▲─────────┘                 │
│         │ tRPC call          │ tRPC poll                  │
└─────────┼────────────────────┼───────────────────────────┘
          │                    │
          ▼                    │
┌─────────┴────────────────────┴───────────────────────────┐
│ BACKEND (tRPC + Next.js API Routes)                      │
│                                                          │
│  ┌─────────────────────────────────────────────────┐     │
│  │ generate.ts router (the ORCHESTRATOR)           │     │
│  │                                                 │     │
│  │  1. Save job to DB (status: "started")          │     │
│  │  2. Call Grok SDK → get battle JSON             │     │
│  │  3. Update DB (status: "generating_assets")     │     │
│  │  4. Call Replicate SDK (images + audio parallel) │     │
│  │  5. Update DB (status: "rendering")             │     │
│  │  6. Call Remotion render                         │     │
│  │  7. Update DB (status: "complete", videoUrl)    │     │
│  └──────┬──────────────┬───────────────────────────┘     │
│         │              │                                  │
│         ▼              ▼                                  │
│  ┌────────────┐ ┌─────────────┐  ┌────────────────┐     │
│  │ grok.ts    │ │replicate.ts │  │ Drizzle + PG   │     │
│  │ (LLM SDK)  │ │(img + audio)│  │ (job status DB) │    │
│  └─────┬──────┘ └──────┬──────┘  └────────────────┘     │
└────────┼───────────────┼────────────────────────────────┘
         │               │
         ▼               ▼
┌────────────────────────────────────────────────────────┐
│ EXTERNAL SERVICES                                      │
│                                                        │
│  ┌──────────┐  ┌───────────────┐  ┌──────────────┐    │
│  │ xAI API  │  │ Replicate API │  │ Remotion CLI │    │
│  │ (Grok)   │  │ (Flux +       │  │ (renders     │    │
│  │          │  │  Chatterbox)  │  │  MP4 video)  │    │
│  └──────────┘  └───────────────┘  └──────────────┘    │
└────────────────────────────────────────────────────────┘
```

---

## Summary: Your Stack at a Glance

```
Frontend:   Next.js + React + Tailwind + tRPC client
Backend:    tRPC + Next.js API routes
AI:         Grok (xAI) + Replicate (Flux + Chatterbox)
Video:      Remotion
Database:   PostgreSQL + Drizzle
Queue:      None (for now) — add Upstash/BullMQ later
Storage:    Local filesystem (for now) — add S3/R2 later
Deploy:     Vercel (for now)
New deps:   Just `replicate` — that's the only new package
```

> [!IMPORTANT]
> **The golden rule of your first project:** Get it working first, make it scalable second. Every "later" item in this doc is something you can add without rewriting what you already built.

---

_Last updated: February 14, 2026_
