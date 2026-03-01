import { generateCharacterDialogues } from "./audio";
import { processImagesWithRetry } from "./images";
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

// ─── Config ─────────────────────────────────────────────────────────────────

const VOICE_IDS = {
  character1: "yoZ06aMxZJJ28mfd3POQ",
  character2: "VR6AewLTigWG4xSOukaG",
};

// ─── Orchestration ───────────────────────────────────────────────────────────

type CharacterRoundType = {
  character1: {
    char1Name: string;
    char1Rounds: {
      attacker: "character1" | "character2";
      dialogue: string;
      damage: number;
    }[];
  };
  character2: {
    char2Name: string;
    char2Rounds: {
      attacker: "character1" | "character2";
      dialogue: string;
      damage: number;
    }[];
  };
};

const generateAllDialogues = async (
  characterRounds: CharacterRoundType,
  jobId: string,
) => {
  console.log("🎙  Generating all dialogues...");
  const [char1Dialogues, char2Dialogues] = await Promise.all([
    generateCharacterDialogues(
      characterRounds.character1.char1Name,
      characterRounds.character1.char1Rounds,
      VOICE_IDS.character1,
      jobId,
    ),
    generateCharacterDialogues(
      characterRounds.character2.char2Name,
      characterRounds.character2.char2Rounds,
      VOICE_IDS.character2,
      jobId,
    ),
  ]);
  console.log("✅ All dialogues saved.\n");
  return { char1Dialogues, char2Dialogues };
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

  const char1Images = finalResult.filter((i) => i?.character === "character1");
  const char2Images = finalResult.filter((i) => i?.character === "character2");

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
  const char1Rounds = script.rounds.filter((r) => r.attacker === "character1");
  const char2Rounds = script.rounds.filter((r) => r.attacker === "character2");

  const char1Name = script.character1.name;
  const char2Name = script.character2.name;

  const characterRounds = {
    character1: { char1Name, char1Rounds },
    character2: { char2Name, char2Rounds },
  };

  const [dialogues, images] = await Promise.all([
    generateAllDialogues(characterRounds, jobId),
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
