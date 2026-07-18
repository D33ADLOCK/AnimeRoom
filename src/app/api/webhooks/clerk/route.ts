import type { NextRequest } from "next/server";
import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { db } from "~/server/db";
import {
  grantCredits,
  SIGNUP_BONUS_CREDITS,
} from "~/server/credits/creditHelper";

export async function POST(req: NextRequest) {
  try {
    const evt = await verifyWebhook(req);

    if (evt.type === "user.created") {
      const userId = evt.data.id;

      await db.transaction(async (tx) => {
        await grantCredits({
          tx,
          transactionId: `signup:${userId}`,
          userId,
          sourceId: userId,
          creditAmount: SIGNUP_BONUS_CREDITS,
          eventType: "signup_bonus",
          sourceType: "system",
          metaData: { note: "Welcome Gift" },
        });
      });

      return new Response("ok", { status: 200 });
    }

    // Any other event type is acknowledged but intentionally ignored.
    // Returning 200 stops Clerk from recording failed deliveries and
    // retrying (which can degrade the endpoint's health for user.created).
    return new Response("ok", { status: 200 });
  } catch (err) {
    console.error("Clerk webhook error:", err);
    return new Response("Error verifying the webhook", { status: 400 });
  }
}
