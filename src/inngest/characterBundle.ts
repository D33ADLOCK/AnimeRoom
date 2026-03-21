import { genImageFast } from "~/lib/ai/imageReplicate";
import { streamStructuredArray } from "~/lib/ai/scriptStreaming";
import { CharacterBundleItemSchema } from "~/lib/schemas/roast-battle-split";
import { getCharacterBundlePrompt } from "~/lib/utils/userPrompt";
import { type inngest } from "./client";
import { type GetStepTools } from "inngest";
import type { LiveStateType } from "~/lib/pipeline/helper/createEmptyPreviewState";
import { emitAnnouncer } from "~/lib/pipeline/livePipeline";
import { stateUpdateAndEmit } from "~/lib/pipeline/helper/stateUpdateAndEmit";
import path from "path";
import { saveToR2UsingUrl } from "~/lib/storage/saveUsingUrl";

type Step = GetStepTools<typeof inngest>;

export const characterBundle = async ({
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
  const characterBundleScript = streamStructuredArray({
    prompt: getCharacterBundlePrompt(prompt),
    schema: CharacterBundleItemSchema,
  });

  for await (const item of characterBundleScript) {
    const cachedCharacter = await step.run(`${item.slot}-image`, async () => {
      const imageOutput = await genImageFast(item.imagePrompt);
      const imageUrl = imageOutput.url.toString();

      // Return ALL data needed downstream — cached and consistent on replay
      return {
        imageUrl,
        name: item.name,
        title: item.title,
        prompt: item.imagePrompt,
        slot: item.slot,
        stats: item.stats,
        skills: item.skills,
      };
    });

    if (!liveState.data.announcer.ready) {
      await emitAnnouncer({ liveState });
    }

    await stateUpdateAndEmit(liveState, (state) => {
      const charSlot = state.data.characterStats[cachedCharacter.slot];
      charSlot.ready = true;
      charSlot.name = cachedCharacter.name;
      charSlot.title = cachedCharacter.title;
      charSlot.imagePrompt = cachedCharacter.prompt;
      charSlot.imageUrl = cachedCharacter.imageUrl;
      charSlot.stats = cachedCharacter.stats;
      charSlot.skills = cachedCharacter.skills;
      charSlot.durationFrames = 120;
    });

    const fileName = path.posix.join(
      jobId,
      "image",
      cachedCharacter.name,
      "side.png",
    );

    r2Promise.push(
      saveToR2UsingUrl({
        url: cachedCharacter.imageUrl,
        fileName: fileName,
      }).then((r2Url) => ({
        key: `characterBundle-${cachedCharacter.slot}`,
        url: r2Url,
      })),
    );
  }
};
