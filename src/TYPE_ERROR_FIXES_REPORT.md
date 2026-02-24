# Type Error Fixes Report

Date: February 22, 2026

This file documents the type fixes made in the project, including:
- what error existed
- what change was made
- why the change fixed it

---

## 1) Remotion dynamic audio metadata + CORS-safe probing

### File
- `remotion/prepareVideoProps.ts`

### Problem
- Audio duration was being derived using browser `new Audio(url)` metadata loading.
- This path is fragile with remote R2 URLs and can fail under CORS constraints in Remotion Studio.
- Several values returned from manifest lookups could be `undefined`, causing strict type failures in downstream components.

### Changes made
1. Replaced browser-audio metadata probing with **Media Bunny**:
   - Added imports: `Input`, `UrlSource`, `ALL_FORMATS` from `mediabunny`.
   - Added `getAudioDuration(src)` using `input.computeDuration()`.
2. Added safe fallback duration (`3` seconds) in case probing fails.
3. Added explicit runtime guards in manifest mapping:
   - `getImage(...)` now throws if URL is missing.
   - `getDialogueUrl(...)` now throws if URL is missing.
4. Added placeholder `audioDuration` shape in `prepareVideoProps` return so default props satisfy composition prop requirements before metadata is computed.

### Why this fixes it
- Media Bunny is the intended metadata probe path for Remotion workflows and is more robust than ad-hoc browser `Audio` events.
- Guarded lookups remove `string | undefined` at source and turn bad manifest shape into explicit error early.
- Default `audioDuration` object aligns with strict typing in Composition/Root.

---

## 2) Composition prop typing + optional duration math

### File
- `remotion/Composition.tsx`

### Problem
- Composition previously mixed hardcoded/test data and dynamic props.
- `roundsMeta[index]` can be `undefined` under strict mode.
- Strict mode raised errors around potential undefined values for image/audio props.

### Changes made
1. Switched component to use explicit typed props:
   - `export type MyCompositionProps = PrepareVideoPropsType`.
2. Removed stale `audioDuration` return-type import pattern and used directly typed props.
3. Converted duration math to safe defaults:
   - `INTRO_END` uses computed seconds -> frames with a minimum of 1 frame.
   - Round duration uses `(roundsMeta[index] ?? 3)` fallback.
   - Start-frame accumulation also uses safe fallback.
4. Ensured each `Sequence` has valid positive `durationInFrames`.

### Why this fixes it
- Strict TypeScript can now prove every value used in scene props and frame math is defined.
- Fallback duration prevents runtime crashes when metadata probing fails for one clip.

---

## 3) Root metadata typing and prop injection

### File
- `remotion/Root.tsx`

### Problem
- Type-only imports were required under `verbatimModuleSyntax`.
- `calculateMetadata` return type and `defaultProps` did not fully align with composition prop type.

### Changes made
1. Used type-only imports for types:
   - `import type { CalculateMetadataFunction } from "remotion"`
   - `import type { MyCompositionProps } from "./Composition"`
2. Typed `calculateMetadata` as:
   - `CalculateMetadataFunction<MyCompositionProps>`
3. Injected computed durations into returned props:
   - `props: { ...props, audioDuration: durations }`
4. Kept `defaultProps` from `prepareVideoProps(dummyManifest)` and let metadata pass update durations.

### Why this fixes it
- Fixes TS1484 type-only import errors.
- Ensures composition receives complete prop shape after metadata calculation.

---

## 4) Sharp utility strict null check

### File
- `remotion/lib/utils/sharp.ts`

### Problem
- Strict TS flagged alpha-channel read value as potentially undefined.

### Changes made
- Changed condition from `if (a >= alphaThreshold)` to `if ((a ?? 0) >= alphaThreshold)`.

### Why this fixes it
- Removes nullable comparison risk and keeps behavior safe for unexpected buffer access.

---

## 5) R2 upload stream body typing

### File
- `src/lib/storage/upload.ts`

### Problem
- `Upload` body type from AWS SDK did not match broad `NodeJS.ReadableStream` union in strict mode.
- Led to assignment/type incompatibility errors.

### Changes made
1. Narrowed stream types to concrete `Readable` where needed.
2. Kept web-stream detection and conversion via `Readable.fromWeb(...)`.
3. Cast to `NonNullable<PutObjectCommandInput["Body"]>` at conversion points.

### Why this fixes it
- Aligns runtime stream objects with what AWS SDK `Upload` expects.
- Keeps support for both Web ReadableStream and Node Readable safely.

---

## 6) Image pipeline retry typing

### File
- `src/lib/ai/images.ts`

### Problem
- `catch (err: any)` triggered lint/type safety errors (`no-explicit-any`, unsafe member access).

### Changes made
1. Replaced `any` catch with `unknown`.
2. Added typed helper `isRateLimitError(error: unknown)` that narrows error shape before field access.
3. Updated helper stream type to use Node `Readable` where expected.

### Why this fixes it
- Removes unsafe access to unknown error objects.
- Keeps retry behavior deterministic and type-safe.

---

## 7) saveToFile stream typing

### File
- `src/lib/ai/saveToFile.ts`

### Problem
- Unsafe `any` cast in `Readable.fromWeb(stream as any)` produced lint/type errors.

### Changes made
1. Added `NodeWebReadableStream` type import.
2. Replaced `any` cast with `unknown as NodeWebReadableStream`.
3. Narrowed accepted Node stream type to `Readable`.

### Why this fixes it
- Eliminates unsafe-argument and explicit-any lint failures while preserving behavior.

---

## 8) Removed stale/unused imports and directives

### Files
- `src/lib/ai/elevenlabs.ts`
- `src/lib/ai/replicate.ts`

### Problem
- Unused imports/constants and stale eslint-disable lines caused lint warnings and noise.

### Changes made
- Removed unused Node fs/path/stream imports and test constants from ElevenLabs helper.
- Removed unused `getTempUrl` import and unnecessary eslint-disable in replicate helper.

### Why this fixes it
- Keeps lint clean, reduces noise, and improves maintainability.

---

## 9) Validation run after fixes

Commands run:
1. `pnpm -s typecheck`
2. `pnpm -s lint`

Result:
- Typecheck passes.
- Lint passes (with only Next.js deprecation notice about `next lint` command migration path).

---

## 10) Important operational note

Even with correct typing/code, Media Bunny URL probing can still fail in browser if R2 CORS is misconfigured.

To support Remotion Studio and metadata probing from browser context, R2 CORS must allow:
- origins for local/prod app
- `GET`, `HEAD`
- headers including range behavior
- exposed headers such as `Content-Length`, `Content-Range`, `Accept-Ranges`, `ETag`

A copy-paste config file was added at:
- `src/r2-cors.json`

