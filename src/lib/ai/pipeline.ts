import { generateAudiosWithRetry } from "./audio";
import { processImagesWithRetry } from "./images";
import { getTempUrl } from "../storage/r2";
import type { RoastBattleSchemaType } from "../schemas/roast-battle";

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

// ─── Orchestration ───────────────────────────────────────────────────────────

const generateAllDialogues = async (
  script: RoastBattleSchemaType,
  jobId: string,
) => {
  console.log("🎙  Generating all dialogues...");

  // Merge all rounds with character names for Chatterbox
  const allRounds = script.rounds.map((r) => ({
    ...r,
    name:
      r.attacker === "character1"
        ? script.character1.name
        : script.character2.name,
  }));

  // Get a reference audio URL for Chatterbox voice cloning
  const referenceUrl =
    "https://pub-a84c9577f3e14dc795b6c4efb1ecb53b.r2.dev/common/audio/announcer/testing-gogeta-d1.mp3";

  const allAudios = await generateAudiosWithRetry(
    allRounds,
    referenceUrl,
    jobId,
  );

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

// ─── Main Entry Point ────────────────────────────────────────────────────────

export const runPipeline = async (
  script: RoastBattleSchemaType,
  jobId: string,
) => {
  const [dialogues, images] = await Promise.all([
    generateAllDialogues(script, jobId),
    generateAllImages(script, jobId),
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
  };

  console.log("\n🎉 Pipeline complete!");
  console.log(`📁 Assets saved to: r2/${jobId}/`);

  return manifest;
};

export type ManifestType = Awaited<ReturnType<typeof runPipeline>>;
