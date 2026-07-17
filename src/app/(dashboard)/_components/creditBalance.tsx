"use client";

import { api } from "~/trpc/react";
import { Zap } from "lucide-react";

export default function CreditBalance() {
  const { data: userBalance, isLoading } = api.credit.getBalance.useQuery();

  return (
    <div className="group flex cursor-pointer items-center gap-2 rounded-none border-[3px] border-[var(--color-nb-border)] bg-[var(--color-nb-mint)] px-4 py-1.5 shadow-[4px_4px_0px_var(--color-nb-shadow)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[6px_6px_0px_var(--color-nb-shadow)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_var(--color-nb-shadow)]">
      <Zap className="h-4 w-4 fill-black text-black transition-transform duration-300 group-hover:scale-110" />
      <div className="flex items-baseline gap-1.5">
        <span className="text-sm font-black text-black sm:text-base">
          {isLoading ? "..." : (userBalance ?? 0)}
        </span>
        <span className="text-[10px] font-extrabold tracking-widest text-black/70 uppercase sm:text-xs">
          Credits
        </span>
      </div>
    </div>
  );
}
