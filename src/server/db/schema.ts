import { jsonb, pgTableCreator, text, timestamp } from "drizzle-orm/pg-core";
import type { ManifestType } from "~/remotion/dummyManifest";
import type { PrepareVideoPropsType } from "~/lib/video/prepareVideoProps";

export const createTable = pgTableCreator((name) => `${name}`);
export const jobStatus = [
  "queued",
  "generating_script",
  "generating_assets",
  "saving_manifest",
  "transforming_props",
  "rendering",
  "complete",
  "failed",
] as const;

export type JobStatusType = (typeof jobStatus)[number];

export const jobsTable = createTable("jobs", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  prompt: text("prompt").notNull(),
  jobStatus: text("job_status").$type<JobStatusType>().notNull(),
  script: jsonb("script"),
  manifest: jsonb("manifest").$type<ManifestType>(),
  videoProps: jsonb("video_props").$type<PrepareVideoPropsType>(),
  videoUrl: text("video_url"),
  error: text("error"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdateFn(() => new Date()),
});
