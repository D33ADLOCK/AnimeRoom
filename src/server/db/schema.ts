import { sql } from "drizzle-orm";
import {
  bigint,
  numeric,
  jsonb,
  pgTableCreator,
  text,
  timestamp,
  index,
  integer,
  check,
} from "drizzle-orm/pg-core";
import type { LiveStateType } from "~/lib/pipeline/helper/createEmptyPreviewState";

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
  creditCost: integer("credit_cost").default(1).notNull(),
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

export const transactionType = [
  "signup_bonus",
  "purchase",
  "job_debit",
  "job_refund",
  "manual_adjustment",
  "daily_grant",
] as const;

export const sourceType = [
  "system",
  "stripe_checkout_session",
  "job",
  "admin",
  "subscription",
] as const;

export type SourceType = (typeof sourceType)[number];

export type TransactionType = (typeof transactionType)[number];

export type TransactionMetadataType = {
  note?: string;
  stripeCheckoutSessionId?: string;
  stripePaymentIntentId?: string;
  jobId?: string;
  packageId?: string;
  reason?: string;
};

export const creditTransactionsTable = createTable(
  "credit_transactions",
  {
    id: text("id").primaryKey(),
    userId: text().notNull(),

    type: text("type").$type<TransactionType>().notNull(),
    creditsDelta: integer("credits_delta").notNull(),
    balanceAfter: integer("balance_after").notNull(),

    sourceType: text("source_type").$type<SourceType>().notNull(),
    sourceId: text("source_id").notNull().unique(),

    metaData: jsonb("meta_data").$type<TransactionMetadataType>(),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    index("credit_transactions_userId_created_at_idx").on(
      table.userId,
      table.createdAt,
    ),
  ],
);

export const userCreditAccountTable = createTable(
  "user_credit_accounts",
  {
    userId: text("user_id").primaryKey(),
    balanceCredits: integer("balance_credits").notNull(),

    lifetimeGrantedCredits: integer("lifetime_granted_credits").notNull(),
    lifetimeSpentCredits: integer("lifetime_spent_credits").notNull(),

    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdateFn(() => new Date()),
  },
  (table) => [check("balance_credits", sql`${table.balanceCredits}>=0`)],
);

export const paymentProvider = ["stripe"] as const;
export type PaymentProvider = (typeof paymentProvider)[number];

export const paymentOrderStatus = [
  "pending",
  "paid",
  "failed",
  "refunded",
] as const;
export type PaymentOrderStatus = (typeof paymentOrderStatus)[number];

export const currency = ["usd", "inr"] as const;
export type CurrencyType = (typeof currency)[number];

export type PaymentOrderMetadata = {
  stripeCheckoutSessionId?: string;
  stripePaymentIntentId?: string;
  stripeCustomerId?: string;
  stripeEventId?: string;
  packageId?: string;
  note?: string;
};

export const paymentOrdersTable = createTable(
  "payment_orders",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    provider: text("provider").$type<PaymentProvider>().notNull(),
    status: text("status").$type<PaymentOrderStatus>().notNull(),
    creditsPurchased: integer("credits_purchased").notNull(),
    amountMinor: integer("amount_minor").notNull(),
    currency: text("currency").notNull().$type<CurrencyType>(),
    providerOrderId: text("provider_order_id"),
    providerPaymentId: text("provider_payment_id"),
    metadata: jsonb("metadata").$type<PaymentOrderMetadata>(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdateFn(() => new Date())
      .notNull(),
  },
  (table) => [
    index("payment_user_id_idx").on(table.userId),
    index("provider_order_id_idx").on(table.providerOrderId),
  ],
);
