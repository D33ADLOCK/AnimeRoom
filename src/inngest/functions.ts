import { createEmptyPreviewState } from "~/lib/pipeline/helper/createEmptyPreviewState";
import { inngest, jobCreated } from "./client";
import { streamStructuredArray } from "~/lib/ai/scriptStreaming";
import {
  getCharacterBundlePrompt,
  getRoundsPrompt,
} from "~/lib/utils/userPrompt";
import {
  CharacterBundleItemSchema,
  RoundSchema,
} from "~/lib/schemas/roast-battle-split";
import { genImageFast } from "~/lib/ai/imageReplicate";
import { emitAnnouncer } from "~/lib/pipeline/livePipeline";
import { stateUpdateAndEmit } from "~/lib/pipeline/helper/stateUpdateAndEmit";
import { saveToR2UsingUrl } from "~/lib/storage/saveUsingUrl";
import path from "path";
import { ELEVENLABS_FLASH_VOICE } from "~/lib/constant";
import { generateRoundAssets } from "~/lib/pipeline/generateRoundAssets";
import { characterBundle } from "./characterBundle";
import { roundBundle } from "./roundBundle";
import { metaBundle } from "./metaBundle";

export const helloWorld = inngest.createFunction(
  {
    id: "generate-video",
    retries: 2,
    cancelOn: [
      {
        event: "job.cancelled",
        match: "data.jobId",
      },
    ],
    triggers: [jobCreated],
  },
  async ({ event, step }) => {
    const { jobId, prompt, userId } = event.data;

    const liveState = createEmptyPreviewState();

    const r2Promise: Promise<{ key: string; url: string }>[] = [];

    // Character Bundle
    await characterBundle({
      prompt: prompt,
      liveState: liveState,
      r2Promise: r2Promise,
      jobId: jobId,
      step: step,
    });

    // Rounds Script
    await roundBundle({
      prompt,
      jobId,
      liveState,
      r2Promise,
      step,
    });

    const { battleTitle, shortSubtitle, thumbnailPrompt, thumbnailTempUrl } =
      await metaBundle({ prompt, jobId, liveState, r2Promise, step });
  },
);
