import path from "path";
import { alphaTrimBuffer } from "../image/alphaTrimBuffer";
import { getTempUrl } from "../storage/r2";
import { genImage } from "./imageReplicate";
import { removeBg } from "./removebackground";
import { saveBufferToR2 } from "../storage/saveBufferToR2";

export async function processImage(
  jobID: string,
  prompt: string,
  angle: string,
  name: string,
) {
  const refImage = await getTempUrl();
  const getImage = await genImage(prompt, refImage);

  const bgOutput = await removeBg(getImage.url);

  const trimAlpha = await alphaTrimBuffer(bgOutput.imageBuffer);

  const fileName = `${name}-${angle}.png`;

  const filePath = path.posix.join(jobID, "image", fileName);

  const publicUrl = await saveBufferToR2(trimAlpha, filePath);

  return { angle, fileName, publicUrl };
}

type Angle = "front" | "side" | "profile";
type Character = "character1" | "character2";

export type ImageTask = {
  character: Character;
  name: string;
  angle: Angle;
  prompt: string;
};

// Whatever processImage returns on success:
export type ImageResult = {
  angle: string;
  fileName: string;
  publicUrl: string;
};

export type ImageResultWithCharacter = ImageResult & { character: Character };

export async function processImagesWithRetry(
  jobId: string,
  allImageTasks: ImageTask[],
) {
  const MAX_ATTEMPT = 3;
  const PLACEHOLDER_URL = `${process.env.R2_PUBLIC_BASE_URL}/common/images/placeholder-failed.png`;

  // pending tasks are ImageTask plus their original index
  type PendingTask = ImageTask & { index: number };

  let pending: PendingTask[] = allImageTasks.map((image, i) => ({
    ...image,
    index: i,
  }));

  const finalResult = new Array<ImageResultWithCharacter | null>(
    allImageTasks.length,
  ).fill(null);

  for (let attempt = 0; attempt < MAX_ATTEMPT; attempt++) {
    if (pending.length === 0) break;

    if (attempt > 0) {
      console.log(
        `🔄 Retry attempt ${attempt}/${MAX_ATTEMPT - 1} for ${pending.length} failed image(s)...`,
      );
    }

    const results = await Promise.allSettled(
      pending.map((t) => processImage(jobId, t.prompt, t.angle, t.name)),
    );

    const stillFailed: PendingTask[] = [];

    for (let i = 0; i < results.length; i++) {
      const r = results[i]!;
      const task = pending[i]!;

      if (r.status === "fulfilled") {
        finalResult[task.index] = {
          ...r.value,
          character: task.character,
        };
      } else {
        console.error(
          `❌ Failed: ${task.name}-${task.angle} (attempt ${attempt + 1})`,
          r.reason,
        );
        stillFailed.push(task);
      }
    }

    pending = stillFailed;
  }

  // Fill placeholders for anything still failed after all retries
  for (const task of pending) {
    finalResult[task.index] = {
      angle: task.angle,
      fileName: `${task.name}-${task.angle}.png`,
      publicUrl: PLACEHOLDER_URL,
      character: task.character,
    };
  }

  return {
    finalResult, // (ImageResultWithCharacter | null)[] — no nulls if placeholder works
    failed: pending, // tasks that exhausted all retries
  };
}
