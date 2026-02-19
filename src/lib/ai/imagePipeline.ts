import path from "path";
import type { RoastBattleSchemaType } from "../schemas/roast-battle";
import { saveStreamToR2 } from "../storage/saveToR2";
import { getTempUrl } from "../storage/r2StorageControl";
import { genImage } from "./image";

type CharacterData = {
  name: string;
  imagePrompts: RoastBattleSchemaType["imagePrompts"]["character1"];
  rounds: RoastBattleSchemaType["rounds"];
  details: RoastBattleSchemaType["character1"];
};

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

      const delayMs = baseDelayMs * Math.pow(2, attempt - 1); // 2s, 4s, 8s...
      console.warn(
        `Rate limited. Retrying in ${delayMs / 1000}s (attempt ${attempt}/${maxAttempts})...`,
      );
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  throw new Error("Unreachable");
}

export const generateCharacterImages = async (
  character: CharacterData,
  jobId: `${string}-${string}-${string}-${string}-${string}`,
) => {
  const { name, imagePrompts } = character;
  const referenceImageUrl = await getTempUrl();

  const saveImageToR2 = async (
    stream: ReadableStream<Uint8Array> | NodeJS.ReadableStream,
    angle: string,
  ) => {
    const fileName = `${name}-${angle}.png`;

    const r2Key = path.posix.join(jobId, "images", fileName);

    return await saveStreamToR2(stream, r2Key);
  };

  const frontPrompt = imagePrompts.find((p) => p.angle === "front")?.prompt;
  const sidePrompt = imagePrompts.find((p) => p.angle === "side")?.prompt;
  const profilePrompt = imagePrompts.find((p) => p.angle === "profile")?.prompt;

  if (!frontPrompt || !sidePrompt || !profilePrompt) {
    throw new Error("Prompt Missing");
  }

  // 1. Front
  console.log(`  🖼  Generating front image for ${name}...`);
  // After (with retry)
  const frontImageStream = await withRetry(() =>
    genImage(frontPrompt, referenceImageUrl),
  );

  // 2. Side
  console.log(`  🖼  Generating side image for ${name}...`);
  const sideImageStream = await withRetry(() =>
    genImage(sidePrompt, referenceImageUrl),
  );

  // 3. Profile
  console.log(`  🖼  Generating profile image for ${name}...`);
  const profileImageStream = await withRetry(() =>
    genImage(profilePrompt, referenceImageUrl),
  );

  const [frontPublicUrl, sidePublicUrl, profilePublicUrl] = await Promise.all([
    saveImageToR2(frontImageStream, "front"),
    saveImageToR2(sideImageStream, "side"),
    saveImageToR2(profileImageStream, "profile"),
  ]);

  return [frontPublicUrl, sidePublicUrl, profilePublicUrl];
};
