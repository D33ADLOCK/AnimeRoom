import type { NextRequest } from "next/server";
import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { db } from "~/server/db";
import { grantCredits } from "~/server/credits/creditHelper";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  try {
    const evt = await verifyWebhook(req);

    if (evt.type === "user.created") {
      const userId = evt.data.id;

      await db.transaction(async (tx) => {
        await grantCredits({
          tx,
          transactionId: randomUUID(),
          userId,
          sourceId: userId,
          creditAmount: 10,
          eventType: "signup_bonus",
          sourceType: "system",
          metaData: { note: "Welcome Gift" },
        });
      });

      return new Response("ok", { status: 200 });
    }
  } catch (err) {
    console.log("Clerk webhook error:", err);
    return new Response("Error verifying the webhook", { status: 400 });
  }
}
