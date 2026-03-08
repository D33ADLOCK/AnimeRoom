CREATE TABLE "jobs" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"prompt" text NOT NULL,
	"job_status" text NOT NULL,
	"script" jsonb,
	"asset_references" jsonb,
	"manifest" jsonb,
	"video_props" jsonb,
	"video_url" text,
	"error" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "upload_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"job_id" text,
	"asset_type" text NOT NULL,
	"character_slot" text,
	"status" text NOT NULL,
	"r2_key" text NOT NULL,
	"bucket" text NOT NULL,
	"presigned_url_expires_at" timestamp NOT NULL,
	"expected_content_type" text NOT NULL,
	"expected_size_bytes" bigint,
	"original_filename" text NOT NULL,
	"error" text,
	"confirmed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "upload_sessions_r2_key_unique" UNIQUE("r2_key")
);
--> statement-breakpoint
CREATE TABLE "users_assets" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"character_name" text NOT NULL,
	"asset_type" text,
	"r2_key" text,
	"size_bytes" bigint,
	"duration_seconds" numeric,
	"label" text,
	"source_upload_session_id" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "users_assets" ADD CONSTRAINT "users_assets_source_upload_session_id_upload_sessions_id_fk" FOREIGN KEY ("source_upload_session_id") REFERENCES "public"."upload_sessions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "upload_session_user_id_idx" ON "upload_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "upload_session_job_id_idx" ON "upload_sessions" USING btree ("job_id");