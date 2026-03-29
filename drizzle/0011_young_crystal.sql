CREATE TABLE "subscription" (
	"user_id" text PRIMARY KEY NOT NULL,
	"stripe_subscription_id" text,
	"status" text NOT NULL,
	"current_period_end" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "subscription_stripe_subscription_id_unique" UNIQUE("stripe_subscription_id")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"user_id" text PRIMARY KEY NOT NULL,
	"role" text DEFAULT 'user' NOT NULL,
	"user_plan" text DEFAULT 'free' NOT NULL,
	"daily_credits_granted_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX "subscription_stripe_id_idx" ON "subscription" USING btree ("stripe_subscription_id");