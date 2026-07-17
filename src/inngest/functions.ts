import { createEmptyPreviewState } from "~/lib/pipeline/helper/createEmptyPreviewState";
import { inngest, jobCreated, type JobCreatedData } from "./client";
import { characterBundle } from "./characterBundle";
import { roundBundle } from "./roundBundle";
import { metaBundle } from "./metaBundle";
import { finalisePipeline } from "./finalisePipeline";
import { safeRealtimeChannelEmit } from "~/lib/realtime/safeRealtimeEmit";
import { COST_GUARDRAILS } from "~/server/guardrails/rateLimit";
import {
  failJobAndRefund,
  markJobGenerating,
  updateJobStage,
} from "~/server/jobs/jobLifecycle";

export const generateVideo = inngest.createFunction(
  {
    id: "generate-video",
    retries: 2,
    concurrency: COST_GUARDRAILS.generationConcurrency,
    cancelOn: [
      {
        event: "job.cancelled",
        match: "data.jobId",
      },
    ],
    triggers: [jobCreated],

    onFailure: async ({ event }) => {
      const failureData = event.data as {
        event: { data: JobCreatedData };
        error?: unknown;
      };

      const { jobId, userId } = failureData.event.data;
      const serializedError = failureData.error
        ? JSON.stringify(failureData.error)
        : null;
      const diagnostic =
        serializedError?.slice(0, 4_000) ??
        "Inngest generation pipeline exhausted retries.";

      const result = await failJobAndRefund({
        jobId,
        userId,
        safeError: "Something went wrong generating your video.",
        internalError: diagnostic,
        retryable: true,
      });

      if (result.transitioned) {
        await safeRealtimeChannelEmit(`job:${jobId}`, {
          type: "error",
          jobId,
          code: "ASSET_PIPELINE_CRASH",
          message:
            "Something went wrong generating your video. Please try again.",
        });
      }
    },
  },
  async ({ event, step }) => {
    const { jobId, prompt, userId } = event.data;

    const shouldContinue = await step.run("mark-job-generating", async () => {
      return markJobGenerating({ jobId, userId });
    });

    if (!shouldContinue) return;

    const liveState = createEmptyPreviewState();

    const r2Promise: Promise<{ key: string; url: string }>[] = [];

    await step.run("stage-characters", () =>
      updateJobStage({ jobId, userId, stage: "characters" }),
    );
    await characterBundle({
      prompt: prompt,
      liveState: liveState,
      r2Promise: r2Promise,
      jobId: jobId,
      step: step,
    });

    await step.run("stage-rounds", () =>
      updateJobStage({ jobId, userId, stage: "rounds" }),
    );
    await roundBundle({
      prompt,
      jobId,
      liveState,
      r2Promise,
      step,
    });

    await step.run("stage-metadata", () =>
      updateJobStage({ jobId, userId, stage: "metadata" }),
    );
    await metaBundle({ prompt, jobId, liveState, r2Promise, step });

    await step.run("stage-finalizing", () =>
      updateJobStage({ jobId, userId, stage: "finalizing" }),
    );

    await finalisePipeline({
      jobId,
      liveState,
      r2Promise,
      step,
      userId,
    });
  },
);
