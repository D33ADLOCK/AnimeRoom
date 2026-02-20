import z from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { randomUUID } from "crypto";
import { generateScript } from "~/lib/ai/grok";
import { jobsTable } from "~/server/db/schema";
import { runPipeline } from "~/lib/ai/pipeline";
import { eq } from "drizzle-orm";

export const jobRouter = createTRPCRouter({
  // Mutate from server
  createJob: publicProcedure
    .input(z.object({ prompt: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const jobId = randomUUID();

      const script = await generateScript(input.prompt);

      await ctx.db.insert(jobsTable).values({
        id: jobId,
        prompt: input.prompt,
        script,
        jobStatus: "generating_assets",
      });

      const manifest = await runPipeline(script, jobId);

      await ctx.db
        .update(jobsTable)
        .set({
          manifest,
          jobStatus: "rendering",
        })
        .where(eq(jobsTable.id, jobId));

      return jobId;
    }),
});
