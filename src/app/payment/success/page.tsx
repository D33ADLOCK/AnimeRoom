import Link from "next/link";
import { CheckCircle, Zap, Sparkles } from "lucide-react";

export default function PaymentSuccessPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-nb-bg)] px-4">
      <div className="flex w-full max-w-md flex-col items-center gap-6 rounded-none border-[4px] border-black bg-white p-8 shadow-[8px_8px_0px_rgba(0,0,0,1)]">
        {/* Icon */}
        <div className="flex h-20 w-20 items-center justify-center rounded-none border-[3px] border-black bg-[var(--color-nb-mint)] shadow-[4px_4px_0px_rgba(0,0,0,1)]">
          <CheckCircle className="h-10 w-10 stroke-[2.5]" />
        </div>

        {/* Text */}
        <div className="text-center">
          <h1 className="text-2xl font-black uppercase tracking-tight sm:text-3xl">
            Payment Confirmed!
          </h1>
          <p className="mt-2 text-sm font-semibold text-black/60">
            Your credits have been added to your account. Time to create
            something legendary.
          </p>
        </div>

        {/* Credit badge */}
        <div className="flex items-center gap-2 rounded-none border-[3px] border-black bg-[var(--color-nb-yellow)] px-4 py-2 shadow-[3px_3px_0px_rgba(0,0,0,1)]">
          <Zap className="h-4 w-4 fill-black" />
          <span className="text-sm font-black uppercase tracking-widest">
            Credits Added
          </span>
        </div>

        {/* Actions */}
        <div className="flex w-full flex-col gap-3">
          <Link
            href="/create"
            className="flex w-full items-center justify-center gap-2 rounded-none border-[3px] border-black bg-[var(--color-nb-pink)] py-3.5 text-sm font-black uppercase tracking-widest shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none"
          >
            <Sparkles className="h-4 w-4" />
            Start Creating
          </Link>

          <Link
            href="/billing"
            className="flex w-full items-center justify-center rounded-none border-[3px] border-black bg-white py-3 text-sm font-bold uppercase tracking-widest text-black/60 shadow-[3px_3px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_rgba(0,0,0,1)]"
          >
            Back to Billing
          </Link>
        </div>
      </div>
    </div>
  );
}
