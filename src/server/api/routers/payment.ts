import z from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { stripe } from "~/lib/stripe/stripe";
import { CREDIT_PACKAGE } from "~/config/credits/package";
import { TRPCError } from "@trpc/server";
import { randomUUID } from "crypto";
import {
  paymentOrdersTable,
  type PaymentOrderMetadata,
} from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { env } from "~/env";

export const paymentRouter = createTRPCRouter({
  startPayment: protectedProcedure
    .input(z.object({ packageId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const productPackage = CREDIT_PACKAGE.find(
        (p) => p.id === input.packageId,
      );

      if (!productPackage?.stripePriceId)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Package not found",
        });

      const paymentOrderId = randomUUID();

      const [create] = await ctx.db
        .insert(paymentOrdersTable)
        .values({
          id: paymentOrderId,
          userId: ctx.userId,
          creditsPurchased: productPackage.credits,
          amountMinor: productPackage.priceInCents,
          currency: "usd",
          status: "pending",
          provider: "stripe",
          metadata: {
            packageId: productPackage.id,
          } as PaymentOrderMetadata,
        })
        .returning({ paymentId: paymentOrdersTable.id });

      if (!create) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const checkout = await stripe.checkout.sessions.create({
        line_items: [
          {
            price: productPackage.stripePriceId,
            quantity: 1,
          },
        ],
        metadata: {
          packageId: productPackage.id,
          userId: ctx.userId,
          creditAmount: String(productPackage.credits),
          paymentOrderId: paymentOrderId,
        },
        mode: "payment",
        success_url: `${env.NEXT_PUBLIC_APP_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${env.NEXT_PUBLIC_APP_URL}/payment/cancel`,
      });

      const [updated] = await ctx.db
        .update(paymentOrdersTable)
        .set({
          providerOrderId: checkout.id,
          metadata: {
            stripeCheckoutSessionId: checkout.id,
            packageId: productPackage.id,
          } as PaymentOrderMetadata,
        })
        .where(eq(paymentOrdersTable.id, paymentOrderId))
        .returning({ id: paymentOrdersTable.id });

      if (!updated) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      return { id: updated.id, url: checkout.url };
    }),
});
