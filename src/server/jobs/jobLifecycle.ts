import { randomUUID } from "crypto";
import { and, eq } from "drizzle-orm";
import type { LiveStateType } from "~/lib/pipeline/helper/createEmptyPreviewState";
import { grantCredits } from "~/server/credits/creditHelper";
import { db } from "~/server/db";
import { jobsTable } from "~/server/db/schema";
import { terminalRefundSourceId } from "./jobTransitions";

export async function markJobGenerating({
  jobId,
  userId,
}: {
  jobId: string;
  userId: string;
}) {
  const [job] = await db
    .update(jobsTable)
    .set({
      jobStatus: "generating",
      currentStage: "generating",
      generatingAt: new Date(),
      safeError: null,
      internalError: null,
      retryable: false,
    })
    .where(
      and(
        eq(jobsTable.id, jobId),
        eq(jobsTable.userId, userId),
        eq(jobsTable.jobStatus, "queued"),
      ),
    )
    .returning({ status: jobsTable.jobStatus });

  return job?.status === "generating";
}

export async function updateJobStage({
  jobId,
  userId,
  stage,
}: {
  jobId: string;
  userId: string;
  stage: string;
}) {
  const [job] = await db
    .update(jobsTable)
    .set({ currentStage: stage })
    .where(
      and(
        eq(jobsTable.id, jobId),
        eq(jobsTable.userId, userId),
        eq(jobsTable.jobStatus, "generating"),
      ),
    )
    .returning({ id: jobsTable.id });

  return Boolean(job);
}

export async function completeJob({
  jobId,
  userId,
  manifest,
}: {
  jobId: string;
  userId: string;
  manifest: LiveStateType;
}) {
  const [job] = await db
    .update(jobsTable)
    .set({
      videoManifest: manifest,
      metaData: {
        battleTitle: manifest.data.meta.battleTitle,
        shortSubtitle: manifest.data.meta.shortSubtitle,
        thumbnailUrl: manifest.data.meta.thumbnailUrl!,
      },
      jobStatus: "complete",
      currentStage: "complete",
      completedAt: new Date(),
      safeError: null,
      internalError: null,
      retryable: false,
    })
    .where(
      and(
        eq(jobsTable.id, jobId),
        eq(jobsTable.userId, userId),
        eq(jobsTable.jobStatus, "generating"),
      ),
    )
    .returning({ id: jobsTable.id });

  return Boolean(job);
}

export async function failJobAndRefund({
  jobId,
  userId,
  safeError,
  internalError,
  retryable = true,
}: {
  jobId: string;
  userId: string;
  safeError: string;
  internalError: string;
  retryable?: boolean;
}) {
  return db.transaction(async (tx) => {
    const [job] = await tx
      .update(jobsTable)
      .set({
        jobStatus: "failed",
        currentStage: "failed",
        safeError,
        internalError,
        retryable,
        failedAt: new Date(),
        error: safeError,
      })
      .where(
        and(
          eq(jobsTable.id, jobId),
          eq(jobsTable.userId, userId),
          eq(jobsTable.jobStatus, "queued"),
        ),
      )
      .returning({
        id: jobsTable.id,
        userId: jobsTable.userId,
        creditCost: jobsTable.creditCost,
      });

    const generatingJob =
      job ??
      (
        await tx
          .update(jobsTable)
          .set({
            jobStatus: "failed",
            currentStage: "failed",
            safeError,
            internalError,
            retryable,
            failedAt: new Date(),
            error: safeError,
          })
          .where(
            and(
              eq(jobsTable.id, jobId),
              eq(jobsTable.userId, userId),
              eq(jobsTable.jobStatus, "generating"),
            ),
          )
          .returning({
            id: jobsTable.id,
            userId: jobsTable.userId,
            creditCost: jobsTable.creditCost,
          })
      )[0];

    if (!generatingJob) return { transitioned: false, refunded: false };

    await grantCredits({
      tx,
      userId: generatingJob.userId,
      creditAmount: generatingJob.creditCost,
      eventType: "job_refund",
      metaData: { note: `Terminal refund for job: ${generatingJob.id}` },
      sourceId: terminalRefundSourceId(generatingJob.id),
      sourceType: "job",
      transactionId: randomUUID(),
    });

    await tx
      .update(jobsTable)
      .set({ refundedAt: new Date() })
      .where(
        and(
          eq(jobsTable.id, generatingJob.id),
          eq(jobsTable.jobStatus, "failed"),
        ),
      );

    return { transitioned: true, refunded: true };
  });
}
