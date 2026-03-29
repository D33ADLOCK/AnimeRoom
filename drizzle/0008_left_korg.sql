ALTER TABLE "credit_transactions" RENAME COLUMN "metaData" TO "meta_data";--> statement-breakpoint
ALTER TABLE "credit_transactions" ALTER COLUMN "source_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_source_id_unique" UNIQUE("source_id");