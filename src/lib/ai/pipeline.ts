import { generateAudiosWithRetry } from "./audio";
import { processImagesWithRetry } from "./images";
import { getTempUrl } from "../storage/r2";
import type { RoastBattleSchemaType } from "../schemas/roast-battle";
import path from "path";
import { genImageFast } from "./imageReplicate";
import { saveStreamToR2 } from "../storage/upload";

// ─── Common R2 Assets ────────────────────────────────────────────────────────

const R2_BASE = process.env.R2_PUBLIC_BASE_URL!;

const ANNOUNCER_AUDIO_POOL = [
  `${R2_BASE}/common/audio/announcer/announcer-opening-2.mp3`,
  `${R2_BASE}/common/audio/announcer/announcer-opening-3.mp3`,
  `${R2_BASE}/common/audio/announcer/announcer-opening-4.mp3`,
  `${R2_BASE}/common/audio/announcer/dbz-announcer-opening-1.mp3`,
  `${R2_BASE}/common/audio/announcer/dbz-announcer-opening-2.mp3`,
  `${R2_BASE}/common/audio/announcer/dbz-announcer-opening-3.mp3`,
  `${R2_BASE}/common/audio/announcer/dbz-announcer-opening-4.mp3`,
] as const;

const pickRandom = <T>(arr: readonly T[]): T =>
  arr[Math.floor(Math.random() * arr.length)]!;

// ─── References ──────────────────────────────────────────────────────────────

export type PipelineReferences = {
  character1?: { voiceUrl?: string; imageUrl?: string };
  character2?: { voiceUrl?: string; imageUrl?: string };
};

const DEFAULT_VOICE_REF = {
  character1: path.posix.join(
    process.env.R2_PUBLIC_BASE_URL!,
    "references/0073220e1dc738a5/7c6fac23-1843-4787-aab8-839f3d407f70.mp3",
  ),
  character2: path.posix.join(
    process.env.R2_PUBLIC_BASE_URL!,
    "references/0073220e1dc738a5/602c57c3-9692-4d6d-accf-26411eb19c97.mp3",
  ),
};

// ─── Orchestration ───────────────────────────────────────────────────────────

const generateAllDialogues = async (
  script: RoastBattleSchemaType,
  jobId: string,
  references?: PipelineReferences,
) => {
  console.log("🎙  Generating all dialogues...");

  const allRounds = script.rounds.map((r) => ({
    ...r,
    name:
      r.attacker === "character1"
        ? script.character1.name
        : script.character2.name,
    // Per-character voice reference — falls back to default
    referenceUrl:
      r.attacker === "character1"
        ? (references?.character1?.voiceUrl ?? DEFAULT_VOICE_REF.character1)
        : (references?.character2?.voiceUrl ?? DEFAULT_VOICE_REF.character2),
  }));

  const allAudios = await generateAudiosWithRetry(allRounds, jobId);

  console.log("✅ All dialogues saved.\n");
  return allAudios;
};

const generateAllImages = async (
  script: RoastBattleSchemaType,
  jobId: string,
) => {
  console.log("🖼  Generating all images...");

  const allImageTasks = [
    ...script.imagePrompts.character1.map((i) => ({
      character: "character1" as const,
      name: script.character1.name,
      angle: i.angle,
      prompt: i.prompt,
    })),
    ...script.imagePrompts.character2.map((i) => ({
      character: "character2" as const,
      name: script.character2.name,
      angle: i.angle,
      prompt: i.prompt,
    })),
  ];

  const { finalResult, failed } = await processImagesWithRetry(
    jobId,
    allImageTasks,
  );

  console.log("✅ All images saved.\n");

  const char1Images = finalResult.filter(
    (i): i is NonNullable<typeof i> => i?.character === "character1",
  );
  const char2Images = finalResult.filter(
    (i): i is NonNullable<typeof i> => i?.character === "character2",
  );

  if (failed.length > 0) {
    console.warn(
      `⚠️  ${failed.length} image(s) failed after all retries and were replaced with placeholders.`,
    );
  }

  return { char1Images, char2Images, failed };
};

const generateThumbnail = async (
  script: RoastBattleSchemaType,
  jobId: string,
) => {
  console.log("🖼  Generating thumbnail...");

  const image = await genImageFast(script.thumbnailPrompt);

  const filePath = path.posix.join(jobId, "images", "thumbnail.png");
  const publicUrl = await saveStreamToR2(image.file, filePath);

  console.log("✅ Thumbnail saved.\n");
  return { fileName: "thumbnail.png", publicUrl };
};

// ─── Main Entry Point ────────────────────────────────────────────────────────

export const runPipeline = async (
  script: RoastBattleSchemaType,
  jobId: string,
  references?: PipelineReferences,
) => {
  const [dialogues, images, thumbnail] = await Promise.all([
    generateAllDialogues(script, jobId, references),
    generateAllImages(script, jobId),
    generateThumbnail(script, jobId),
  ]);

  const commonAssets = {
    background: `${R2_BASE}/common/images/background.png`,
    announcerImage: `${R2_BASE}/common/images/announcer-image.png`,
    announcerAudio: pickRandom(ANNOUNCER_AUDIO_POOL),
    skillIcons: [
      `${R2_BASE}/common/images/skill1.png`,
      `${R2_BASE}/common/images/skill2.png`,
      `${R2_BASE}/common/images/skill3.png`,
    ],
  };

  const manifest = {
    jobId,
    script,
    common: commonAssets,
    audio: dialogues,
    images,
    thumbnail,
  };

  console.log("\n🎉 Pipeline complete!");
  console.log(`📁 Assets saved to: r2/${jobId}/`);

  return manifest;
};

export type ManifestType = Awaited<ReturnType<typeof runPipeline>>;
