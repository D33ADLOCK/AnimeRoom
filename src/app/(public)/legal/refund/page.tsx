export const metadata = {
  title: "Refund Policy — AnimeRoom",
};

export default function RefundPage() {
  return (
    <>
      <h1 className="text-3xl font-extrabold tracking-tight uppercase sm:text-4xl">
        Refund Policy
      </h1>
      <p className="text-xs font-bold text-[var(--color-nb-text)]/50 uppercase">
        Last updated: July 17, 2026
      </p>

      <p>
        All AnimeRoom purchases are one-time credit packages processed through
        Stripe. There are no subscriptions, so there&apos;s nothing recurring to
        cancel. Here&apos;s how refunds work.
      </p>

      <h2>1. Failed generations are refunded automatically</h2>
      <p>
        If a video generation fails or is stopped because of a technical error
        on our end, the credits spent on that attempt are automatically returned
        to your account balance. You don&apos;t need to contact us for this —
        check your balance on the{" "}
        <a href="/billing" className="underline">
          Billing
        </a>{" "}
        page.
      </p>

      <h2>2. Unused credits</h2>
      <p>
        If you purchased a credit package and haven&apos;t spent any credits
        from it yet, you can request a full refund within 14 days of purchase by
        emailing{" "}
        <a href="mailto:support@animeroom.space" className="underline">
          support@animeroom.space
        </a>{" "}
        with your account email and the purchase date.
      </p>

      <h2>3. Spent credits</h2>
      <p>
        Credits spent on a generation that completed successfully are not
        refundable — the underlying AI compute cost has already been incurred.
        If you believe a completed generation was defective in a way that
        wasn&apos;t your fault (not a failed job, but genuinely broken output),
        contact support and we&apos;ll review it case by case.
      </p>

      <h2>4. How refunds are paid</h2>
      <p>
        Approved refunds are issued back to the original Stripe payment method.
        Processing time depends on your bank or card issuer, typically 5–10
        business days after we approve the request.
      </p>

      <h2>5. Chargebacks</h2>
      <p>
        If you have a billing issue, please contact us first at{" "}
        <a href="mailto:support@animeroom.space" className="underline">
          support@animeroom.space
        </a>{" "}
        — we&apos;d rather resolve it directly than have you file a chargeback
        with your bank.
      </p>
    </>
  );
}
