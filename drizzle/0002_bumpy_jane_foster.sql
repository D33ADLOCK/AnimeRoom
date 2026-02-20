CREATE TABLE "jobs" (
	"id" text PRIMARY KEY NOT NULL,
	"prompt" text NOT NULL,
	"job_status" text NOT NULL,
	"script" jsonb,
	"manifest" jsonb,
	"video_url" text,
	"error" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP TABLE "roastBattles" CASCADE;