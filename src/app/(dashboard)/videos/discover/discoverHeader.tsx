import { Compass } from "lucide-react";

export default function DiscoverHeader() {
  return (
    <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:mb-12 sm:flex-row sm:items-end sm:gap-6">
      <div>
        <h1 className="flex items-center gap-2 text-4xl font-black tracking-tight uppercase sm:gap-3 sm:text-6xl">
          <Compass className="h-10 w-10 sm:h-14 sm:w-14" />
          <span
            className="text-[var(--color-nb-mint)] drop-shadow-[3px_3px_0_var(--color-nb-border)] sm:drop-shadow-[4px_4px_0_var(--color-nb-border)]"
            style={{ WebkitTextStroke: "2px var(--color-nb-border)" }}
          >
            DISCOVER
          </span>
        </h1>
        <p className="mt-2 text-base font-bold text-[var(--color-nb-text)]/70 sm:mt-6 sm:text-lg">
          Explore roast battles created by the community.
        </p>
      </div>
    </div>
  );
}
