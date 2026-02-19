import path from "path";
import type { ImagePrompts } from "./types";
import { saveStreamToR2 } from "../storage/upload";
import { getTempUrl } from "../storage/r2";
import { genImage } from "./replicate";

// Retries fn up to maxAttempts times with exponential backoff (2s → 4s → 8s).
// Only retries on 429 rate-limit errors; all other errors throw immediately.
async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts = 4,
  baseDelayMs = 2000,
): Promise<T> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      const isRateLimited =
        err?.response?.status === 429 || err?.statusCode === 429;
      const isLastAttempt = attempt === maxAttempts;

      if (!isRateLimited || isLastAttempt) throw err;

      const delayMs = baseDelayMs * Math.pow(2, attempt - 1);
      console.warn(
        `Rate limited. Retrying in ${delayMs / 1000}s (attempt ${attempt}/${maxAttempts})...`,
      );
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  throw new Error("Unreachable");
}

export const generateCharacterImages = async (
  name: string,
  imagePrompts: ImagePrompts,
  jobId: string,
) => {
  const referenceImageUrl = await getTempUrl();

  const saveImageToR2 = async (
    stream: ReadableStream<Uint8Array> | NodeJS.ReadableStream,
    angle: string,
  ) => {
    const fileName = `${name}-${angle}.png`;
    const r2Key = path.posix.join(jobId, "images", fileName);
    const publicUrl = await saveStreamToR2(stream, r2Key);
    console.log(`  ✅ Image saved: ${fileName}`);
    return { angle, fileName, publicUrl };
  };

  // Generate sequentially one-by-one to respect Replicate rate limits,
  // then upload all in parallel.
  const streams: { angle: string; stream: ReadableStream<Uint8Array> }[] = [];

  for (const { angle, prompt } of imagePrompts) {
    console.log(`  🖼  Generating ${angle} image for ${name}...`);
    const stream = await withRetry(() => genImage(prompt, referenceImageUrl));
    streams.push({ angle, stream });
  }

  return Promise.all(
    streams.map(({ angle, stream }) => saveImageToR2(stream, angle)),
  );
};
