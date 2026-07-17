import z from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { randomUUID } from "crypto";
import { jobsTable } from "~/server/db/schema";
import { inngest } from "~/inngest/client";
import { grantCredits, spendCredtis } from "~/server/credits/creditHelper";
import { TRPCError } from "@trpc/server";
import {
  startVideoRender,
  getVideoRenderProgress,
} from "~/lib/remotionLambda/renderVideo";
import { and, eq, isNull, lt, or } from "drizzle-orm";
import { createJobSchema, jobIdSchema } from "~/lib/schemas/job";
import { enforceRateLimit } from "~/server/guardrails/rateLimit";

export const jobRouter = createTRPCRouter({
  // Mutate from server
  createJob: protectedProcedure
    .input(createJobSchema)
    .mutation(async ({ ctx, input }) => {
      const jobId = input.requestId;

      const existingJob = await ctx.db.query.jobsTable.findFirst({
        where: (t, { and, eq }) =>
          and(eq(t.id, jobId), eq(t.userId, ctx.userId)),
        columns: { id: true, prompt: true },
      });

      if (existingJob) {
        if (existingJob.prompt !== input.prompt) {
          throw new TRPCError({
            code: "CONFLICT",
            message:
              "This request ID was already used with a different prompt.",
          });
        }
        return { jobId: existingJob.id };
      }

      await enforceRateLimit({ action: "createJob", userId: ctx.userId });

      const [result] = await ctx.db.transaction(async (tx) => {
        const id = await tx
          .insert(jobsTable)
          .values({
            userId: ctx.userId,
            id: jobId,
            prompt: input.prompt,
            jobStatus: "queued",
          })
          .onConflictDoNothing({ target: jobsTable.id })
          .returning({ jobId: jobsTable.id });

        if (!id[0]) {
          const concurrent = await tx.query.jobsTable.findFirst({
            where: (t, { and, eq }) =>
              and(eq(t.id, jobId), eq(t.userId, ctx.userId)),
            columns: { id: true, prompt: true },
          });

          if (concurrent?.prompt !== input.prompt) {
            throw new TRPCError({
              code: "CONFLICT",
              message: "This request ID is already in use.",
            });
          }

          return [{ jobId: concurrent.id }];
        }

        await spendCredtis({
          tx,
          userId: ctx.userId,
          creditAmount: 1,
          metaData: { note: "job created" },
          transactionId: randomUUID(),
          sourceId: jobId,
          sourceType: "job",
        });

        return id;
      });

      if (!result) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create generation job.",
        });
      }

      try {
        await inngest.send({
          id: jobId,
          name: "job.created",
          data: {
            jobId,
            prompt: input.prompt,
            userId: ctx.userId,
          },
        });

        await ctx.db
          .update(jobsTable)
          .set({
            dispatchedAt: new Date(),
            dispatchError: null,
            error: null,
          })
          .where(eq(jobsTable.id, jobId));
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Unknown Inngest dispatch error";

        await ctx.db.transaction(async (tx) => {
          const [job] = await tx
            .update(jobsTable)
            .set({
              jobStatus: "failed",
              dispatchError: message,
              error: "Failed to start video generation.",
            })
            .where(eq(jobsTable.id, jobId))
            .returning({
              id: jobsTable.id,
              userId: jobsTable.userId,
              creditCost: jobsTable.creditCost,
            });

          if (!job) return;

          await grantCredits({
            tx,
            userId: job.userId,
            creditAmount: job.creditCost,
            eventType: "job_refund",
            metaData: { note: `Refund for job dispatch failed: ${job.id}` },
            sourceId: `${job.id}_dispatch_refund`,
            sourceType: "job",
            transactionId: randomUUID(),
          });
        });

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            "We could not start video generation. Your credit has been refunded. Please try again.",
        });
      }

      return result;
    }),

  getManifest: protectedProcedure
    .input(z.object({ jobId: jobIdSchema }))
    .query(async ({ ctx, input }) => {
      const videoManifest = await ctx.db.query.jobsTable.findFirst({
        where: (t, { eq, and }) =>
          and(
            eq(t.id, input.jobId),
            eq(t.userId, ctx.userId),
            eq(t.jobStatus, "complete"),
          ),
        columns: { videoManifest: true },
      });

      const vp = videoManifest?.videoManifest;
      if (!vp) return null;

      return vp;
    }),

  getMyVideos: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db.query.jobsTable.findMany({
      where: (t, { eq, and }) =>
        and(eq(t.userId, ctx.userId), eq(t.jobStatus, "complete")),
      columns: {
        id: true,
        createdAt: true,
        metaData: true,
        visibility: true,
      },
      orderBy: (t, { desc }) => desc(t.createdAt),
    });
  }),

  getDiscoverVideos: publicProcedure.query(async ({ ctx }) => {
    return await ctx.db.query.jobsTable.findMany({
      where: (t, { eq, and }) =>
        and(eq(t.jobStatus, "complete"), eq(t.visibility, "published")),
      columns: {
        id: true,
        createdAt: true,
        metaData: true,
      },
      orderBy: (t, { desc }) => desc(t.createdAt),
    });
  }),

  getPublicManifest: publicProcedure
    .input(z.object({ jobId: jobIdSchema }))
    .query(async ({ ctx, input }) => {
      const videoManifest = await ctx.db.query.jobsTable.findFirst({
        where: (t, { eq, and }) =>
          and(
            eq(t.id, input.jobId),
            eq(t.jobStatus, "complete"),
            eq(t.visibility, "published"),
          ),
        columns: { videoManifest: true },
      });

      return videoManifest?.videoManifest ?? null;
    }),

  setVisibility: protectedProcedure
    .input(
      z.object({
        jobId: jobIdSchema,
        visibility: z.enum(["private", "published"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [job] = await ctx.db
        .update(jobsTable)
        .set({ visibility: input.visibility })
        .where(
          and(
            eq(jobsTable.id, input.jobId),
            eq(jobsTable.userId, ctx.userId),
            eq(jobsTable.jobStatus, "complete"),
          ),
        )
        .returning({
          id: jobsTable.id,
          visibility: jobsTable.visibility,
        });

      if (!job) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return job;
    }),

  startExport: protectedProcedure
    .input(z.object({ jobId: jobIdSchema }))
    .mutation(async ({ ctx, input }) => {
      await enforceRateLimit({ action: "export", userId: ctx.userId });

      const [job] = await ctx.db
        .update(jobsTable)
        .set({
          renderStatus: "starting",
          renderId: null,
          bucketName: null,
          videoUrl: null,
        })
        .where(
          and(
            eq(jobsTable.id, input.jobId),
            eq(jobsTable.userId, ctx.userId),
            eq(jobsTable.jobStatus, "complete"),
            or(
              isNull(jobsTable.renderStatus),
              eq(jobsTable.renderStatus, "failed"),
              and(
                eq(jobsTable.renderStatus, "starting"),
                lt(jobsTable.updatedAt, new Date(Date.now() - 15 * 60 * 1_000)),
              ),
            ),
          ),
        )
        .returning({
          videoManifest: jobsTable.videoManifest,
          id: jobsTable.id,
        });

      if (!job) {
        const existing = await ctx.db.query.jobsTable.findFirst({
          where: (t, { and, eq }) =>
            and(
              eq(t.id, input.jobId),
              eq(t.userId, ctx.userId),
              eq(t.jobStatus, "complete"),
            ),
          columns: {
            renderId: true,
            renderStatus: true,
            videoUrl: true,
          },
        });

        if (!existing)
          throw new TRPCError({ code: "NOT_FOUND", message: "Job not found" });

        return { render: existing };
      }

      if (!job.videoManifest) {
        await ctx.db
          .update(jobsTable)
          .set({ renderStatus: "failed" })
          .where(
            and(
              eq(jobsTable.id, job.id),
              eq(jobsTable.userId, ctx.userId),
              eq(jobsTable.renderStatus, "starting"),
            ),
          );
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Please wait for the video to complete",
        });
      }

      try {
        const { renderId, bucketName } = await startVideoRender({
          finalJobState: job.videoManifest,
          jobId: job.id,
        });

        const [render] = await ctx.db
          .update(jobsTable)
          .set({ renderId, bucketName, renderStatus: "rendering" })
          .where(
            and(
              eq(jobsTable.id, job.id),
              eq(jobsTable.userId, ctx.userId),
              eq(jobsTable.renderStatus, "starting"),
            ),
          )
          .returning({
            renderId: jobsTable.renderId,
            renderStatus: jobsTable.renderStatus,
          });

        if (!render) throw new Error("Export claim was lost");

        return { render };
      } catch (error) {
        await ctx.db
          .update(jobsTable)
          .set({ renderStatus: "failed" })
          .where(
            and(
              eq(jobsTable.id, job.id),
              eq(jobsTable.userId, ctx.userId),
              eq(jobsTable.renderStatus, "starting"),
            ),
          );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to start export. Please try again.",
          cause: error,
        });
      }
    }),

  getExportProgress: protectedProcedure
    .input(z.object({ jobId: jobIdSchema }))
    .query(async ({ ctx, input }) => {
      const job = await ctx.db.query.jobsTable.findFirst({
        where: (t, { and, eq }) =>
          and(eq(t.id, input.jobId), eq(t.userId, ctx.userId)),
        columns: {
          renderId: true,
          bucketName: true,
          renderStatus: true,
          videoUrl: true,
        },
      });

      if (!job)
        throw new TRPCError({ code: "NOT_FOUND", message: "Job not found" });

      if (job.renderStatus === "completed" && job.videoUrl)
        return { done: true, overallProgress: 1, videoUrl: job.videoUrl };

      if (job.renderStatus === "failed")
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Render failed",
        });

      if (job.renderStatus === "starting") {
        return { done: false, overallProgress: 0, videoUrl: null };
      }

      if (!job.renderId || !job.bucketName)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Export has not been started",
        });

      const progress = await getVideoRenderProgress({
        renderId: job.renderId,
        bucketName: job.bucketName,
      });

      if (progress.fatalErrorEncountered) {
        await ctx.db
          .update(jobsTable)
          .set({ renderStatus: "failed" })
          .where(eq(jobsTable.id, input.jobId));

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Render failed",
        });
      }

      if (progress.done && progress.outputFile) {
        await ctx.db
          .update(jobsTable)
          .set({ renderStatus: "completed", videoUrl: progress.outputFile })
          .where(eq(jobsTable.id, input.jobId));

        return {
          done: true,
          overallProgress: 1,
          videoUrl: progress.outputFile,
        };
      }

      return {
        done: false,
        overallProgress: progress.overallProgress,
        videoUrl: null,
      };
    }),
});
