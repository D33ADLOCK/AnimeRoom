ALTER TABLE "jobs" ADD COLUMN "dispatched_at" timestamp;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "dispatch_error" text;