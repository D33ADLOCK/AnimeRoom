import { generateStructuredOutput } from "./grok";
import type { RoastBattleSchemaType } from "../schemas/roast-battle";
import { createAudioFileFromText } from "./elevenlabs";
import { genImage } from "./image";
import { getTempUrl } from "../storage/r2StorageControl";
import { randomUUID } from "crypto";
import path from "path";
import { saveStreamToR2 } from "../storage/saveToR2";

// ─── Config ────────────────────────────────────────────────────────────────

const VOICE_IDS = {
  character1: "yoZ06aMxZJJ28mfd3POQ",
  character2: "VR6AewLTigWG4xSOukaG",
};

// ─── Utilities ─────────────────────────────────────────────────────────────

/**
 * Retries an async function up to `maxAttempts` times with exponential backoff.
 * This handles Replicate's 429 rate limit errors gracefully instead of crashing.
 *
 * Why exponential backoff? Each retry waits 2x longer than the last.
 * So if the first retry waits 2s, the next waits 4s, then 8s, etc.
 * This avoids hammering the API and gives it time to recover.
 */
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

// ─── Types ─────────────────────────────────────────────────────────────────

type CharacterData = {
  name: string;
  imagePrompts: RoastBattleSchemaType["imagePrompts"]["character1"];
  rounds: RoastBattleSchemaType["rounds"];
  details: RoastBattleSchemaType["character1"];
};

// ─── Script Generation ─────────────────────────────────────────────────────

const userPrompt =
  "Generate a roast battle between Goku and Naruto, make it super savage";

const script = await generateStructuredOutput(userPrompt);
if (!script) throw new Error("Failed to generate script from Grok");

const jobId = randomUUID();
console.log(`\n🎬 Starting pipeline for job: ${jobId}\n`);

// ─── Character Setup ────────────────────────────────────────────────────────

const character1: CharacterData = {
  name: script.character1.name,
  imagePrompts: script.imagePrompts.character1,
  rounds: script.rounds.filter((round) => round.attacker === "character1"),
  details: script.character1,
};

const character2: CharacterData = {
  name: script.character2.name,
  imagePrompts: script.imagePrompts.character2,
  rounds: script.rounds.filter((round) => round.attacker === "character2"),
  details: script.character2,
};

// ─── Audio Generation ───────────────────────────────────────────────────────

/**
 * Generates all dialogue audio files for one character.
 * All lines run in parallel (ElevenLabs has no strict rate limit on free tier).
 */
const generateCharacterDialogues = async (
  character: CharacterData,
  voiceId: string,
) => {
  const dialogueLines = character.rounds.map((round) => round.dialogue);

  const audioTasks = dialogueLines.map(async (text, index) => {
    const audioStream = await createAudioFileFromText(text, voiceId);

    const fileName = `${character.name}-${index}.mp3`;

    const r2key = path.posix.join(jobId, "audio", fileName);

    const publicUrl = await saveStreamToR2(audioStream, r2key);
    // const outputPath = path.join(
    //   process.cwd(),
    //   "public",
    //   jobId,
    //   "audio",
    //   fileName,
    // );

    // const savedPath = await saveStreamToFile(audioStream, outputPath);

    // console.log(`  ✅ Audio saved: ${fileName}`);
    return { index, text, fileName, publicUrl };
  });

  return await Promise.all(audioTasks);
};

// ─── Image Generation ───────────────────────────────────────────────────────

/**
 * Generates all character images (front first, then the rest sequentially).
 *
 * Why front first? The front image is the primary reference for the character's
 * look. In the future, we can pass it as a reference image to the other angles
 * to ensure facial consistency.
 *
 * Why sequential with retry? Replicate rate-limits aggressively on low-credit
 * accounts. Sequential + retry-with-backoff is the safest approach.
 */
const generateCharacterImages = async (
  character: CharacterData,
  jobId: `${string}-${string}-${string}-${string}-${string}`,
) => {
  const { name, imagePrompts } = character;
  const referenceImageUrl = await getTempUrl();

  // const saveImage = async (
  //   imageStream: ReadableStream<Uint8Array> | NodeJS.ReadableStream,
  //   angle: string,
  // ) => {
  //   const fileName = `${name}-${angle}.png`;
  //   const outputPath = path.join(
  //     process.cwd(),
  //     "public",
  //     jobId,
  //     "images",
  //     fileName,
  //   );

  //   const savedPath = await saveStreamToFile(imageStream, outputPath);
  //   console.log(`  ✅ Image saved: ${fileName}`);
  //   return { angle, fileName, path: savedPath };
  // };

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

// ─── Orchestration ──────────────────────────────────────────────────────────

const generateAllDialogues = async () => {
  console.log("🎙  Generating all dialogues...");
  const [char1Dialogues, char2Dialogues] = await Promise.all([
    generateCharacterDialogues(character1, VOICE_IDS.character1),
    generateCharacterDialogues(character2, VOICE_IDS.character2),
  ]);
  console.log("✅ All dialogues saved.\n");
  return { char1Dialogues, char2Dialogues };
};

const generateAllImages = async () => {
  console.log("🖼  Generating all images...");
  // Sequential: character1 first, then character2 (to avoid rate limits)
  const char1Images = await generateCharacterImages(character1);
  const char2Images = await generateCharacterImages(character2);
  console.log("✅ All images saved.\n");
  return { char1Images, char2Images };
};

// ─── Main Entry Point ───────────────────────────────────────────────────────

const runPipeline = async () => {
  // Audio and images run in parallel (different APIs, no conflict)
  const [dialogues, images] = await Promise.all([
    generateAllDialogues(),
    generateAllImages(),
  ]);

  // Final manifest — this is what you'd pass to Remotion
  const manifest = {
    jobId,
    script,
    audio: dialogues,
    images,
  };

  console.log("\n🎉 Pipeline complete!");
  console.log(`📁 Assets saved to: public/${jobId}/`);

  return manifest;
};

const manifest = await runPipeline();
console.log("\n📋 Manifest:", JSON.stringify(manifest, null, 2));
