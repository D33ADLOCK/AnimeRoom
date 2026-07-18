<div align="center">
  <img src="public/website/logo-trimmed.png" alt="AnimeRoom" width="120" />

  <h1>AnimeRoom</h1>

  <p><strong>Type "Goku vs Frieza" — get a full anime roast-battle video.</strong></p>

  <p>
    AnimeRoom turns a single prompt into a cinematic 9:16 anime roast battle:
    AI writes the script, generates every character image, voices every line,
    and streams the video to you live as it renders — round by round.
  </p>

  <p>
    <img alt="Next.js" src="https://img.shields.io/badge/Next.js-15-black?logo=next.js" />
    <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white" />
    <img alt="tRPC" src="https://img.shields.io/badge/tRPC-11-2596BE?logo=trpc&logoColor=white" />
    <img alt="Remotion" src="https://img.shields.io/badge/Remotion-4-000000" />
    <img alt="License: MIT" src="https://img.shields.io/badge/License-MIT-green.svg" />
  </p>
</div>

---

## What it does

You type a matchup like `Naruto vs Sasuke`. AnimeRoom then:

1. **Writes the battle** — an LLM scripts the characters, their stats, and a multi-round roast exchange.
2. **Generates the visuals** — each character pose and expression is image-generated per round.
3. **Voices every line** — dialogue and announcer audio are synthesized to speech.
4. **Assembles a video** — intros, stat screens, battle rounds, and audio are composited into a vertical 9:16 video.
5. **Streams it live** — you watch rounds appear in real time instead of staring at a spinner.

Then a full editor lets you regenerate any image, rewrite any line, or re-record any clip before exporting.

## Features

- **AI roast battles** — full scripts written from a single prompt
- **Live generation** — rounds stream in over a realtime channel as they're produced
- **Cinematic output** — 9:16 video with character intros, stat cards, rounds, and dynamic audio
- **Per-round image generation** — unique poses/expressions for every beat
- **Full editor** — regenerate images, rewrite dialogue, re-record audio, total control
- **Credits & billing** — Stripe-backed credit packs with webhook-driven fulfillment

## How it works

```
User prompt
    │
    ▼
┌─────────────┐   Gemini 2.5 Flash writes script, characters, rounds
│   SCRIPT    │
└─────────────┘
    │
    ▼
┌─────────────┐   Inngest orchestrates the pipeline as durable steps:
│  PIPELINE   │   character bundle → round bundles → meta bundle → finalise
└─────────────┘
    │           ├─ Images    → Replicate (fast inference)
    │           ├─ Voice     → ElevenLabs Flash v2.5 (via Replicate)
    │           └─ Assets    → Cloudflare R2 (S3-compatible)
    ▼
┌─────────────┐   State is emitted over Upstash Realtime after each step,
│  REALTIME   │   so the client renders the video as it grows.
└─────────────┘
    │
    ▼
┌─────────────┐   Remotion Player previews live; Remotion Lambda renders
│    VIDEO    │   the final MP4 export.
└─────────────┘
```

The heavy work runs as **event-driven Inngest functions** (`src/inngest/`) so a job survives
restarts and long-running renders, while the **progressive streaming** layer
(`src/lib/realtime/`) pushes each completed step to the browser.

## Tech stack

| Area            | Choice                                                        |
| --------------- | ------------------------------------------------------------- |
| Framework       | Next.js 15 (App Router), React 19, TypeScript                 |
| API             | tRPC 11 + TanStack Query                                      |
| Database        | PostgreSQL + Drizzle ORM                                      |
| Auth            | Clerk                                                          |
| Orchestration   | Inngest (durable, event-driven pipeline)                      |
| Realtime        | Upstash Realtime + Redis                                      |
| Script AI       | Google Gemini 2.5 Flash (Vercel AI SDK)                       |
| Image / Voice   | Replicate (image models + ElevenLabs Flash v2.5)             |
| Video           | Remotion + Remotion Lambda                                    |
| Storage         | Cloudflare R2                                                 |
| Payments        | Stripe (credits)                                              |
| Styling         | Tailwind CSS v4 + Radix / shadcn UI                           |
| Deployment      | Vercel                                                        |

## Getting started

### Prerequisites

- Node.js 20+
- [pnpm](https://pnpm.io/) 10+
- A PostgreSQL database (a local Docker helper is included: `./start-database.sh`)
- Accounts / API keys for the services above (see `.env.example`)

### Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Configure environment
cp .env.example .env
#    then fill in your keys — every value in .env.example is required
#    (Stripe/Inngest have local-friendly defaults noted inline)

# 3. Start a local Postgres (optional helper)
./start-database.sh

# 4. Apply the database schema
pnpm db:push

# 5. Run the app
pnpm dev
```

The app runs at [http://localhost:3000](http://localhost:3000).

To exercise the generation pipeline locally, run the Inngest dev server in a second terminal:

```bash
pnpm inngest:dev
```

## Project structure

```
src/
├── app/                 # Next.js App Router (public site, dashboard, admin, API routes)
│   ├── (public)/        # Landing page, legal, support
│   ├── (dashboard)/     # Create, videos, billing, live preview
│   └── api/             # tRPC, Inngest, realtime, Clerk & Stripe webhooks
├── inngest/             # Durable pipeline functions (character/round/meta/finalise)
├── lib/
│   ├── ai/              # Script, image, and voice generation
│   ├── pipeline/        # Round asset generation + state emission
│   ├── realtime/        # Live streaming to the client
│   └── storage/         # Cloudflare R2 uploads
├── remotion/            # Video compositions, scenes, and animation
├── server/              # tRPC routers, DB, credits, guardrails, jobs
└── config/credits/      # Credit pack configuration
```

## Scripts

| Command             | Description                                  |
| ------------------- | -------------------------------------------- |
| `pnpm dev`          | Start the dev server                         |
| `pnpm build`        | Production build                             |
| `pnpm inngest:dev`  | Run the Inngest dev server (pipeline)        |
| `pnpm db:push`      | Push the Drizzle schema to the database      |
| `pnpm db:studio`    | Open Drizzle Studio                          |
| `pnpm test`         | Run the Vitest test suite                    |
| `pnpm typecheck`    | Type-check without emitting                  |
| `pnpm lint`         | Lint with ESLint                             |

## License

[MIT](LICENSE) © Rishabh Singh
