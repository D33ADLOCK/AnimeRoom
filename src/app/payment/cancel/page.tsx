import Link from "next/link";
import { XCircle, CreditCard } from "lucide-react";

export default function PaymentCancelPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-nb-bg)] px-4">
      <div className="flex w-full max-w-md flex-col items-center gap-6 rounded-none border-[4px] border-black bg-white p-8 shadow-[8px_8px_0px_rgba(0,0,0,1)]">
        {/* Icon */}
        <div className="flex h-20 w-20 items-center justify-center rounded-none border-[3px] border-black bg-[var(--color-nb-pink)] shadow-[4px_4px_0px_rgba(0,0,0,1)]">
          <XCircle className="h-10 w-10 stroke-[2.5]" />
        </div>

        {/* Text */}
        <div className="text-center">
          <h1 className="text-2xl font-black tracking-tight uppercase sm:text-3xl">
            Payment Cancelled
          </h1>
          <p className="mt-2 text-sm font-semibold text-black/60">
            No worries — you were not charged. Your credits are unchanged.
          </p>
        </div>

        {/* Actions */}
        <div className="flex w-full flex-col gap-3">
          <Link
            href="/billing"
            className="flex w-full items-center justify-center gap-2 rounded-none border-[3px] border-black bg-[var(--color-nb-yellow)] py-3.5 text-sm font-black tracking-widest uppercase shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none"
          >
            <CreditCard className="h-4 w-4" />
            View Plans
          </Link>

          <Link
            href="/create"
            className="flex w-full items-center justify-center rounded-none border-[3px] border-black bg-white py-3 text-sm font-bold tracking-widest text-black/60 uppercase shadow-[3px_3px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_rgba(0,0,0,1)]"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
