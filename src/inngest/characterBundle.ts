import { genImageFast } from "~/lib/ai/imageReplicate";
import { RoastBattleCharacterSchema } from "~/lib/schemas/roast-battle-split";
import { getCharacterBundlePrompt } from "~/lib/utils/userPrompt";
import { type inngest } from "./client";
import { type GetStepTools } from "inngest";
import type { LiveStateType } from "~/lib/pipeline/helper/createEmptyPreviewState";
import { emitAnnouncer } from "~/lib/pipeline/helper/emitAnnouncer";
import { stateUpdateAndEmit } from "~/lib/pipeline/helper/stateUpdateAndEmit";
import path from "path";
import { saveToR2UsingUrl } from "~/lib/storage/saveUsingUrl";
import { generateScript } from "~/lib/ai/genScript";

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
  // Step 1: Generate character script (cached — never re-runs on replay)
  const characters = await step.run("generate-character-script", async () => {
    const script = await generateScript(
      getCharacterBundlePrompt(prompt),
      RoastBattleCharacterSchema,
    );

    // Return the full array — always exactly 2 characters
    return script;
  });

  // Step 2: Generate BOTH images in parallel (one step, one invocation)
  const characterImages = await step.run(
    "generate-character-images",
    async () => {
      const [image1, image2] = await Promise.all([
        genImageFast(characters[0]!.imagePrompt),
        genImageFast(characters[1]!.imagePrompt),
      ]);

      return {
        character1: {
          imageUrl: image1.url.toString(),
          ...characters[0]!,
        },
        character2: {
          imageUrl: image2.url.toString(),
          ...characters[1]!,
        },
      };
    },
  );

  // Emit announcer first (not a step — just a quick state update)
  if (!liveState.data.announcer.ready) {
    await emitAnnouncer({ liveState });
  }

  // Emit character1 state
  await stateUpdateAndEmit(liveState, (state) => {
    const char1 = state.data.characterStats.character1;
    char1.ready = true;
    char1.name = characterImages.character1.name;
    char1.title = characterImages.character1.title;
    char1.imagePrompt = characterImages.character1.imagePrompt;
    char1.imageUrl = characterImages.character1.imageUrl;
    char1.stats = characterImages.character1.stats;
    char1.skills = characterImages.character1.skills;
    char1.durationFrames = 120;
  });

  // Emit character2 state
  await stateUpdateAndEmit(liveState, (state) => {
    const char2 = state.data.characterStats.character2;
    char2.ready = true;
    char2.name = characterImages.character2.name;
    char2.title = characterImages.character2.title;
    char2.imagePrompt = characterImages.character2.imagePrompt;
    char2.imageUrl = characterImages.character2.imageUrl;
    char2.stats = characterImages.character2.stats;
    char2.skills = characterImages.character2.skills;
    char2.durationFrames = 120;
  });

  // Queue R2 uploads in background
  r2Promise.push(
    saveToR2UsingUrl({
      url: characterImages.character1.imageUrl,
      fileName: path.posix.join(
        jobId,
        "image",
        characterImages.character1.name,
        "side.png",
      ),
    }).then((r2Url) => ({
      key: "characterBundle-character1",
      url: r2Url,
    })),
  );

  r2Promise.push(
    saveToR2UsingUrl({
      url: characterImages.character2.imageUrl,
      fileName: path.posix.join(
        jobId,
        "image",
        characterImages.character2.name,
        "side.png",
      ),
    }).then((r2Url) => ({
      key: "characterBundle-character2",
      url: r2Url,
    })),
  );
};
