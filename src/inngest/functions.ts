import { createEmptyPreviewState } from "~/lib/pipeline/helper/createEmptyPreviewState";
import { inngest, jobCreated, type JobCreatedData } from "./client";
import { characterBundle } from "./characterBundle";
import { roundBundle } from "./roundBundle";
import { metaBundle } from "./metaBundle";
import { finalisePipeline } from "./finalisePipeline";
import { db } from "~/server/db";
import { realtime } from "~/lib/redis/realtime";
import { jobsTable } from "~/server/db/schema";
import { and, eq } from "drizzle-orm";

export const generateVideo = inngest.createFunction(
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

    onFailure: async ({ event }) => {
      const originalEvent = event.data.event as {
        data: JobCreatedData;
      };

      const { jobId, userId } = originalEvent.data;

      await db
        .update(jobsTable)
        .set({ jobStatus: "failed" })
        .where(and(eq(jobsTable.id, jobId), eq(jobsTable.userId, userId)));

      await realtime.emit("pipeline-events", {
        type: "error",
        code: "ASSET_PIPELINE_CRASH",
        message:
          "Something went wrong generating your video. Please try again.",
      });
    },
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

    await metaBundle({ prompt, jobId, liveState, r2Promise, step });

    await finalisePipeline({
      jobId,
      liveState,
      r2Promise,
      step,
      userId,
    });
  },
);
