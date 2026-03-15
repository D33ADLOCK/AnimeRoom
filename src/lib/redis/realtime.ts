import { Realtime } from "@upstash/realtime";
import type { InferRealtimeEvents } from "@upstash/realtime";
import { redis } from "./redis";
import { JobEventSchema } from "../realtime/job-event";

const schema = {
  "pipeline-events": JobEventSchema,
};

export const realtime = new Realtime({ schema, redis });
export type RealtimeEvents = InferRealtimeEvents<typeof realtime>;
