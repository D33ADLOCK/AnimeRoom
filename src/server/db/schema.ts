import {
  bigint,
  numeric,
  jsonb,
  pgTableCreator,
  text,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import type { LiveStateType } from "~/lib/pipeline/createEmptyPreviewState";

export const createTable = pgTableCreator((name) => `${name}`);
export const jobStatus = [
  "queued",
  "generating",
  "complete",
  "failed",
] as const;

export type JobStatusType = (typeof jobStatus)[number];

export type AssetReferences = {
  character1?: { voiceAssetId?: string | null; imageAssetId?: string | null };
  character2?: { voiceAssetId?: string | null; imageAssetId?: string | null };
};

export const jobsTable = createTable("jobs", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  prompt: text("prompt").notNull(),
  jobStatus: text("job_status").$type<JobStatusType>().notNull(),
  assetReferences: jsonb("asset_references").$type<AssetReferences>(),
  videoManifest: jsonb("videoManifest").$type<LiveStateType>(),
  metaData: jsonb("meta_data").$type<{
    battleTitle: string;
    shortSubtitle: string;
    thumbnailUrl: string;
  }>(),
  videoUrl: text("video_url"),
  error: text("error"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdateFn(() => new Date()),
});

export const uploadSessionStatus = [
  "intent_created",
  "uploading",
  "uploaded_unconfirmed",
  "confirmed",
  "attached",
  "expired",
  "failed",
] as const;
export type UploadSessionStatus = (typeof uploadSessionStatus)[number];

export const uploadAssetType = ["voice_reference", "image_reference"] as const;
export type UploadAssetType = (typeof uploadAssetType)[number];

export const uploadCharacterSlot = ["character1", "character2"] as const;
export type UploadCharacterSlot = (typeof uploadCharacterSlot)[number];

export const uploadSessionsTable = createTable(
  "upload_sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    jobId: text("job_id"),
    assetType: text("asset_type").$type<UploadAssetType>().notNull(),
    characterSlot: text("character_slot").$type<UploadCharacterSlot>(),
    status: text("status").$type<UploadSessionStatus>().notNull(),
    r2Key: text("r2_key").notNull().unique(),
    bucket: text("bucket").notNull(),
    presignedUrlExpiresAt: timestamp("presigned_url_expires_at").notNull(),
    expectedContentType: text("expected_content_type").notNull(),
    expectedSizeBytes: bigint("expected_size_bytes", { mode: "number" }),
    originalFilename: text("original_filename").notNull(),
    error: text("error"),
    confirmedAt: timestamp("confirmed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdateFn(() => new Date())
      .notNull(),
  },
  (table) => {
    return {
      userIdIdx: index("upload_session_user_id_idx").on(table.userId),
      jobIdIdx: index("upload_session_job_id_idx").on(table.jobId),
      jobStatusIdx: index("job_status_index").on(table.status),
    };
  },
);

export const assetType = ["voice_reference", "image_reference"] as const;

export type AssetType = (typeof assetType)[number];

export const usersAssetsTable = createTable("users_assets", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  // characterName: text("character_name").notNull(),

  assetType: text("asset_type").$type<AssetType>(),
  r2Key: text("r2_key"),
  sizeBytes: bigint("size_bytes", { mode: "number" }),
  durationSeconds: numeric("duration_seconds"),
  label: text("label"),
  sourceUploadSessionId: text("source_upload_session_id").references(
    () => uploadSessionsTable.id,
    { onDelete: "set null" },
  ),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdateFn(() => new Date()),
});
