ALTER TABLE "jobs" ADD COLUMN "thumbnail_url" jsonb;--> statement-breakpoint
CREATE INDEX "job_status_index" ON "upload_sessions" USING btree ("status");