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
  const roundScript = streamStructuredArray({
    prompt: getRoundsPrompt(prompt),
    schema: RoundSchema,
  });

  let roundIndex = 0;

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

  for await (const round of roundScript) {
    const voice =
      round.attacker === "character1" ? character1Voice : character2Voice;

    const cachedRound = await step.run(
      `round-${roundIndex}-assets`,
      async () => {
        const {
          attackerImageUrl,
          opponentImageUrl,
          audioUrl,
          audioDurationFrames,
        } = await generateRoundAssets(round, voice);

        // Return ALL data — cached and consistent on replay
        return {
          attackerImageUrl,
          opponentImageUrl,
          audioUrl,
          audioDurationFrames,
          attacker: round.attacker,
          dialogue: round.dialogue,
          damage: round.damage,
        };
      },
    );

    const currentRoundIndex = roundIndex;

    roundIndex++;

    await stateUpdateAndEmit(liveState, (state) => {
      const slot = state.data.rounds[currentRoundIndex]!;
      slot.attackingCharacter = cachedRound.attacker;
      slot.attackerImage = cachedRound.attackerImageUrl;
      slot.opponentProfile = cachedRound.opponentImageUrl;
      slot.dialogueAudio = cachedRound.audioUrl;
      slot.dialogueText = cachedRound.dialogue;
      slot.damage = cachedRound.damage;
      slot.durationFrames = cachedRound.audioDurationFrames;
    });

    r2Promise.push(
      saveToR2UsingUrl({
        url: cachedRound.attackerImageUrl,
        fileName: path.posix.join(
          jobId,
          "image",
          `round-${currentRoundIndex}-attacker.png`,
        ),
      }).then((r2Url) => ({
        key: `round-${currentRoundIndex}-attacker`,
        url: r2Url,
      })),
    );

    r2Promise.push(
      saveToR2UsingUrl({
        url: cachedRound.opponentImageUrl,
        fileName: path.posix.join(
          jobId,
          "image",
          `round-${currentRoundIndex}-opponent.png`,
        ),
      }).then((r2Url) => ({
        key: `round-${currentRoundIndex}-opponent`,
        url: r2Url,
      })),
    );

    r2Promise.push(
      saveToR2UsingUrl({
        url: cachedRound.audioUrl,
        fileName: path.posix.join(
          jobId,
          "audio",
          `round-${currentRoundIndex}.mp3`,
        ),
      }).then((r2Url) => ({
        key: `round-${currentRoundIndex}-audio`,
        url: r2Url,
      })),
    );
  }
};
