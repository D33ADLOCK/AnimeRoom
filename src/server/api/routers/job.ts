import z from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { randomUUID } from "crypto";
import { generateScript } from "~/lib/ai/grok";
import { jobsTable, jobStatus } from "~/server/db/schema";
import { runPipeline } from "~/lib/ai/pipeline";
import { eq } from "drizzle-orm";
import { prepareVideoProps } from "~/remotion/prepareVideoProps";

export const jobRouter = createTRPCRouter({
  // Mutate from server
  createJob: publicProcedure
    .input(z.object({ prompt: z.string() }))
    .mutation(async ({ ctx, input }) => {
      console.log("Trpc Called");
      const jobId = randomUUID();

      const id = await ctx.db
        .insert(jobsTable)
        .values({ id: jobId, prompt: input.prompt, jobStatus: "queued" })
        .returning({ jobId: jobsTable.id });

      return id;
    }),

  startPipeline: publicProcedure
    .input(z.object({ jobId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const job = await ctx.db.query.jobsTable.findFirst({
        where: (t, { eq }) => eq(t.id, input.jobId),
        columns: { prompt: true },
      });

      if (!job) throw new Error("JobId not found");

      if (!job.prompt) throw new Error("Prompt not found");

      await ctx.db
        .update(jobsTable)
        .set({ jobStatus: "generating_script" })
        .where(eq(jobsTable.id, input.jobId));

      const script = await generateScript(job.prompt);

      if (!script) throw new Error("Script not Generated");

      await ctx.db
        .update(jobsTable)
        .set({ jobStatus: "generating_assets" })
        .where(eq(jobsTable.id, input.jobId));

      const manifest = await runPipeline(script, input.jobId);

      if (!manifest) throw new Error("Error while generating assets");

      await ctx.db
        .update(jobsTable)
        .set({ manifest })
        .where(eq(jobsTable.id, input.jobId));

      const videoProps = await prepareVideoProps(manifest);

      if (!videoProps) throw new Error("transformation failed");

      await ctx.db
        .update(jobsTable)
        .set({ videoProps })
        .where(eq(jobsTable.id, input.jobId));

      return { status: "Ok" };
    }),

  getManifest: publicProcedure
    .input(z.object({ jobId: z.string() }))
    .query(async ({ ctx, input }) => {
      const videoProps = await ctx.db.query.jobsTable.findFirst({
        where: (t, { eq }) => eq(t.id, input.jobId),
        columns: { videoProps: true },
      });
      const vp = videoProps?.videoProps;
      if (!vp) throw new Error("Transformation failed");

      return videoProps;
    }),
});
