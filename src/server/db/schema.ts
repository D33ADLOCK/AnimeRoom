import { jsonb, pgTableCreator, text, timestamp } from "drizzle-orm/pg-core";

export const createTable = pgTableCreator((name) => `${name}`);
export const jobStatus = [
  "queued",
  "generating_script",
  "generating_assets",
  "saving_to_cloud",
  "rendering",
  "complete",
  "failed",
] as const;

export type JobStatusType = (typeof jobStatus)[number];

export const jobsTable = createTable("jobs", {
  id: text("id").primaryKey(),
  prompt: text("prompt").notNull(),
  jobStatus: text("job_status").$type<JobStatusType>().notNull(),
  script: jsonb("script"),
  manifest: jsonb("manifest"),
  videoUrl: text("video_url"),
  error: text("error"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdateFn(() => new Date()),
});
