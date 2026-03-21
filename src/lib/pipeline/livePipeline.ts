import {
  getCharacterBundlePrompt,
  getMetadataPrompt,
  getRoundsPrompt,
} from "../utils/userPrompt";
import { generateScript } from "../ai/genScript";
import {
  createEmptyPreviewState,
  type LiveStateType,
} from "./helper/createEmptyPreviewState";
import { createCommonPreviewAssets } from "./helper/createCommonPreviewAssets";
import { getAudioDuration } from "../audio/getAudioDuration";
import { genImageFast } from "../ai/imageReplicate";
import { stateUpdateAndEmit } from "./helper/stateUpdateAndEmit";
import { streamStructuredArray } from "../ai/scriptStreaming";
import {
  CharacterBundleItemSchema,
  RoastBattleMetadataSchema,
  RoundSchema,
} from "../schemas/roast-battle-split";
import { ELEVENLABS_FLASH_VOICE } from "../constant";
import { PipelineLogger } from "./helper/pipelineLogger";
import { genAudioFast } from "../ai/elevenLabsReplicate";
import path from "path";
import { saveToR2UsingUrl } from "../storage/saveUsingUrl";
import { db } from "~/server/db";
import { jobsTable } from "~/server/db/schema";
import { and, eq } from "drizzle-orm";
import { realtime } from "../redis/realtime";
import { generateRoundAssets } from "./generateRoundAssets";
import { generateCharacterAssets } from "./generateCharacterAssets";

export async function runLivePipeline(
  jobId: string,
  prompt = "Generate a roast battle between vegito and gogeta",
  userId: string,
) {
  const liveState = createEmptyPreviewState();
  const logger = new PipelineLogger();
  logger.startTask("Init Pipeline & State");
  logger.endTask("Init Pipeline & State");

  const r2Promise: Promise<{ key: string; url: string }>[] = [];

  try {
    // Run all three generators in parallel
    await Promise.all([
      generateCharacterBundle({ prompt, liveState, logger, r2Promise, jobId }),
      generateRoundBundle({ prompt, liveState, logger, r2Promise, jobId }),
      generateMeta({ prompt, liveState, logger, r2Promise, jobId }),
    ]);

    // All assets generated — now wait for R2 uploads to finish
    console.log("R2Promises called");

    const r2Results = await Promise.all(r2Promise);

    // Build a map of key → permanent R2 URL
    const r2Map = new Map(r2Results.map(({ key, url }) => [key, url]));

    // Replace temp URLs with permanent R2 URLs in liveState
    await stateUpdateAndEmit(liveState, (state) => {
      // Meta thumbnail
      if (r2Map.has("meta-thumbnail")) {
        state.data.meta.thumbnailUrl = r2Map.get("meta-thumbnail")!;
      }

      // Characters
      const char1 = state.data.characterStats.character1;
      if (r2Map.has("characterBundle-character1")) {
        char1.imageUrl = r2Map.get("characterBundle-character1")!;
      }
      const char2 = state.data.characterStats.character2;
      if (r2Map.has("characterBundle-character2")) {
        char2.imageUrl = r2Map.get("characterBundle-character2")!;
      }

      // Rounds
      for (let i = 0; i < state.data.rounds.length; i++) {
        const round = state.data.rounds[i]!;
        if (r2Map.has(`round-${i}-attacker`)) {
          round.attackerImage = r2Map.get(`round-${i}-attacker`)!;
        }
        if (r2Map.has(`round-${i}-opponent`)) {
          round.opponentProfile = r2Map.get(`round-${i}-opponent`)!;
        }
        if (r2Map.has(`round-${i}-audio`)) {
          round.dialogueAudio = r2Map.get(`round-${i}-audio`)!;
        }
      }
    });

    const [result] = await db
      .update(jobsTable)
      .set({
        videoManifest: liveState,
        metaData: {
          battleTitle: liveState.data.meta.battleTitle,
          shortSubtitle: liveState.data.meta.shortSubtitle,
          thumbnailUrl: liveState.data.meta.thumbnailUrl!,
        },
        jobStatus: "complete",
      })
      .where(and(eq(jobsTable.id, jobId), eq(jobsTable.userId, userId)))
      .returning({ jobs: jobsTable.id });

    if (!result) throw new Error("Failed to save to db");

    await realtime.emit("pipeline-events", {
      type: "completed",
      jobId,
      message: "Video Pipeline Completed",
    });

    logger.printReport(jobId);
  } catch (err) {
    console.error("Pipeline crashed:", err);
    logger.printReport(jobId);

    await realtime.emit("pipeline-events", {
      type: "error",
      code: "ASSET_PIPELINE_CRASH",
      message: "Something went wrong generating your video. Please try again.",
    });
  }
}

const generateCharacterBundle = async ({
  prompt,
  jobId,
  r2Promise,
  liveState,
}: {
  prompt: string;
  liveState: LiveStateType;
  r2Promise: Promise<{ key: string; url: string }>[];
  jobId: string;
}) => {
  const bundleScript = streamStructuredArray({
    prompt: getCharacterBundlePrompt(prompt),
    schema: CharacterBundleItemSchema,
  });

  for await (const item of bundleScript) {
    // Measure image generation
    const characterImage = await generateCharacterAssets(item.imagePrompt);

    if (!liveState.data.announcer.ready) {
      await emitAnnouncer({ liveState });
    }

    await stateUpdateAndEmit(liveState, (state) => {
      const charSlot = state.data.characterStats[item.slot];
      charSlot.ready = true;
      charSlot.name = item.name;
      charSlot.title = item.title;
      charSlot.imagePrompt = characterImage.prompt;
      charSlot.imageUrl = characterImage.imageUrl; // URL → string
      charSlot.stats = item.stats;
      charSlot.skills = item.skills;
      charSlot.durationFrames = 90;
    });

    const fileName = path.posix.join(jobId, "image", item.name, "side.png");

    r2Promise.push(
      saveToR2UsingUrl({
        url: characterImage.imageUrl,
        fileName: fileName,
      }).then((r2Url) => ({ key: `characterBundle-${item.slot}`, url: r2Url })),
    );
  }
};

export const emitAnnouncer = async ({
  liveState,
}: {
  liveState: LiveStateType;
}) => {
  const commonAssets = createCommonPreviewAssets();
  const announcerDurationInFrames = Math.ceil(
    (await getAudioDuration(commonAssets.announcerAudioUrl)) * 30,
  );
  await stateUpdateAndEmit(liveState, (state) => {
    state.data.common = commonAssets;
    state.data.announcer.durationFrames = announcerDurationInFrames;
    state.data.announcer.ready = true;
  });
};

const generateRoundBundle = async ({
  prompt,
  liveState,
  jobId,
  r2Promise,
}: {
  prompt: string;
  liveState: LiveStateType;
  jobId: string;
  r2Promise: Promise<{ key: string; url: string }>[];
}) => {
  const roundScript = streamStructuredArray({
    prompt: getRoundsPrompt(prompt),
    schema: RoundSchema,
  });

  let roundIndex = 0; // Track which round we are on sequentially

  const voiceRef = [...ELEVENLABS_FLASH_VOICE];

  const voiceIndex = Math.floor(Math.random() * voiceRef.length);
  const character1Voice = voiceRef[voiceIndex]!;

  voiceRef.splice(voiceIndex, 1);

  const character2Voice =
    voiceRef[Math.floor(Math.random() * voiceRef.length)]!;

  for await (const round of roundScript) {
    const voiceRef =
      round.attacker === "character1" ? character1Voice : character2Voice;

    const {
      attackerImageUrl,
      opponentImageUrl,
      audioUrl,
      audioDurationFrames,
    } = await generateRoundAssets(round, voiceRef);

    const currentRoundIndex = roundIndex;
    roundIndex++; // Increment for the next loop

    await stateUpdateAndEmit(liveState, (state) => {
      const slot = state.data.rounds[currentRoundIndex]!;
      slot.attackingCharacter = round.attacker;
      slot.attackerImage = attackerImageUrl;
      slot.opponentProfile = opponentImageUrl;
      slot.dialogueAudio = audioUrl;
      slot.dialogueText = round.dialogue;
      slot.damage = round.damage;
      slot.durationFrames = audioDurationFrames;
    });

    const audioKey = path.posix.join(
      jobId,
      "audio",
      `round-${currentRoundIndex}.mp3`,
    );
    const attackerKey = path.posix.join(
      jobId,
      "image",
      `round-${currentRoundIndex}-attacker.png`,
    );
    const opponentKey = path.posix.join(
      jobId,
      "image",
      `round-${currentRoundIndex}-opponent.png`,
    );

    r2Promise.push(
      saveToR2UsingUrl({
        url: attackerImageUrl,
        fileName: attackerKey,
      }).then((r2Url) => ({
        key: `round-${currentRoundIndex}-attacker`,
        url: r2Url,
      })),
    );

    r2Promise.push(
      saveToR2UsingUrl({
        url: opponentImageUrl,
        fileName: opponentKey,
      }).then((r2Url) => ({
        key: `round-${currentRoundIndex}-opponent`,
        url: r2Url,
      })),
    );

    r2Promise.push(
      saveToR2UsingUrl({
        url: audioUrl,
        fileName: audioKey,
      }).then((r2Url) => ({
        key: `round-${currentRoundIndex}-audio`,
        url: r2Url,
      })),
    );
  }
};

const generateMeta = async ({
  prompt,
  liveState,
  logger,
  jobId,
  r2Promise,
}: {
  prompt: string;
  liveState: LiveStateType;
  logger: PipelineLogger;
  jobId: string;
  r2Promise: Promise<{ key: string; url: string }>[];
}) => {
  logger.startTask("Meta Generation");
  const meta = await generateScript(
    getMetadataPrompt(prompt),
    RoastBattleMetadataSchema,
  );
  logger.endTask("Meta Generation");

  if (!meta) throw new Error("Failed to generate metadata");

  // Emit title + subtitle immediately (no thumbnail yet)
  await stateUpdateAndEmit(liveState, (state) => {
    state.data.meta.battleTitle = meta.battleTitle;
    state.data.meta.shortSubtitle = meta.shortSubtitle;
  });

  // Generate thumbnail image
  logger.startTask("Thumbnail Image Gen");
  const thumbnailImage = await genImageFast(meta.thumbnailPrompt);
  logger.endTask("Thumbnail Image Gen");

  if (!thumbnailImage) throw new Error("Failed to generate thumbnail");

  const thumbnailTempUrl = thumbnailImage.url.toString();

  // Emit temp thumbnail URL so client sees it immediately
  await stateUpdateAndEmit(liveState, (state) => {
    state.data.meta.thumbnailUrl = thumbnailTempUrl;
  });

  // Save thumbnail to R2 in background
  const thumbnailKey = path.posix.join(jobId, "image", "thumbnail.png");
  r2Promise.push(
    saveToR2UsingUrl({
      url: thumbnailTempUrl,
      fileName: thumbnailKey,
    }).then((r2Url) => ({ key: "meta-thumbnail", url: r2Url })),
  );
};
