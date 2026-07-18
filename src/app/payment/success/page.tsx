import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { CheckCircle, Clock, Zap, Sparkles } from "lucide-react";
import { stripe } from "~/lib/stripe/stripe";

type PaymentView = "paid" | "processing";

/**
 * Resolves the real payment state from Stripe instead of assuming success.
 * Returns `null` when the session is missing, invalid, or not the current
 * user's — the caller redirects those cases to /billing rather than showing a
 * confirmation the visitor didn't earn.
 */
async function resolvePaymentView(
  sessionId: string | undefined,
): Promise<PaymentView | null> {
  if (!sessionId) return null;

  const { userId } = await auth();
  if (!userId) return null;

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // The unguessable session ID proves a real checkout; the metadata match
    // ensures we never confirm a payment that belongs to another account.
    if (session.metadata?.userId !== userId) return null;

    return session.payment_status === "paid" ? "paid" : "processing";
  } catch (error) {
    console.error("Failed to retrieve Stripe checkout session:", error);
    return null;
  }
}

const VIEW = {
  paid: {
    icon: CheckCircle,
    iconBg: "var(--color-nb-mint)",
    heading: "Payment Confirmed!",
    body: "Your credits have been added to your account. Time to create something legendary.",
    badge: "Credits Added",
  },
  processing: {
    icon: Clock,
    iconBg: "var(--color-nb-yellow)",
    heading: "Payment Processing",
    body: "Your payment is confirming. Your credits will appear in a moment — refresh this page or head to billing to check.",
    badge: "Confirming",
  },
} as const;

export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;
  const view = await resolvePaymentView(session_id);

  if (!view) redirect("/billing");

  const { icon: Icon, iconBg, heading, body, badge } = VIEW[view];

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-nb-bg)] px-4">
      <div className="flex w-full max-w-md flex-col items-center gap-6 rounded-none border-[4px] border-black bg-white p-8 shadow-[8px_8px_0px_rgba(0,0,0,1)]">
        {/* Icon */}
        <div
          className="flex h-20 w-20 items-center justify-center rounded-none border-[3px] border-black shadow-[4px_4px_0px_rgba(0,0,0,1)]"
          style={{ backgroundColor: iconBg }}
        >
          <Icon className="h-10 w-10 stroke-[2.5]" />
        </div>

        {/* Text */}
        <div className="text-center">
          <h1 className="text-2xl font-black tracking-tight uppercase sm:text-3xl">
            {heading}
          </h1>
          <p className="mt-2 text-sm font-semibold text-black/60">{body}</p>
        </div>

        {/* Status badge */}
        <div className="flex items-center gap-2 rounded-none border-[3px] border-black bg-[var(--color-nb-yellow)] px-4 py-2 shadow-[3px_3px_0px_rgba(0,0,0,1)]">
          <Zap className="h-4 w-4 fill-black" />
          <span className="text-sm font-black tracking-widest uppercase">
            {badge}
          </span>
        </div>

        {/* Actions */}
        <div className="flex w-full flex-col gap-3">
          <Link
            href="/create"
            className="flex w-full items-center justify-center gap-2 rounded-none border-[3px] border-black bg-[var(--color-nb-pink)] py-3.5 text-sm font-black tracking-widest uppercase shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none"
          >
            <Sparkles className="h-4 w-4" />
            Start Creating
          </Link>

          <Link
            href="/billing"
            className="flex w-full items-center justify-center rounded-none border-[3px] border-black bg-white py-3 text-sm font-bold tracking-widest text-black/60 uppercase shadow-[3px_3px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_rgba(0,0,0,1)]"
          >
            Back to Billing
          </Link>
        </div>
      </div>
    </div>
  );
}
