import {
  getCharacterBundlePrompt,
  getMetadataPrompt,
  getRoundsPrompt,
} from "../utils/userPrompt";
import { generateScript } from "../ai/(depc)grok";
import {
  createEmptyPreviewState,
  type LiveStateType,
} from "./createEmptyPreviewState";
import { createCommonPreviewAssets } from "./createCommonPreviewAssets";
import { getAudioDuration } from "../audio/getAudioDuration";
import { genImageFast } from "../ai/imageReplicate";
import { stateUpdateAndEmit } from "./helper/stateUpdateAndEmit";
import { streamStructuredArray } from "../ai/scriptStreaming";
import {
  CharacterBundleItemSchema,
  RoundSchema,
} from "../schemas/roast-battle-split";
import { ELEVENLABS_FLASH_VOICE } from "../constant";
import { PipelineLogger } from "./helper/pipelineLogger";
import { genAudioFast } from "../ai/elevenLabsReplicate";

export async function runLivePipeline(
  jobId: string,
  prompt = "Generate a roast battle between vegito and gogeta",
) {
  const liveState = createEmptyPreviewState();
  const logger = new PipelineLogger();
  logger.startTask("Init Pipeline & State");
  logger.endTask("Init Pipeline & State");

  // Run in background and print logger report when both complete
  Promise.allSettled([
    generateCharacterBundle({ prompt, liveState, logger }),
    generateRoundBundle({ prompt, liveState, logger }),
  ])
    .then(() => {
      logger.printReport(jobId);
    })
    .catch((err) => {
      console.error("Pipeline crashed:", err);
      logger.printReport(jobId);
    });
}

const generateCharacterBundle = async ({
  prompt,
  liveState,
  logger,
}: {
  prompt: string;
  liveState: LiveStateType;
  logger: PipelineLogger;
}) => {
  logger.startTask("Character Streaming Setup");
  const bundleScript = streamStructuredArray({
    prompt: getCharacterBundlePrompt(prompt),
    schema: CharacterBundleItemSchema,
  });
  logger.endTask("Character Streaming Setup");

  for await (const item of bundleScript) {
    const slotLogName = `Char ${item.slot === "character1" ? "1" : "2"} [${item.name}]`;

    // Measure image generation
    logger.startTask(`${slotLogName} Image Gen`);
    const characterSideImage = await genImageFast(item.imagePrompt);
    logger.endTask(`${slotLogName} Image Gen`);

    if (!characterSideImage) throw new Error("Failed to generate Image");

    if (!liveState.data.announcer.ready) {
      logger.startTask("Announcer Init & Audio Check");
      await emitAnnouncer({ liveState });
      logger.endTask("Announcer Init & Audio Check");
    }

    logger.startTask(`${slotLogName} State Emitted`);
    await stateUpdateAndEmit(liveState, (state) => {
      const charSlot = state.data.characterStats[item.slot];
      charSlot.ready = true;
      charSlot.name = item.name;
      charSlot.title = item.title;
      charSlot.imagePrompt = item.imagePrompt;
      charSlot.imageUrl = characterSideImage.url.toString(); // URL → string
      charSlot.stats = item.stats;
      charSlot.skills = item.skills;
      charSlot.durationFrames = 90;
    });
    logger.endTask(`${slotLogName} State Emitted`);
  }
};

const emitAnnouncer = async ({ liveState }: { liveState: LiveStateType }) => {
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
  logger,
}: {
  prompt: string;
  liveState: LiveStateType;
  logger: PipelineLogger;
}) => {
  logger.startTask("Rounds Streaming Setup");
  const roundScript = streamStructuredArray({
    prompt: getRoundsPrompt(prompt),
    schema: RoundSchema,
  });
  logger.endTask("Rounds Streaming Setup");

  let roundIndex = 0; // Track which round we are on sequentially

  const voiceRef = [...ELEVENLABS_FLASH_VOICE];

  const voiceIndex = Math.floor(Math.random() * voiceRef.length);
  const character1Voice = voiceRef[voiceIndex];

  voiceRef.splice(voiceIndex, 0);

  const character2Voice = voiceRef[Math.floor(Math.random() * voiceRef.length)];

  for await (const round of roundScript) {
    const voiceRef =
      round.attacker === "character1" ? character1Voice : character2Voice;

    const roundLogName = `Round ${roundIndex + 1}`;

    logger.startTask(`${roundLogName} Generation (Images+Audio)`);

    // Explicitly tracking EACH item inside the Promise.all
    const attackerPromise = (async () => {
      logger.startTask(`${roundLogName} attacker image`);
      const res = await genImageFast(round.attackerImagePrompt);
      logger.endTask(`${roundLogName} attacker image`);
      return res;
    })();

    const opponentPromise = (async () => {
      logger.startTask(`${roundLogName} opponent image`);
      const res = await genImageFast(round.opponentImagePrompt);
      logger.endTask(`${roundLogName} opponent image`);
      return res;
    })();

    const audioPromise = (async () => {
      logger.startTask(`${roundLogName} audio`);
      const res = await genAudioFast(round.dialogue, voiceRef);
      logger.endTask(`${roundLogName} audio`);
      return res;
    })();

    const [attackerImage, opponentImage, roundAudio] = await Promise.all([
      attackerPromise,
      opponentPromise,
      audioPromise,
    ]);
    logger.endTask(`${roundLogName} Generation (Images+Audio)`);

    if (!attackerImage || !opponentImage) throw new Error("Image failed");

    // We need string versions of the URLs (R2/Replicate returns URL objects)
    const attackerImageUrl = attackerImage.url.toString();
    const opponentImageUrl = opponentImage.url.toString();
    const audioUrl = roundAudio.url.toString();

    logger.startTask(`${roundLogName} Audio Duration Fetch`);
    // Calculate length of the video scene based on the audio length
    const audioDurationFrames = Math.ceil(
      (await getAudioDuration(audioUrl)) * 30,
    );
    logger.endTask(`${roundLogName} Audio Duration Fetch`);

    // Minimum 3 seconds (90 frames) so the user has time to read short dialogue
    const finalDurationFrames = Math.max(90, audioDurationFrames);

    const currentRoundIndex = roundIndex;
    roundIndex++; // Increment for the next loop

    logger.startTask(`${roundLogName} State Emitted`);
    await stateUpdateAndEmit(liveState, (state) => {
      const slot = state.data.rounds[currentRoundIndex]!;
      slot.attackingCharacter = round.attacker;
      slot.attackerImage = attackerImageUrl;
      slot.opponentProfile = opponentImageUrl;
      slot.dialogueAudio = audioUrl;
      slot.dialogueText = round.dialogue;
      slot.damage = round.damage;
      slot.durationFrames = finalDurationFrames;

      // We do NOT set slot.ready = true here!
      // The `evaluateReadiness` gatekeeper does that automatically at the end of `stateUpdateAndEmit`.
    });
    logger.endTask(`${roundLogName} State Emitted`);
  }
};
