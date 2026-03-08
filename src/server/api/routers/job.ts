import z from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { randomUUID } from "crypto";
import { generateScript } from "~/lib/ai/grok";
import { jobsTable, usersAssetsTable } from "~/server/db/schema";
import { runPipeline, type PipelineReferences } from "~/lib/ai/pipeline";
import { getPresignedReadUrl } from "~/lib/storage/genPresignedUrl";
import type { RoastBattleSchemaType } from "~/lib/schemas/roast-battle";
import { and, eq } from "drizzle-orm";
import {
  prepareVideoProps,
  type PrepareVideoPropsType,
} from "~/lib/video/prepareVideoProps";
import { generateAndSaveAudio } from "~/lib/ai/audio";
import { getTempUrl } from "~/lib/storage/r2";
import { genImage } from "~/lib/ai/imageReplicate";
import { saveStreamToR2 } from "~/lib/storage/upload";
import path from "path";
import { TRPCError } from "@trpc/server";

const VideoPropsInput: z.ZodType<PrepareVideoPropsType> = z.any();

export const jobRouter = createTRPCRouter({
  // Mutate from server
  createJob: protectedProcedure
    .input(z.object({ prompt: z.string() }))
    .mutation(async ({ ctx, input }) => {
      console.log("Trpc Called");
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

      return id;
    }),

  generateScript: protectedProcedure
    .input(z.object({ jobId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const job = await ctx.db.query.jobsTable.findFirst({
        where: (t, { eq, and }) =>
          and(eq(t.userId, ctx.userId), eq(t.id, input.jobId)),
        columns: { prompt: true, jobStatus: true },
      });

      if (!job) throw new Error("Job not found or unauthorized");
      if (!job.prompt) throw new Error("Prompt not found");
      if (job.jobStatus !== "queued")
        throw new Error("Pipeline already started");

      await ctx.db
        .update(jobsTable)
        .set({ jobStatus: "generating_script" })
        .where(eq(jobsTable.id, input.jobId))
        .returning({ id: jobsTable.id });

      try {
        const script = await generateScript(job.prompt);
        if (!script) throw new Error("Script generation returned empty");

        await ctx.db
          .update(jobsTable)
          .set({ jobStatus: "script_generated", script })
          .where(eq(jobsTable.id, input.jobId));

        return { script };
      } catch (e) {
        await ctx.db
          .update(jobsTable)
          .set({
            jobStatus: "failed",
            error: e instanceof Error ? e.message : "Script generation failed",
          })
          .where(eq(jobsTable.id, input.jobId));

        throw new Error("Script generation failed");
      }
    }),

  continuePipeline: protectedProcedure
    .input(z.object({ jobId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // ─── Atomic idempotency guard ───
      // Claim the job in one atomic UPDATE — prevents double-trigger
      const [claimed] = await ctx.db
        .update(jobsTable)
        .set({ jobStatus: "generating_assets", error: null })
        .where(
          and(
            eq(jobsTable.id, input.jobId),
            eq(jobsTable.userId, ctx.userId),
            eq(jobsTable.jobStatus, "script_generated"),
          ),
        )
        .returning({
          script: jobsTable.script,
          assetReferences: jobsTable.assetReferences,
        });

      if (!claimed) throw new Error("Job already in progress or not ready");

      const script = claimed.script as RoastBattleSchemaType;
      if (!script) throw new Error("Script not found");

      try {
        // ─── Resolve asset references to presigned URLs ───
        const refs = claimed.assetReferences;
        const pipelineRefs: PipelineReferences = {};

        // Helper: safely resolve an asset ID to a presigned read URL
        const resolveAssetUrl = async (assetId: string | null | undefined) => {
          if (!assetId) return undefined;
          try {
            const asset = await ctx.db.query.usersAssetsTable.findFirst({
              where: (t, { eq }) => eq(t.id, assetId),
              columns: { r2Key: true },
            });
            if (asset?.r2Key) return await getPresignedReadUrl(asset.r2Key);
          } catch (e) {
            console.warn(
              `⚠️  Failed to resolve asset ${assetId}, using default`,
            );
          }
          return undefined;
        };

        if (refs?.character1) {
          pipelineRefs.character1 = {
            voiceUrl: await resolveAssetUrl(refs.character1.voiceAssetId),
            imageUrl: await resolveAssetUrl(refs.character1.imageAssetId),
          };
        }

        if (refs?.character2) {
          pipelineRefs.character2 = {
            voiceUrl: await resolveAssetUrl(refs.character2.voiceAssetId),
            imageUrl: await resolveAssetUrl(refs.character2.imageAssetId),
          };
        }

        // ─── Generate Assets (images + audio) ───
        const manifest = await runPipeline(script, input.jobId, pipelineRefs);
        if (!manifest) throw new Error("Asset generation failed");

        // ─── Save Manifest ───
        await ctx.db
          .update(jobsTable)
          .set({ jobStatus: "saving_manifest", manifest })
          .where(eq(jobsTable.id, input.jobId));

        // ─── Transform to Remotion Props ───
        await ctx.db
          .update(jobsTable)
          .set({ jobStatus: "transforming_props" })
          .where(eq(jobsTable.id, input.jobId));

        const videoProps = await prepareVideoProps(manifest);
        if (!videoProps) throw new Error("Video props transformation failed");

        // ─── Complete ───
        await ctx.db
          .update(jobsTable)
          .set({ videoProps, jobStatus: "complete" })
          .where(eq(jobsTable.id, input.jobId));

        return { status: "complete" };
      } catch (error) {
        await ctx.db
          .update(jobsTable)
          .set({
            jobStatus: "failed",
            error: error instanceof Error ? error.message : "Unknown error",
          })
          .where(eq(jobsTable.id, input.jobId));

        throw error;
      }
    }),

  startPipeline: protectedProcedure
    .input(z.object({ jobId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const job = await ctx.db.query.jobsTable.findFirst({
        where: (t, { eq, and }) =>
          and(eq(t.userId, ctx.userId), eq(t.id, input.jobId)),
        columns: { prompt: true, jobStatus: true },
      });

      if (!job) throw new Error("Job not found or unauthorized");
      if (!job.prompt) throw new Error("Prompt not found");
      if (job.jobStatus !== "queued")
        throw new Error("Pipeline already started");

      try {
        // ─── Phase 1: Generate Script ───
        await ctx.db
          .update(jobsTable)
          .set({ jobStatus: "generating_script" })
          .where(eq(jobsTable.id, input.jobId));

        const script = await generateScript(job.prompt);
        if (!script) throw new Error("Script generation failed");

        // Save script to DB
        await ctx.db
          .update(jobsTable)
          .set({ script })
          .where(eq(jobsTable.id, input.jobId));

        // ─── Phase 2: Generate Assets (images + audio) ───
        await ctx.db
          .update(jobsTable)
          .set({ jobStatus: "generating_assets" })
          .where(eq(jobsTable.id, input.jobId));

        const manifest = await runPipeline(script, input.jobId);
        if (!manifest) throw new Error("Asset generation failed");

        // ─── Phase 3: Save Manifest ───
        await ctx.db
          .update(jobsTable)
          .set({ jobStatus: "saving_manifest", manifest })
          .where(eq(jobsTable.id, input.jobId));

        // ─── Phase 4: Transform to Remotion Props ───
        await ctx.db
          .update(jobsTable)
          .set({ jobStatus: "transforming_props" })
          .where(eq(jobsTable.id, input.jobId));

        const videoProps = await prepareVideoProps(manifest);
        if (!videoProps) throw new Error("Video props transformation failed");

        // ─── Phase 5: Complete ───
        await ctx.db
          .update(jobsTable)
          .set({ videoProps, jobStatus: "complete" })
          .where(eq(jobsTable.id, input.jobId));

        return { status: "complete" };
      } catch (error) {
        // Set failed status with error message
        await ctx.db
          .update(jobsTable)
          .set({
            jobStatus: "failed",
            error: error instanceof Error ? error.message : "Unknown error",
          })
          .where(eq(jobsTable.id, input.jobId));

        throw error;
      }
    }),

  // getStatus: protectedProcedure
  //   .input(z.object({ jobId: z.string() }))
  //   .query(async ({ ctx, input }) => {
  //     const result = await ctx.db.query.jobsTable.findFirst({
  //       where: (t, { eq, and }) =>
  //         and(eq(t.id, input.jobId), eq(t.userId, ctx.userId)),
  //     });

  //     if (!result) throw new Error("Couldn't find the user");

  //     const jobStatus = result.jobStatus;

  //     return jobStatus;
  //   }),

  getManifest: protectedProcedure
    .input(z.object({ jobId: z.string() }))
    .query(async ({ ctx, input }) => {
      const videoProps = await ctx.db.query.jobsTable.findFirst({
        where: (t, { eq, and }) =>
          and(eq(t.id, input.jobId), eq(t.userId, ctx.userId)),
        columns: { videoProps: true },
      });
      const vp = videoProps?.videoProps;
      if (!vp) throw new Error("Transformation failed");

      return videoProps;
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

  regenerateAndSaveImage: protectedProcedure
    .input(
      z.object({
        jobId: z.string(),
        prompt: z.string(),
        name: z.string(),
        angle: z.enum(["front", "side", "profile"]),
        character: z.enum(["character1", "character2"]),
        videoProps: VideoPropsInput,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.query.jobsTable.findFirst({
        where: (t, { eq, and }) =>
          and(eq(t.id, input.jobId), eq(t.userId, ctx.userId)),
        columns: { id: true },
      });

      if (!result) throw new Error("Unauthorised request");

      const referenceImageUrl = await getTempUrl();

      const imageStream = await genImage(input.prompt, referenceImageUrl);

      const fileName = `${input.name}-${input.angle}.png`;
      const r2Key = path.posix.join(input.jobId, "images", fileName);

      const imageUrl = await saveStreamToR2(imageStream.file, r2Key);

      const newImageUrl = `${imageUrl}?v=${Date.now()}`;

      const imageProp =
        input.videoProps.character[input.character].angles[input.angle];

      imageProp.image = newImageUrl;

      imageProp.prompt = input.prompt;

      const [newVideoProp] = await ctx.db
        .update(jobsTable)
        .set({ videoProps: input.videoProps })
        .where(
          and(eq(jobsTable.id, input.jobId), eq(jobsTable.userId, ctx.userId)),
        )
        .returning({ videoProp: jobsTable.videoProps });

      if (!newVideoProp) throw new Error("Failed to update in db");

      return newVideoProp;
    }),

  saveVideoPropToDb: protectedProcedure
    .input(
      z.object({
        jobId: z.string(),
        videoProp: z.unknown(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(jobsTable)
        .set({ videoProps: input.videoProp as PrepareVideoPropsType })
        .where(
          and(eq(jobsTable.id, input.jobId), eq(jobsTable.userId, ctx.userId)),
        );

      return { status: "ok" };
    }),

  getMyVideos: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db.query.jobsTable.findMany({
      where: (t, { eq, and }) =>
        and(eq(t.userId, ctx.userId), eq(t.jobStatus, "complete")),
      columns: {
        id: true,
        createdAt: true,
        videoProps: true,
      },
      orderBy: (t, { desc }) => desc(t.createdAt),
    });
  }),
});
