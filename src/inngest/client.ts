import { eventType, Inngest, staticSchema } from "inngest";

export type JobCreatedData = {
  jobId: string;
  userId: string;
  prompt: string;
};

export const jobCreated = eventType("job.created", {
  schema: staticSchema<JobCreatedData>(),
});

// Create a client to send and receive events
export const inngest = new Inngest({ id: "anime-room" });

export type inngest = typeof inngest;
