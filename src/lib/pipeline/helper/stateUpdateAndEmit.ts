import { realtime } from "~/lib/redis/realtime";
import type { LiveStateType } from "./createEmptyPreviewState";

export function calculateTotalDurationFrames(liveState: LiveStateType): number {
  let total = 0;

  if (liveState.data.announcer.ready) {
    total += liveState.data.announcer.durationFrames;
  }

  if (liveState.data.characterStats.character1.ready) {
    total += liveState.data.characterStats.character1.durationFrames;
  }

  if (liveState.data.characterStats.character2.ready) {
    total += liveState.data.characterStats.character2.durationFrames;
  }

  for (const round of liveState.data.rounds) {
    if (round.ready) {
      total += round.durationFrames;
    }
  }

  return total;
}

export const evaluateReadiness = (liveState: LiveStateType) => {
  const isChar1Ready = liveState.data.characterStats.character1.ready;

  const isChar2Ready = liveState.data.characterStats.character2.ready;

  if (!isChar1Ready || !isChar2Ready) return;

  for (const round of liveState.data.rounds) {
    if (round.ready) continue;
    if (round.attackerImage && round.opponentProfile && round.dialogueAudio) {
      round.ready = true;
    } else {
      break;
    }
  }
};

export async function stateUpdateAndEmit(
  liveState: LiveStateType,
  jobId: string,
  updater: (state: LiveStateType) => void,
) {
  updater(liveState);
  evaluateReadiness(liveState);

  liveState.data.version += 1;
  liveState.data.totalDurationFrames = calculateTotalDurationFrames(liveState);

  await realtime.channel(`job:${jobId}`).emit("pipeline-events", liveState);
}
