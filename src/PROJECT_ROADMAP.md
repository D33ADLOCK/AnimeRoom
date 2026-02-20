# AnimeRoom Project Roadmap (Detailed)

Last updated: February 19, 2026 (updated with Clerk auth + social feed scope)

## 1) Goal Definition

You want AnimeRoom to deliver an experience similar to [maxroom.co](https://maxroom.co/):
- user enters a prompt
- backend generates script + assets with AI
- user sees generation progress quickly
- user can preview output while generation is in progress
- final rendered video is stored and replayed from URL (no re-render on every watch)

This is a valid architecture and a strong product direction.

---

## 2) What Maxroom-Like Product Actually Needs (Simple View)

From a product perspective, there are 4 pillars:

1. Creation UX
- Prompt input
- Presets/templates (characters, styles, themes)
- Fast feedback while generation runs

2. Reliable Generation Engine
- deterministic job states
- retries for AI APIs
- robust asset upload + metadata

3. Playback + Library
- final videos persisted in cloud storage
- replay via URL, not regenerated
- history/listing page for generated videos

4. Business/Operations + Social Layer
- auth (Clerk)
- ownership + privacy controls (public/private/unlisted)
- social feed discovery (public videos)
- quotas/credits/pricing
- observability/cost controls

Your current codebase is mostly in pillar #2 early stage, with strong beginnings and some important missing wiring. Pillars #3 and #4 are still very early.

---

## 3) Current State Audit (What You Have Right Now)

### 3.1 Strengths (You Did These Right)

1. Core AI pipeline pieces are modularizing well
- `src/lib/ai/audio.ts`
- `src/lib/ai/images.ts`
- `src/lib/ai/grok.ts`

2. You moved from local-only output toward cloud-first assets
- `src/lib/storage/upload.ts` (stream upload to R2)

3. You created a job-oriented DB schema
- `src/server/db/schema.ts` now has `jobs` with status/script/manifest/video fields
- migration present in `drizzle/0002_bumpy_jane_foster.sql`

4. You already have tRPC app scaffolding
- `src/app/api/trpc/[trpc]/route.ts`
- `src/trpc/react.tsx`, `src/server/api/trpc.ts`

5. You already have a Remotion composition baseline
- good for visual experimentation and animation workflow validation

### 3.2 Critical Gaps (Must Fix Next)

1. Router integration is incomplete
- `src/server/api/root.ts` imports old `postRouter`, app router is empty
- new `job` router exists but is not exported/connected

2. `job` router is incomplete and not using tRPC handler signature correctly
- `src/server/api/routers/job.ts` currently has unfinished mutation and type issues

3. Pipeline is still script-style entrypoint
- `src/lib/ai/pipeline.ts` runs at module scope with hardcoded prompt
- should become callable function: `runPipeline(jobId, prompt)`

4. Frontend is still placeholder
- `src/app/page.tsx` returns `Hello`
- no prompt flow, no job status page, no preview/final playback UI

5. Remotion composition still hardcoded static data/assets
- `remotion/Composition.tsx` uses static files + fixed names/stats/audio
- not yet manifest-driven

6. Typecheck/lint currently failing heavily
- unresolved imports and unsafe typing across pipeline/storage/router
- this blocks reliable iteration

7. Environment schema not updated for current dependencies
- `src/env.js` only validates `DATABASE_URL`, `NODE_ENV`
- missing required AI/R2 keys and base URLs

8. No auth/ownership model yet
- no user identity attached to jobs/videos
- no visibility rules (`public`, `private`, `unlisted`)
- no multi-tenant access guardrails

---

## 4) Progress Estimate (Overall and by Track)

This is a weighted estimate for your final product goal:

### Overall progress: **29%**

Breakdown:

1. AI script generation: 70%
- generation works
- schema-driven output exists
- needs stronger resilience + typed error handling

2. Asset generation (images/audio): 65%
- generation + upload path exists
- still has typing/runtime hardening gaps

3. Job orchestration/state machine: 30%
- DB schema exists
- API orchestration incomplete
- no robust background processing loop yet

4. Remotion dynamic rendering from manifest: 25%
- visual system exists
- not parameterized from manifest yet

5. Frontend UX (prompt -> progress -> playback): 10%
- currently placeholder only

6. Reliability/observability/cost controls: 10%
- retries partly present
- no robust metrics, no queue, no rate limit policy, limited failure recovery

7. Product surfaces (auth/library/pricing/templates): 5%
- not started in app

8. Auth + social feed system: 2%
- intent defined, implementation not started

---

## 5) Architecture You Should Lock In (Now Includes Auth + Social)

## 5.1 Core Rule

Keep separation clean:

1. Frontend decides **when to request**
2. tRPC decides **what operation**
3. Pipeline/service decides **how work is executed**

Do not put full heavy pipeline logic inside tRPC procedure bodies.

## 5.2 Recommended System Design (v1)

1. `createJob` mutation
- generate `jobId` (UUID)
- insert DB row with `status='queued'`
- trigger background pipeline execution
- return `jobId` immediately

2. Background pipeline service
- `runPipeline(jobId, prompt)`
- update DB status at each stage
- upload assets to R2 under `jobs/{jobId}/...`
- build manifest
- render final mp4
- upload final video
- set `status='complete'`, save `videoUrl`

3. `getJobStatus` query
- returns status, progress, optional manifest preview, videoUrl, error

4. Frontend generation pages
- `/` prompt input
- `/generate/[jobId]` polling view
- show stage/progress and optional preview
- switch to final `videoUrl` when complete

5. Ownership and feed model
- every job/video has `ownerId` (from Clerk `userId`)
- every video has `visibility` (`private` | `public` | `unlisted`)
- feed endpoint returns only `public` videos
- library endpoint returns owner’s videos (all visibilities)

## 5.3 State Machine (Use This Exactly)

- `queued`
- `generating_script`
- `generating_assets`
- `saving_to_cloud` (optional if assets are uploaded progressively)
- `rendering`
- `complete`
- `failed`

Invariants:
- only one terminal state: `complete` or `failed`
- once complete, `videoUrl` must be non-null
- each transition writes `updatedAt`

---

## 6) Detailed Gap-to-Goal Map

## 6.1 Backend Foundation

Done:
- jobs schema exists

Missing:
- strict validation for status values at API boundary
- progress numeric column (0-100)
- stage metadata (optional but useful)
- stable error taxonomy
- ownership + privacy fields on job/video records

Action:
- add `progress` and maybe `errorCode` fields
- keep `id` as UUID text primary key
- add `ownerId`, `visibility`, `title`, `thumbnailUrl`, and indexed `createdAt`

## 6.2 tRPC API Layer

Done:
- tRPC plumbing exists

Missing:
- root router not wired
- job router unfinished
- no public procedures for full lifecycle

Action:
- implement:
  1. `job.create` (mutation)
  2. `job.status` (query)
  3. `job.list` (query, optional but useful)
  4. `job.retry` (mutation, optional)
  5. `video.feed` (query: public only)
  6. `video.mine` (query: owner only)
  7. `video.updateVisibility` (mutation: owner only)

## 6.3 Pipeline/Service Layer

Done:
- modular functions for script/images/audio

Missing:
- callable pipeline function with injected dependencies
- DB status/progress updates per stage
- robust error boundaries and retries around all external calls

Action:
- convert current pipeline entry script into exported service function
- no top-level await side effects

## 6.4 Storage Layer (R2)

Done:
- stream upload with managed uploader

Missing:
- metadata capture (size bytes, duration)
- content-type completeness (`audio/wav` etc.)
- structured key naming convention doc

Action:
- standardize key format:
  - `jobs/{jobId}/audio/{character}-{index}.mp3`
  - `jobs/{jobId}/images/{character}-{angle}.png`
  - `jobs/{jobId}/video/final.mp4`

## 6.5 Remotion Layer

Done:
- scene system and composition baseline

Missing:
- composition not manifest-driven
- no server-side render integration from main Next app

Action:
- move hardcoded props to typed `inputProps`
- compute durations from manifest/audio metadata
- render with stable composition contract

## 6.6 Frontend Layer

Done:
- tRPC provider wiring exists

Missing:
- actual product pages
- prompt submission flow
- status/progress UX
- final player + history
- auth gates and user-aware navigation
- public feed and profile/library separation

Action:
- implement pages in order:
  1. prompt landing
  2. generate status page
  3. video library page
  4. public feed page
  5. video detail page with share URL

## 6.7 Auth + Access Control Layer (Clerk)

Done:
- not integrated yet

Missing:
- Clerk setup in Next app (`middleware`, provider, protected routes)
- user identity mapping to DB (`ownerId`)
- authorization checks in tRPC procedures
- privacy model enforcement in queries

Action:
- integrate Clerk server auth in tRPC context
- require auth for `job.create`, `job.status` (except public-safe fields if shared)
- enforce owner check on private/unlisted video reads
- keep `video.feed` public and visibility-filtered

---

## 7) 7-Phase Execution Roadmap

## Phase 0: Stabilize Build (Immediate)

Goal: make project compile and lint clean enough to iterate safely.

Tasks:
1. fix `src/server/api/root.ts` router imports/exports
2. finish `src/server/api/routers/job.ts` signature and return types
3. align `generateScript` naming usage in pipeline
4. resolve upload stream typings in `src/lib/storage/upload.ts`
5. remove dead imports/unused code in `elevenlabs.ts`, `r2.ts`
6. decide whether root tsconfig should include `remotion/`; if yes, add workspace setup for remotion deps

Exit criteria:
- `pnpm typecheck` passes
- `pnpm lint` passes

## Phase 1: Job API + DB Wiring

Goal: job lifecycle works end-to-end without rendering.

Tasks:
1. implement `job.create`
2. insert row `queued`
3. background transition to `generating_script` and save script
4. expose `job.status` query
5. add simple polling test page or curl test

Exit criteria:
- create job returns id
- status progresses and persists

## Phase 2: Clerk Auth + Ownership Foundations

Goal: attach identity and access rules before exposing feed/library.

Tasks:
1. add Clerk to app (`ClerkProvider`, middleware, protected routes)
2. pass authenticated user to tRPC context
3. add DB fields: `ownerId`, `visibility`
4. enforce owner checks in `job.status`, `job.list`, and future video mutations
5. define default visibility policy (recommended: `private`)

Exit criteria:
- authenticated users can create jobs
- users can only see their private jobs/videos
- public endpoints only return public data

## Phase 3: Asset Generation + Manifest Persistence

Goal: generated assets and manifest are persisted and recoverable.

Tasks:
1. call image/audio generation from pipeline service
2. upload all outputs to R2
3. build canonical manifest
4. save manifest to `jobs.manifest`
5. set progress increments by stage

Exit criteria:
- DB row contains usable manifest with valid asset URLs

## Phase 4: Remotion Dynamic Render Integration

Goal: render from manifest once and store final video URL.

Tasks:
1. make composition consume input props from manifest
2. add server-side render trigger after manifest ready
3. upload final mp4 to R2
4. persist `videoUrl`, set `status='complete'`

Exit criteria:
- job reaches complete with playable `videoUrl`
- replay does not rerender

## Phase 5: Frontend Product Flow

Goal: usable experience matching core expectation.

Tasks:
1. build landing prompt page
2. route to `/generate/[jobId]`
3. polling UI with stage labels
4. show manifest preview (optional)
5. switch to final player when complete

Exit criteria:
- from prompt to final playback works in browser

## Phase 6: Social Feed + Library UX

Goal: create social media vibe with public discovery and private workspace.

Tasks:
1. build `/feed` page for public videos
2. build `/library` page for signed-in user’s videos
3. add visibility controls on video cards/detail
4. add creator metadata on public videos
5. add pagination + sorting (`latest`, `popular` later)

Exit criteria:
- users can browse public videos
- users can manage privacy on their own videos
- private videos never leak into public feed

## Phase 7: Productization and Quality

Goal: reliability, safety, and operating confidence.

Tasks:
1. retry policy and structured error messages
2. concurrency limits per user/IP
3. logs with correlation by jobId
4. basic analytics (duration per stage, failure rate)
5. cost guardrails (max rounds, max retries)

Exit criteria:
- stable behavior under repeated jobs

---

## 8) What To Focus On Next (Immediate Priorities)

If you only do the next 7 things, do these in order:

1. fix compile/lint baseline (Phase 0)
2. wire `job` router into app router
3. convert pipeline into `runPipeline(jobId, prompt)` service
4. integrate Clerk and add `ownerId` + `visibility`
5. implement DB status updates at each stage
6. implement `job.create` + `job.status` with auth checks
7. make Remotion composition manifest-driven

---

## 9) Top 20% Concepts That Will Give 80% Results

These are the most important concepts for your success:

1. State machine design
- clear statuses, deterministic transitions, terminal states

2. Contract-first design
- stable manifest schema between pipeline, render, frontend

3. Separation of concerns
- API orchestration vs pipeline logic vs UI rendering

4. Idempotency
- safe retries without duplicate side effects

5. Observability by `jobId`
- every log and error tied to one correlation id

6. Failure handling strategy
- retry only transient errors, fail fast on schema/logic errors

7. Cost-aware architecture
- avoid unnecessary rerenders and repeated external calls

8. Typed boundaries
- strong TypeScript + Zod at API/service boundaries

9. Async workflow UX
- return quickly, poll/push status, never block user on long call

10. Artifact persistence model
- generate once, store once, replay many times

11. Multi-tenant authorization
- every query/mutation scoped by authenticated user + visibility policy

12. Privacy-by-default UX
- default private, explicit public publish action

If you master these 12, most other decisions become straightforward.

---

## 10) Risks and Blind Spots to Watch

1. Treating frontend preview as true final video streaming
- keep this distinction clear: preview vs final mp4

2. Hidden coupling between remotion static files and manifest data
- avoid hybrid hardcoded + dynamic setup

3. Type debt slowing velocity
- unresolved `any` and unsafe casts will keep causing regressions

4. Environment drift
- env schema must reflect actual required keys

5. Long-running tasks in request lifecycle
- never block mutation until render completes

6. Broken access control
- accidental data leaks between users are a severe risk

---

## 11) Suggested Milestone Timeline (Practical)

Week 1:
- Phase 0 + Phase 1

Week 2:
- Phase 2 + start Phase 3

Week 3:
- finish Phase 3 + Phase 4

Week 4:
- Phase 5 + Phase 6 + initial Phase 7 hardening

This is realistic if you stay strict on scope.

---

## 12) Definition of “MVP Similar to Maxroom” for You (With Auth + Feed)

Your MVP is complete when all are true:

1. user can submit prompt
2. job appears in DB with live status updates
3. assets generated and stored in R2
4. remotion renders from manifest (no hardcoded sample data)
5. final video stored and replayable from URL
6. frontend shows progress and final playback
7. users sign in with Clerk and jobs are owned by user
8. `/feed` shows public videos, `/library` shows user videos
9. visibility controls work (`public/private/unlisted`)

Billing and advanced marketplace/template mechanics remain post-MVP.

---

## 13) Reference Pages Reviewed

- [maxroom.co home](https://maxroom.co/)
- [maxroom.co pricing](https://maxroom.co/pricing)
- [maxroom.co videos](https://maxroom.co/videos)

Note: this roadmap is based on your current repository state plus public-facing product expectations from these pages.
