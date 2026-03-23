import z from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { randomUUID } from "crypto";
import { jobsTable } from "~/server/db/schema";
import { generateAndSaveAudio } from "~/lib/ai/audio";
import { inngest } from "~/inngest/client";

export const jobRouter = createTRPCRouter({
  // Mutate from server
  createJob: protectedProcedure
    .input(z.object({ prompt: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const jobId = randomUUID();

      const id = await ctx.db
        .insert(jobsTable)
        .values({
          userId: ctx.userId,
          id: jobId,
          prompt: input.prompt,
          jobStatus: "queued",
        })
        .returning({ jobId: jobsTable.id });

      await inngest.send({
        name: "job.created",
        data: {
          jobId,
          prompt: input.prompt,
          userId: ctx.userId,
        },
      });

      return id;
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
});
