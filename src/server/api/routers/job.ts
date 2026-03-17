import z from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { randomUUID } from "crypto";
import { generateScript } from "~/lib/ai/genScript";
import { jobsTable, usersAssetsTable } from "~/server/db/schema";
import { runPipeline, type PipelineReferences } from "~/lib/ai/pipeline";
import { getPresignedReadUrl } from "~/lib/storage/genPresignedUrl";
import {
  RoastBattleSchema,
  type RoastBattleSchemaType,
} from "~/lib/schemas/roast-battle";
import { and, eq } from "drizzle-orm";
import {
  prepareVideoProps,
  type PrepareVideoPropsType,
} from "~/lib/video/prepareVideoProps";
import { generateAndSaveAudio } from "~/lib/ai/audio";
import { getTempUrl } from "~/lib/storage/r2";
import { genImage, genImageFast } from "~/lib/ai/imageReplicate";
import { saveStreamToR2 } from "~/lib/storage/upload";
import path from "path";
import { TRPCError } from "@trpc/server";
import { runLivePipeline } from "~/lib/pipeline/livePipeline";

const VideoPropsInput: z.ZodType<PrepareVideoPropsType> = z.any();

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

      void runLivePipeline(jobId, input.prompt, ctx.userId);

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
});
