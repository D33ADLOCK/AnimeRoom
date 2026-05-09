import z from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { randomUUID } from "crypto";
import { jobsTable } from "~/server/db/schema";
import { generateAndSaveAudio } from "~/lib/ai/audio";
import { inngest } from "~/inngest/client";
import { spendCredtis } from "~/server/credits/creditHelper";
import { TRPCError } from "@trpc/server";
import {
  startVideoRender,
  getVideoRenderProgress,
} from "~/lib/remotionLambda/renderVideo";
import { eq } from "drizzle-orm";

export const jobRouter = createTRPCRouter({
  // Mutate from server
  createJob: protectedProcedure
    .input(z.object({ prompt: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const jobId = randomUUID();

      const [result] = await ctx.db.transaction(async (tx) => {
        const id = await tx
          .insert(jobsTable)
          .values({
            userId: ctx.userId,
            id: jobId,
            prompt: input.prompt,
            jobStatus: "queued",
          })
          .returning({ jobId: jobsTable.id });

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

      await inngest.send({
        name: "job.created",
        data: {
          jobId,
          prompt: input.prompt,
          userId: ctx.userId,
        },
      });

      return result;
    }),

  getManifest: protectedProcedure
    .input(z.object({ jobId: z.string() }))
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

  regenerateAudio: protectedProcedure
    .input(
      z.object({
        jobId: z.string(),
        dialogue: z.string(),
        voiceId: z.string(),
        name: z.string(),
        index: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.query.jobsTable.findFirst({
        where: (t, { eq, and }) =>
          and(eq(t.id, input.jobId), eq(t.userId, ctx.userId)),
        columns: { id: true },
      });

      if (!result) throw new Error("Unauthorised user");

      const audio = await generateAndSaveAudio(
        input.index,
        input.name,
        input.voiceId,
        input.dialogue,
        input.jobId,
      );

      if (!audio) throw new Error("Failed to Generate Audio");

      return audio;
    }),

  getMyVideos: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db.query.jobsTable.findMany({
      where: (t, { eq, and }) =>
        and(eq(t.userId, ctx.userId), eq(t.jobStatus, "complete")),
      columns: {
        id: true,
        createdAt: true,
        metaData: true,
      },
      orderBy: (t, { desc }) => desc(t.createdAt),
    });
  }),

  getDiscoverVideos: publicProcedure.query(async ({ ctx }) => {
    return await ctx.db.query.jobsTable.findMany({
      where: (t, { eq }) => eq(t.jobStatus, "complete"),
      columns: {
        id: true,
        createdAt: true,
        metaData: true,
      },
      orderBy: (t, { desc }) => desc(t.createdAt),
    });
  }),

  getPublicManifest: publicProcedure
    .input(z.object({ jobId: z.string() }))
    .query(async ({ ctx, input }) => {
      const videoManifest = await ctx.db.query.jobsTable.findFirst({
        where: (t, { eq, and }) =>
          and(eq(t.id, input.jobId), eq(t.jobStatus, "complete")),
        columns: { videoManifest: true },
      });

      return videoManifest?.videoManifest ?? null;
    }),

  startExport: protectedProcedure
    .input(z.object({ jobId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const job = await ctx.db.query.jobsTable.findFirst({
        where: (t, { and, eq }) =>
          and(
            eq(t.id, input.jobId),
            eq(t.userId, ctx.userId),
            eq(t.jobStatus, "complete"),
          ),
        columns: { videoManifest: true, id: true },
      });

      if (!job)
        throw new TRPCError({ code: "NOT_FOUND", message: "Job not found" });

      if (!job.videoManifest)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Please wait for the video to complete",
        });

      const { renderId, bucketName } = await startVideoRender({
        finalJobState: job.videoManifest,
        jobId: job.id,
      });

      const [render] = await ctx.db
        .update(jobsTable)
        .set({
          renderId,
          bucketName,
          renderStatus: "rendering",
        })
        .where(eq(jobsTable.id, job.id))
        .returning({
          renderId: jobsTable.renderId,
          renderStatus: jobsTable.renderStatus,
        });

      if (!render)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to updated the render status",
        });

      return { render };
    }),

  getExportProgress: protectedProcedure
    .input(z.object({ jobId: z.string() }))
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
