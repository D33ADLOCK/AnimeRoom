ALTER TABLE "jobs" ADD COLUMN "current_stage" text DEFAULT 'queued' NOT NULL;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "safe_error" text;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "internal_error" text;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "retryable" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "generating_at" timestamp;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "completed_at" timestamp;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "failed_at" timestamp;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "refunded_at" timestamp;--> statement-breakpoint
UPDATE "jobs"
SET
  "current_stage" = CASE
    WHEN "job_status" = 'complete' THEN 'complete'
    WHEN "job_status" = 'failed' THEN 'failed'
    WHEN "job_status" = 'generating' THEN 'generating'
    ELSE 'queued'
  END,
  "safe_error" = CASE
    WHEN "job_status" = 'failed' THEN COALESCE("error", 'Video generation did not complete.')
    ELSE NULL
  END,
  "retryable" = "job_status" = 'failed',
  "generating_at" = CASE
    WHEN "job_status" IN ('generating', 'complete', 'failed') THEN COALESCE("updated_at", "created_at")
    ELSE NULL
  END,
  "completed_at" = CASE
    WHEN "job_status" = 'complete' THEN COALESCE("updated_at", "created_at")
    ELSE NULL
  END,
  "failed_at" = CASE
    WHEN "job_status" = 'failed' THEN COALESCE("updated_at", "created_at")
    ELSE NULL
  END,
  "refunded_at" = CASE
    WHEN "job_status" = 'failed' AND EXISTS (
      SELECT 1
      FROM "credit_transactions"
      WHERE "source_id" IN (
        "jobs"."id" || '_refund',
        "jobs"."id" || '_dispatch_refund',
        "jobs"."id" || '_terminal_refund'
      )
    ) THEN COALESCE("updated_at", "created_at")
    ELSE NULL
  END;
