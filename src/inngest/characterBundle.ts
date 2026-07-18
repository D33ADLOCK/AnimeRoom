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

  // Emit announcer + both character cards inside a step so each emit fires
  // exactly once. On replay the step is memoized (no re-emit, and the random
  // announcer audio is picked only once); liveState is restored from the
  // cached return below.
  const emittedState = await step.run("emit-character-cards", async () => {
    if (!liveState.data.announcer.ready) {
      await emitAnnouncer({ jobId, liveState });
    }

    await stateUpdateAndEmit(liveState, jobId, (state) => {
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

    await stateUpdateAndEmit(liveState, jobId, (state) => {
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

    return liveState;
  });

  // Restore liveState from cached return (on replay the step body didn't run)
  Object.assign(liveState.data, emittedState.data);

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
