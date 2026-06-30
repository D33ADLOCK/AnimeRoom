import { realtime } from "~/lib/redis/realtime";
import type { JobEvent } from "~/lib/realtime/job-event";

export async function safeRealtimeEmit(data: JobEvent) {
  try {
    await realtime.emit("pipeline-events", data);
  } catch (error) {
    console.error("Realtime emit failed", { error });
  }
}

export async function safeRealtimeChannelEmit(
  channel: string,
  data: JobEvent,
) {
  try {
    await realtime.channel(channel).emit("pipeline-events", data);
  } catch (error) {
    console.error("Realtime channel emit failed", { channel, error });
  }
}
