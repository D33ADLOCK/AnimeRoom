import z from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { randomUUID } from "crypto";
import { generateScript } from "~/lib/ai/grok";
import { jobsTable } from "~/server/db/schema";
import { runPipeline } from "~/lib/ai/pipeline";
import { eq } from "drizzle-orm";
import { prepareVideoProps } from "~/lib/video/prepareVideoProps";

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

  getStatus: protectedProcedure
    .input(z.object({ jobId: z.string() }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.db.query.jobsTable.findFirst({
        where: (t, { eq, and }) =>
          and(eq(t.id, input.jobId), eq(t.userId, ctx.userId)),
      });

      if (!result) throw new Error("Couldn't find the user");

      const jobStatus = result.jobStatus;

      return jobStatus;
    }),

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
});
