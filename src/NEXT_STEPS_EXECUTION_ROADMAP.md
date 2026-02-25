# AnimeRoom - Next Steps Execution Roadmap

Last updated: February 25, 2026

This roadmap is based on your **current code state** (Clerk + jobs schema + tRPC + dynamic preview player working).

---

## 1) Current Snapshot

## What is already working

1. Auth + protected APIs
- Clerk is integrated in tRPC context (`userId` in context).
- Protected procedures exist and are being used for job routes.

2. Job model + DB
- Jobs table exists with key generation fields: `id`, `userId`, `prompt`, `jobStatus`, `manifest`, `videoProps`, `videoUrl`, `error`, timestamps.

3. Pipeline flow is wired
- `createJob` inserts job.
- `startPipeline` progresses through stages and stores `manifest` + `videoProps`.
- `getStatus` and `getManifest` are implemented.

4. Dynamic Remotion preview
- You can generate and watch dynamic video props in player.
- Sidebar/dashboard route groups are in place.

---

## 2) Progress Estimate

Overall product progress toward a maxroom-like MVP: **~58%**

Breakdown:
1. Generation backend (script + assets + manifest): 75%
2. Job orchestration and status lifecycle: 65%
3. Dynamic Remotion preview in frontend: 70%
4. Final render + durable playback URL flow: 30%
5. UX polish (create/status states/errors): 45%
6. Public feed + private library model: 25%
7. Production hardening (retries, metrics, limits): 20%

---

## 3) Biggest Gaps Left

1. Final MP4 rendering + persistence path is incomplete
- You currently end at `videoProps` and `complete`.
- Need to actually render MP4, upload to R2, save `videoUrl`.

2. Pipeline trigger pattern can be improved
- Right now page `/video/[jobId]` triggers `startPipeline` on first load.
- Better: trigger pipeline from server immediately after `createJob` (or queue worker), not tied to one page tab.

3. Status response is too minimal
- `getStatus` returns only status string.
- UI needs richer payload (progress %, error, createdAt, maybe stage message).

4. Missing user product surfaces
- No robust `/library` (my videos) and `/feed` (public videos) workflow yet.

5. Missing final reliability controls
- retries per stage, idempotency, concurrency controls, observability.

---

## 4) Immediate Next Step (Do This First)

**Build the final artifact flow (render -> upload -> videoUrl) before new UI pages.**

Why this is the highest-leverage step:
1. It converts preview-only pipeline into a true product output.
2. It unlocks feed/library/share use cases.
3. It stabilizes the backend contract for frontend pages.

---

## 5) Executable Plan in Small Steps

## Phase A - Finish Core Job Contract (small backend tasks)

1. Upgrade `jobStatus` lifecycle to include explicit render stages
- Add/ensure statuses: `queued`, `generating_script`, `generating_assets`, `saving_manifest`, `transforming_props`, `rendering`, `uploading_video`, `complete`, `failed`.

2. Add `progress` field to jobs table (0-100)
- So frontend can show smooth progress rather than just status labels.

3. Update `getStatus` response shape
- Return object: `{ status, progress, error, hasManifest, hasVideoUrl }`.

4. Keep `getManifest` only for preview
- Continue using this for Remotion player preview mode.

Exit criteria:
- Status query is rich enough to drive a complete status UI.

---

## Phase B - Final Render + Upload Path (most important)

1. Build a render service function
- Input: `videoProps`
- Output: local `.mp4` path

2. Upload rendered mp4 to R2
- R2 key: `jobs/{jobId}/video/final.mp4`

3. Save URL to DB and finalize job
- Set `videoUrl`
- Set `jobStatus = complete`
- Set `progress = 100`

4. On failure at any stage
- Set `jobStatus = failed`
- Save `error`

Exit criteria:
- Any completed job has a playable `videoUrl`.

---

## Phase C - Frontend: status page UX completion

1. Improve `/video/[jobId]`
- Show full status timeline.
- Show progress bar.
- Show clear error/retry states.

2. Add mode switch
- While processing: show status + optional preview.
- When complete and `videoUrl` exists: prefer `<video>` from `videoUrl`.

3. Add empty/loading guards
- Don’t show blank states if manifest missing.

Exit criteria:
- Page handles all states cleanly: loading, processing, failed, complete.

---

## Phase D - Trigger architecture cleanup

1. Remove pipeline start dependence on page mount
- Start generation server-side after `createJob` (fire-and-forget) or queue worker.

2. Make start idempotent
- If already started/completed, no duplicate side effects.

3. Preserve direct-link behavior
- `/video/[jobId]` should only read status; not be required to kick off generation.

Exit criteria:
- Job starts regardless of user staying on that page/tab.

---

## Phase E - Product pages (social + private)

1. `/library` (private)
- Show signed-in user’s jobs/videos.

2. Visibility model
- Add `visibility` (`private`, `public`, `unlisted`) if not already in schema.

3. `/feed` (public)
- Show only `public` completed videos.

4. Video detail page
- show metadata + player + share link.

Exit criteria:
- Private and public surfaces both work correctly.

---

## 6) Suggested 7-Day Sprint Plan

## Day 1
1. Add `progress` to DB schema.
2. Update status response shape.
3. Ensure status enum covers render/upload stages.

## Day 2
1. Implement render service.
2. Render local mp4 from `videoProps`.

## Day 3
1. Upload mp4 to R2.
2. Save `videoUrl` and mark complete.

## Day 4
1. Update `/video/[jobId]` state UI and progress UI.
2. Add failed-state UX + retry action.

## Day 5
1. Move pipeline trigger off page mount.
2. Make start idempotent.

## Day 6
1. Build `/library` page.
2. Add list query endpoint.

## Day 7
1. Start `/feed` page with public-only completed videos.
2. End-to-end test with 3 jobs.

---

## 7) Definition of Done for Next Milestone

The next milestone is complete when all are true:

1. User creates a job from `/create`.
2. Pipeline runs without depending on page refresh/mount timing.
3. Status API returns rich progress and errors.
4. Job reaches `complete` with non-null `videoUrl`.
5. `/video/[jobId]` automatically switches to final video playback from R2 URL.
6. Failed jobs show useful error states.

---

## 8) Top 20% Focus (for fastest progress)

If you only focus on a few things, focus on these:

1. Durable artifact pipeline (`videoUrl`) over preview-only flow.
2. Deterministic job state machine + progress updates.
3. Clear frontend state handling for async jobs.
4. Decoupling job execution from page lifecycle.
5. Access control boundaries (owner-only private data).

These 5 areas will unlock most of the product value quickly.

---

## 9) Practical Notes for Your Current Code

1. `createJob` currently returns an array with one row. Prefer returning object directly for cleaner UI usage.
2. `startPipeline` in page `useEffect` works for now but should be temporary.
3. Keep Remotion preview in status page, but once `videoUrl` exists, treat preview as secondary.
4. Keep logs correlated by `jobId` to debug pipeline steps quickly.

