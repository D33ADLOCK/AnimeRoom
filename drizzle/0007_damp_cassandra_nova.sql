ALTER TABLE "user_credit_accounts" DROP CONSTRAINT "user_credit_accounts_user_id_unique";--> statement-breakpoint
ALTER TABLE "user_credit_accounts" DROP COLUMN "id";--> statement-breakpoint
ALTER TABLE "user_credit_accounts" ADD PRIMARY KEY ("user_id");--> statement-breakpoint
CREATE INDEX "credit_transactions_userId_created_at_idx" ON "credit_transactions" USING btree ("userId","created_at");--> statement-breakpoint
CREATE INDEX "payment_user_id_idx" ON "payment_orders" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "provider_order_id_idx" ON "payment_orders" USING btree ("provider_order_id");--> statement-breakpoint
ALTER TABLE "user_credit_accounts" ADD CONSTRAINT "balance_credits" CHECK ("user_credit_accounts"."balance_credits">=0);
