import { eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import type Stripe from "stripe";
import { stripe } from "~/lib/stripe/stripe";
import { grantCredits } from "~/server/credits/creditHelper";
import { db } from "~/server/db";
import {
  paymentOrdersTable,
  type PaymentOrderMetadata,
} from "~/server/db/schema";
import { env } from "~/env";

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return new Response("Missing webhook verification data", { status: 400 });
  }

  let event: Stripe.Event | null = null;

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    console.error("Stripe webhook signature verification failed:", error);
    return new Response("Invalid signature", { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      const packageId = session.metadata?.packageId;

      await db.transaction(async (tx) => {
        const [currentOrder] = await tx
          .select({
            id: paymentOrdersTable.id,
            userId: paymentOrdersTable.userId,
            status: paymentOrdersTable.status,
            creditsPurchased: paymentOrdersTable.creditsPurchased,
            providerOrderId: paymentOrdersTable.providerOrderId,
            providerPaymentId: paymentOrdersTable.providerPaymentId,
            metadata: paymentOrdersTable.metadata,
          })
          .from(paymentOrdersTable)
          .where(eq(paymentOrdersTable.providerOrderId, session.id))
          .for("update");

        if (!currentOrder) throw new Error("Payment order not found");

        if (currentOrder.status === "paid") {
          return;
        }

        const metadata: PaymentOrderMetadata = {
          ...(currentOrder.metadata ?? {}),
          packageId,
          stripeCheckoutSessionId: session.id,
          stripeEventId: event.id,
          stripePaymentIntentId: session.payment_intent as string,
          note: "Payment successful",
        };

        const [update] = await tx
          .update(paymentOrdersTable)
          .set({
            providerPaymentId: session.payment_intent as string,
            status: "paid",
            metadata,
          })
          .where(eq(paymentOrdersTable.providerOrderId, session.id))
          .returning({
            userId: paymentOrdersTable.userId,
            sourceId: paymentOrdersTable.providerOrderId,
            creditsPurchased: paymentOrdersTable.creditsPurchased,
            providerOrderId: paymentOrdersTable.providerOrderId,
            providerPaymentId: paymentOrdersTable.providerPaymentId,
          });

        if (!update) throw new Error("Failed to update the paymentTable");

        await grantCredits({
          tx,
          userId: update.userId,
          creditAmount: update.creditsPurchased,
          eventType: "purchase",
          metaData: {
            packageId,
            stripeCheckoutSessionId: update.providerOrderId!,
            stripePaymentIntentId: update.providerPaymentId!,
          },
          sourceId: update.providerOrderId!,
          sourceType: "stripe_checkout_session",
          transactionId: `purchase:${currentOrder.id}`,
        });
      });

      return new Response("ok", { status: 200 });
    }

    if (event.type === "checkout.session.expired") {
      const session = event.data.object;

      const packageId = session.metadata?.packageId;

      await db.transaction(async (tx) => {
        const [currentOrder] = await tx
          .select({
            status: paymentOrdersTable.status,
            metadata: paymentOrdersTable.metadata,
          })
          .from(paymentOrdersTable)
          .where(eq(paymentOrdersTable.providerOrderId, session.id))
          .for("update");

        if (!currentOrder) return;
        if (
          currentOrder.status === "paid" ||
          currentOrder.status === "failed"
        ) {
          return;
        }

        const metadata: PaymentOrderMetadata = {
          ...(currentOrder.metadata ?? {}),
          packageId,
          stripeCheckoutSessionId: session.id,
          stripeEventId: event.id,
          note: "Link expired, payment failed",
        };

        await tx
          .update(paymentOrdersTable)
          .set({
            status: "failed",
            metadata,
          })
          .where(eq(paymentOrdersTable.providerOrderId, session.id));
      });

      return new Response("ok", { status: 200 });
    }
  } catch (error) {
    // A real payment may have succeeded but credit-granting failed here.
    // Log with the event identifiers so platform logs can answer
    // "customer paid, got nothing — why?". Returning 500 makes Stripe retry.
    console.error(
      `Stripe webhook handler failed (event ${event.id}, type ${event.type}):`,
      error,
    );
    return new Response("Webhook handler failed", { status: 500 });
  }

  return new Response("ok", { status: 200 });
}
