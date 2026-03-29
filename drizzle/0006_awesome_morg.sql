CREATE TABLE "credit_transactions" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"type" text NOT NULL,
	"credits_delta" integer NOT NULL,
	"balance_after" integer NOT NULL,
	"source_type" text NOT NULL,
	"source_id" text,
	"metaData" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "payment_orders" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"provider" text NOT NULL,
	"status" text NOT NULL,
	"credits_purchased" integer NOT NULL,
	"amount_minor" integer NOT NULL,
	"currency" text NOT NULL,
	"provider_order_id" text,
	"provider_payment_id" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_credit_accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"balance_credits" integer NOT NULL,
	"lifetime_granted_credits" integer NOT NULL,
	"lifetime_spent_credits" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "user_credit_accounts_user_id_unique" UNIQUE("user_id")
);
