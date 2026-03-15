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
import { getAudioDuration } from "../video/prepareVideoProps";
import { genImageFast } from "../ai/imageReplicate";
import { stateUpdateAndEmit } from "./helper/stateUpdateAndEmit";
import { streamStructuredArray } from "../ai/scriptStreaming";
import {
  CharacterBundleItemSchema,
  RoundSchema,
} from "../schemas/roast-battle-split";
import { DEFAULT_VOICE_REF } from "../constant";
import { genAudio } from "../ai/chatterbox";

export async function runLivePipeline(
  prompt = "Generate a roast battle between vegito and gogeta",
) {
  const liveState = createEmptyPreviewState();

  void generateCharacterBundle({ prompt, liveState });
  void generateRoundBundle({ prompt, liveState });
}

const generateCharacterBundle = async ({
  prompt,
  liveState,
}: {
  prompt: string;
  liveState: LiveStateType;
}) => {
  const bundleScript = streamStructuredArray({
    prompt: getCharacterBundlePrompt(prompt),
    schema: CharacterBundleItemSchema,
  });

  for await (const item of bundleScript) {
    // Generate Image
    const characterSideImage = await genImageFast(item.imagePrompt);

    if (!characterSideImage) throw new Error("Failed to genreate Image");

    if (!liveState.data.announcer.ready) {
      await emitAnnouncer({ liveState });
    }

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
}: {
  prompt: string;
  liveState: LiveStateType;
}) => {
  const roundScript = streamStructuredArray({
    prompt: getRoundsPrompt(prompt),
    schema: RoundSchema,
  });

  let roundIndex = 0; // Track which round we are on sequentially

  for await (const round of roundScript) {
    const voiceRef =
      round.attacker === "character1"
        ? DEFAULT_VOICE_REF.character1
        : DEFAULT_VOICE_REF.character2;

    const [attackerImage, opponentImage, roundAudio] = await Promise.all([
      genImageFast(round.attackerImagePrompt),
      genImageFast(round.opponentImagePrompt),
      genAudio(round.dialogue, voiceRef),
    ]);

    if (!attackerImage || !opponentImage) throw new Error("Image failed");

    // We need string versions of the URLs (R2/Replicate returns URL objects)
    const attackerImageUrl = attackerImage.url.toString();
    const opponentImageUrl = opponentImage.url.toString();
    const audioUrl = roundAudio.url.toString();

    // Calculate length of the video scene based on the audio length
    const audioDurationFrames = Math.ceil(
      (await getAudioDuration(audioUrl)) * 30,
    );
    // Minimum 3 seconds (90 frames) so the user has time to read short dialogue
    const finalDurationFrames = Math.max(90, audioDurationFrames);

    const currentRoundIndex = roundIndex;
    roundIndex++; // Increment for the next loop

    await stateUpdateAndEmit(liveState, (state) => {
      const slot = state.data.rounds[currentRoundIndex];
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
  }
};

// const generateMetaBundle = async ()
