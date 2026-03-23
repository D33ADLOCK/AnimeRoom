import { Video } from "lucide-react";
import Link from "next/link";
import React from "react";

export default function EmptyGrid() {
  return (
    <div className="nb-card flex min-h-[40vh] flex-col items-center justify-center bg-[var(--color-nb-lavender)] px-4 py-10 text-center sm:p-12">
      <div className="nb-border mb-6 rounded-full bg-white p-4 shadow-[4px_4px_0_var(--color-nb-shadow)] sm:p-6 sm:shadow-[6px_6px_0_var(--color-nb-shadow)]">
        <Video className="h-10 w-10 sm:h-12 sm:w-12" />
      </div>
      <h2 className="mb-2 text-2xl font-black uppercase sm:mb-4 sm:text-3xl">
        No Videos Yet
      </h2>
      <p className="mb-6 max-w-md text-base font-bold text-[var(--color-nb-text)]/80 sm:mb-8 sm:text-lg">
        You haven&apos;t generated any roast battles yet. Time to spark some
        chaos!
      </p>
      <Link
        href="/create"
        className="nb-btn bg-[var(--color-nb-yellow)] px-6 py-3 text-lg sm:px-8 sm:py-4 sm:text-xl"
      >
        Start Your First Roast
      </Link>
    </div>
  );
}
