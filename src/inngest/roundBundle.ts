import type { LiveStateType } from "~/lib/pipeline/helper/createEmptyPreviewState";
import type { inngest } from "./client";
import type { GetStepTools } from "inngest";
import { streamStructuredArray } from "~/lib/ai/scriptStreaming";
import { getRoundsPrompt } from "~/lib/utils/userPrompt";
import { RoundSchema } from "~/lib/schemas/roast-battle-split";
import { stateUpdateAndEmit } from "~/lib/pipeline/helper/stateUpdateAndEmit";
import { ELEVENLABS_FLASH_VOICE } from "~/lib/constant";
import { generateRoundAssets } from "~/lib/pipeline/generateRoundAssets";
import { saveToR2UsingUrl } from "~/lib/storage/saveUsingUrl";
import path from "path";
import { genAudioFast } from "~/lib/ai/elevenLabsReplicate";
import { getAudioDuration } from "~/lib/audio/getAudioDuration";

type Step = GetStepTools<typeof inngest>;

export const roundBundle = async ({
  prompt,
  step,
  liveState,
  r2Promise,
  jobId,
}: {
  prompt: string;
  step: Step;
  liveState: LiveStateType;
  r2Promise: Promise<{ key: string; url: string }>[];
  jobId: string;
}) => {
  const { character1Voice, character2Voice } = await step.run(
    "assign-voices",
    async () => {
      const character1Index = Math.floor(
        Math.random() * ELEVENLABS_FLASH_VOICE.length,
      );

      let character2Index = Math.floor(
        Math.random() * ELEVENLABS_FLASH_VOICE.length,
      );

      while (character2Index === character1Index) {
        character2Index = Math.floor(
          Math.random() * ELEVENLABS_FLASH_VOICE.length,
        );
      }

      const character1Voice = ELEVENLABS_FLASH_VOICE[character1Index]!;
      const character2Voice = ELEVENLABS_FLASH_VOICE[character2Index]!;

      return { character1Voice, character2Voice };
    },
  );

  const roundResults = await step.run("generate-rounds", async () => {
    const roundScript = streamStructuredArray({
      prompt: getRoundsPrompt(prompt),
      schema: RoundSchema,
    });

    let roundIndex = 0;

    // Cache images per character+role so we only generate each once
    const imageCache: Record<string, string> = {};

    for await (const round of roundScript) {
      if (roundIndex >= liveState.data.rounds.length) {
        throw new Error("Generation returned more than six rounds");
      }
      const voice =
        round.attacker === "character1" ? character1Voice : character2Voice;
      const opponent =
        round.attacker === "character1" ? "character2" : "character1";

      const attackerCacheKey = `${round.attacker}-attacker`;
      const opponentCacheKey = `${opponent}-opponent`;

      const needsAttackerImage = !imageCache[attackerCacheKey];
      const needsOpponentImage = !imageCache[opponentCacheKey];

      let attackerImageUrl: string;
      let opponentImageUrl: string;
      let audioUrl: string;
      let audioDurationFrames: number;

      if (needsAttackerImage || needsOpponentImage) {
        // First time seeing this character+role combo — generate everything
        const assets = await generateRoundAssets(round, voice);
        attackerImageUrl = assets.attackerImageUrl;
        opponentImageUrl = assets.opponentImageUrl;
        audioUrl = assets.audioUrl;
        audioDurationFrames = assets.audioDurationFrames;

        // Cache newly generated images
        if (needsAttackerImage) imageCache[attackerCacheKey] = attackerImageUrl;
        if (needsOpponentImage) imageCache[opponentCacheKey] = opponentImageUrl;
      } else {
        // Both images cached — only generate audio
        attackerImageUrl = imageCache[attackerCacheKey]!;
        opponentImageUrl = imageCache[opponentCacheKey]!;

        const roundAudio = await genAudioFast(round.dialogue, voice);
        audioUrl = roundAudio.url.toString();
        audioDurationFrames = Math.ceil(
          (await getAudioDuration(audioUrl)) * 40,
        );
      }

      // Real-time emission — browser sees rounds appear during first execution
      await stateUpdateAndEmit(liveState, jobId, (state) => {
        const slot = state.data.rounds[roundIndex]!;
        slot.attackingCharacter = round.attacker;
        slot.attackerImage = attackerImageUrl;
        slot.opponentProfile = opponentImageUrl;
        slot.dialogueAudio = audioUrl;
        slot.dialogueText = round.dialogue;
        slot.damage = round.damage;
        slot.durationFrames = audioDurationFrames;
      });

      roundIndex++;
    }

    if (roundIndex !== liveState.data.rounds.length) {
      throw new Error(
        `Generation returned ${roundIndex} rounds; exactly six are required`,
      );
    }

    // Return both liveState and round data for R2 — cached on replay
    return {
      liveState,
      rounds: liveState.data.rounds,
    };
  });

  // Outside the step — runs on every replay using cached data

  // Restore liveState from cached return (on replay the step body didn't run,
  // so liveState is still empty — this fills it back in)
  Object.assign(liveState.data, roundResults.liveState.data);

  // Create R2 upload promises from cached URLs
  for (let i = 0; i < roundResults.rounds.length; i++) {
    const round = roundResults.rounds[i]!;
    if (!round.attackerImage) continue; // skip empty rounds

    r2Promise.push(
      saveToR2UsingUrl({
        url: round.attackerImage,
        fileName: path.posix.join(jobId, "image", `round-${i}-attacker.png`),
      }).then((r2Url) => ({
        key: `round-${i}-attacker`,
        url: r2Url,
      })),
    );

    r2Promise.push(
      saveToR2UsingUrl({
        url: round.opponentProfile!,
        fileName: path.posix.join(jobId, "image", `round-${i}-opponent.png`),
      }).then((r2Url) => ({
        key: `round-${i}-opponent`,
        url: r2Url,
      })),
    );

    r2Promise.push(
      saveToR2UsingUrl({
        url: round.dialogueAudio!,
        fileName: path.posix.join(jobId, "audio", `round-${i}.mp3`),
      }).then((r2Url) => ({
        key: `round-${i}-audio`,
        url: r2Url,
      })),
    );
  }
};
