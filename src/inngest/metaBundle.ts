import type { GetStepTools } from "inngest";
import type { LiveStateType } from "~/lib/pipeline/helper/createEmptyPreviewState";
import type { inngest } from "./client";
import { generateScript } from "~/lib/ai/genScript";
import { getMetadataPrompt } from "~/lib/utils/userPrompt";
import { RoastBattleMetadataSchema } from "~/lib/schemas/roast-battle-split";
import { stateUpdateAndEmit } from "~/lib/pipeline/helper/stateUpdateAndEmit";
import { genImageFast } from "~/lib/ai/imageReplicate";
import path from "path";
import { saveToR2UsingUrl } from "~/lib/storage/saveUsingUrl";

type Step = GetStepTools<typeof inngest>;

export const metaBundle = async ({
  prompt,
  liveState,
  jobId,
  r2Promise,
  step,
}: {
  prompt: string;
  liveState: LiveStateType;
  jobId: string;
  r2Promise: Promise<{ key: string; url: string }>[];
  step: Step;
}) => {
  const { battleTitle, shortSubtitle, thumbnailTempUrl } = await step.run(
    "character-meta",
    async () => {
      const meta = await generateScript(
        getMetadataPrompt(prompt),
        RoastBattleMetadataSchema,
      );

      const thumbnailImage = await genImageFast(meta.thumbnailPrompt);

      const thumbnailTempUrl = thumbnailImage.url.toString();

      return {
        battleTitle: meta.battleTitle,
        shortSubtitle: meta.shortSubtitle,
        thumbnailTempUrl,
      };
    },
  );

  // Emit title + subtitle immediately (no thumbnail yet)
  await stateUpdateAndEmit(liveState, jobId, (state) => {
    state.data.meta.battleTitle = battleTitle;
    state.data.meta.shortSubtitle = shortSubtitle;
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
