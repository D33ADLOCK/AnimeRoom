import { Zap, Gift, Check, Star, ShieldCheck } from "lucide-react";
import { CREDIT_PACKAGE } from "~/config/credits/package";
import { api } from "~/trpc/server";
import BuyButton from "./buyButton";

export default function BillingPage() {
  const packageThemes = [
    {
      bg: "bg-[var(--color-nb-pink)]",
      badge: "bg-[var(--color-nb-yellow)]",
      button: "bg-[var(--color-nb-yellow)]",
      buttonHover: "hover:bg-[#ffe033]",
    },
    {
      bg: "bg-[var(--color-nb-lavender)]",
      badge: "bg-[var(--color-nb-mint)]",
      button: "bg-[var(--color-nb-mint)]",
      buttonHover: "hover:bg-[#85e0d1]",
    },
    {
      bg: "bg-[var(--color-nb-yellow)]",
      badge: "bg-[var(--color-nb-pink)]",
      button: "bg-[var(--color-nb-pink)]",
      buttonHover: "hover:bg-[#ff85c6]",
    },
  ];

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-6 px-4 py-4 sm:px-6 sm:py-8 lg:gap-8">
      {/* Header */}
      <div className="relative z-10 text-center">
        <h1 className="inline-block text-3xl font-extrabold tracking-tight uppercase sm:text-4xl md:text-5xl">
          Complete{" "}
          <span className="relative inline-block">
            <span className="relative z-10">Freedom</span>
            <div className="absolute right-0 bottom-1 left-0 -z-10 h-1/2 -skew-y-2 bg-[var(--color-nb-yellow)] sm:bottom-2" />
          </span>
        </h1>
        <p className="mx-auto mt-2 max-w-xl text-sm font-bold text-[var(--color-nb-text)]/70 sm:text-base">
          No subscriptions. No renewals. Pay exactly for what you use and
          nothing more. We believe in absolute creative freedom.
        </p>
      </div>

      {/* Pricing Grid */}
      <div className="grid w-full grid-cols-1 items-stretch gap-8 md:grid-cols-2 lg:gap-10">
        {/* FREE TIER CARD */}
        <div className="group relative flex flex-col rounded-none border-[4px] border-black bg-white shadow-[6px_6px_0px_rgba(0,0,0,1)] transition-transform duration-300 hover:-translate-y-1 hover:shadow-[8px_8px_0px_rgba(0,0,0,1)]">
          {/* Floating Badge (Left offset for Free tier) */}
          <div className="absolute -top-5 -left-4 z-20 flex rotate-[-6deg] flex-col items-center justify-center rounded-none border-[3px] border-black bg-white px-3 py-1.5 shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-transform duration-300 group-hover:rotate-[-12deg]">
            <Gift className="h-5 w-5 stroke-[2.5] text-black" />
            <span className="text-xl font-black">10</span>
          </div>

          <div className="flex flex-col items-start border-b-[4px] border-black bg-[var(--color-nb-mint)] p-5 sm:p-6">
            <div className="mb-2 inline-block border-[2px] border-black bg-white px-2 py-0.5 text-[10px] font-black tracking-widest uppercase shadow-[2px_2px_0px_rgba(0,0,0,1)]">
              Welcome Gift
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black tracking-tight sm:text-5xl">
                Free
              </span>
              <span className="text-xs font-extrabold text-black/60 uppercase sm:text-sm">
                Forever
              </span>
            </div>
          </div>

          <div className="flex flex-1 flex-col justify-between p-5 sm:p-6">
            <ul className="flex flex-col gap-2.5">
              {[
                "10 High-Velocity Generations",
                "Try out all Roster Characters",
                "Full HD 1080p Resolution",
                "Premium Voice Synthesization",
              ].map((feature, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <div className="mt-0.5 flex shrink-0 items-center justify-center rounded-none border-[2px] border-black bg-[var(--color-nb-yellow)] p-0.5">
                    <Check className="h-3 w-3 stroke-[4]" />
                  </div>
                  <span className="mt-px text-xs leading-snug font-bold sm:text-sm">
                    {feature}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-6 flex w-full items-center justify-center rounded-none border-[3px] border-black bg-gray-200 py-3.5 sm:py-4">
              <ShieldCheck className="mr-2 h-4 w-4 text-black/50" />
              <span className="text-xs font-black tracking-widest text-black/50 uppercase sm:text-sm">
                Active Plan
              </span>
            </div>
          </div>
        </div>

        {/* PAID PACKAGE CARDS */}
        {CREDIT_PACKAGE.map((pkg, idx) => {
          const theme = packageThemes[idx % packageThemes.length]!;

          return (
            <div
              key={pkg.id}
              className="group relative flex flex-col rounded-none border-[4px] border-black bg-white shadow-[6px_6px_0px_rgba(0,0,0,1)] transition-transform duration-300 hover:-translate-y-1 hover:shadow-[8px_8px_0px_rgba(0,0,0,1)]"
            >
              {/* Floating Badge (Right offset for Paid tiers) */}
              <div
                className={`absolute -top-5 -right-4 z-20 flex rotate-[6deg] flex-col items-center justify-center rounded-none border-[3px] border-black ${theme.badge} px-3 py-1.5 shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-transform duration-300 group-hover:rotate-[12deg]`}
              >
                <Zap className="h-5 w-5 fill-black" />
                <span className="text-xl font-black">{pkg.credits}</span>
              </div>

              <div
                className={`flex flex-col items-start border-b-[4px] border-black ${theme.bg} p-5 sm:p-6`}
              >
                <div className="mb-2 inline-block border-[2px] border-black bg-white px-2 py-0.5 text-[10px] font-black tracking-widest uppercase shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                  {pkg.id} Package
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black tracking-tight sm:text-5xl">
                    ${(pkg.priceInCents / 100).toFixed(2)}
                  </span>
                  <span className="text-xs font-extrabold text-black/60 uppercase sm:text-sm">
                    One-Time
                  </span>
                </div>
              </div>

              <div className="flex flex-1 flex-col justify-between p-5 sm:p-6">
                <ul className="flex flex-col gap-2.5">
                  {[
                    `${pkg.credits} High-Velocity Generations`,
                    "Full HD 1080p Resolution",
                    "All Roster Characters Included",
                    "Premium Voice Synthesization",
                    "Credits Never Expire",
                  ].map((feature, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <div className="mt-0.5 flex shrink-0 items-center justify-center rounded-none border-[2px] border-black bg-[var(--color-nb-mint)] p-0.5">
                        <Check className="h-3 w-3 stroke-[4]" />
                      </div>
                      <span className="mt-px text-xs leading-snug font-bold sm:text-sm">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <BuyButton
                  buttonColor={theme.button}
                  buttonHover={theme.buttonHover}
                  credits={pkg.credits}
                  packageId={pkg.id}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Note */}
      <div className="mt-2 mb-2 flex justify-center">
        <p className="max-w-md text-center text-[11px] font-bold text-black/50 sm:text-xs">
          Payments processed via Stripe. Zero hidden fees or recurring charges.
        </p>
      </div>
    </div>
  );
}
