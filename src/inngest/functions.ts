import { createEmptyPreviewState } from "~/lib/pipeline/helper/createEmptyPreviewState";
import { inngest, jobCreated, type JobCreatedData } from "./client";
import { characterBundle } from "./characterBundle";
import { roundBundle } from "./roundBundle";
import { metaBundle } from "./metaBundle";
import { finalisePipeline } from "./finalisePipeline";
import { db } from "~/server/db";
import { jobsTable } from "~/server/db/schema";
import { and, eq } from "drizzle-orm";
import { grantCredits } from "~/server/credits/creditHelper";
import { randomUUID } from "crypto";
import { safeRealtimeEmit } from "~/lib/realtime/safeRealtimeEmit";

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

      await db.transaction(async (tx) => {
        const [job] = await tx
          .update(jobsTable)
          .set({ jobStatus: "failed" })
          .where(and(eq(jobsTable.id, jobId), eq(jobsTable.userId, userId)))
          .returning({ creditCost: jobsTable.creditCost, id: jobsTable.id });

        await grantCredits({
          tx,
          creditAmount: job!.creditCost ?? 1,
          eventType: "job_refund",
          sourceId: `${job!.id}_refund`,
          sourceType: "job",
          transactionId: randomUUID(),
          metaData: { note: `Refund for job failed: ${job!.id}` },
          userId: userId,
        });
      });

      await safeRealtimeEmit({
        type: "error",
        code: "ASSET_PIPELINE_CRASH",
        message:
          "Something went wrong generating your video. Please try again.",
      });
    },
  },
  async ({ event, step }) => {
    const { jobId, prompt, userId } = event.data;

    const shouldContinue = await step.run("mark-job-generating", async () => {
      const [job] = await db
        .update(jobsTable)
        .set({ jobStatus: "generating" })
        .where(
          and(
            eq(jobsTable.id, jobId),
            eq(jobsTable.userId, userId),
            eq(jobsTable.jobStatus, "queued"),
          ),
        )
        .returning({ jobStatus: jobsTable.jobStatus });

      return job?.jobStatus === "generating";
    });

    if (!shouldContinue) return;

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
