import type { LiveStateType } from "~/lib/pipeline/helper/createEmptyPreviewState";
import type { inngest } from "./client";
import type { GetStepTools } from "inngest";
import { stateUpdateAndEmit } from "~/lib/pipeline/helper/stateUpdateAndEmit";
import { db } from "~/server/db";
import { jobsTable } from "~/server/db/schema";
import { and, eq } from "drizzle-orm";
import { safeRealtimeEmit } from "~/lib/realtime/safeRealtimeEmit";

type Step = GetStepTools<typeof inngest>;

export const finalisePipeline = async ({
  jobId,
  liveState,
  r2Promise,
  step,
  userId,
}: {
  liveState: LiveStateType;
  jobId: string;
  r2Promise: Promise<{ key: string; url: string }>[];
  step: Step;
  userId: string;
}) => {
  const r2Results = await step.run("save-asset-to-r2", async () => {
    return Promise.all(r2Promise);
  });

  const r2Map = new Map(r2Results.map(({ key, url }) => [key, url]));

  const finalState = await step.run("emit-permanent-url", async () => {
    await stateUpdateAndEmit(liveState, jobId, (state) => {
      // Meta thumbnail
      if (r2Map.has("meta-thumbnail")) {
        state.data.meta.thumbnailUrl = r2Map.get("meta-thumbnail")!;
      }

      // Characters
      const char1 = state.data.characterStats.character1;
      if (r2Map.has("characterBundle-character1")) {
        char1.imageUrl = r2Map.get("characterBundle-character1")!;
      }
      const char2 = state.data.characterStats.character2;
      if (r2Map.has("characterBundle-character2")) {
        char2.imageUrl = r2Map.get("characterBundle-character2")!;
      }

      // Rounds
      for (let i = 0; i < state.data.rounds.length; i++) {
        const round = state.data.rounds[i]!;
        if (r2Map.has(`round-${i}-attacker`)) {
          round.attackerImage = r2Map.get(`round-${i}-attacker`)!;
        }
        if (r2Map.has(`round-${i}-opponent`)) {
          round.opponentProfile = r2Map.get(`round-${i}-opponent`)!;
        }
        if (r2Map.has(`round-${i}-audio`)) {
          round.dialogueAudio = r2Map.get(`round-${i}-audio`)!;
        }
      }
    });

    // Return the state so it's cached — on replay this step won't execute,
    // but save-manifest-to-db will still get the correct R2 URLs
    return liveState;
  });

  await step.run("save-manifest-to-db", async () => {
    await db
      .update(jobsTable)
      .set({
        videoManifest: finalState,
        metaData: {
          battleTitle: finalState.data.meta.battleTitle,
          shortSubtitle: finalState.data.meta.shortSubtitle,
          thumbnailUrl: finalState.data.meta.thumbnailUrl!,
        },
        jobStatus: "complete",
      })
      .where(and(eq(jobsTable.id, jobId), eq(jobsTable.userId, userId)))
      .returning({ jobs: jobsTable.id });
  });

  await step.run("complete-pipeline", async () => {
    await safeRealtimeEmit({
      type: "completed",
      jobId,
      message: "Video Pipeline Completed",
    });
  });
};
