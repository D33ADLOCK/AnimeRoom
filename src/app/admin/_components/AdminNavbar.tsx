"use client";

import { SignedIn } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import CreditBalance from "~/app/(dashboard)/_components/creditBalance";

export default function AdminNavbar() {
  return (
    <div className="sticky top-0 z-50 w-full border-b-[3px] border-[var(--color-nb-border)] bg-[var(--color-nb-bg)] px-6 py-3">
      <div className="mx-auto flex max-w-5xl items-center">
        <Link href="/" className="flex items-center gap-3">
          <div className="relative h-8 w-8 shrink-0">
            <Image
              src="/website/logo-trimmed.png"
              alt="logo"
              className="object-contain"
              fill
              priority
            />
          </div>
          <span className="text-lg font-extrabold uppercase tracking-tight">
            AnimeRoom
          </span>
        </Link>

        <div className="ml-auto flex items-center gap-3">
          <Link
            href="/"
            className="border-[3px] border-[var(--color-nb-border)] px-4 py-1.5 text-sm font-extrabold uppercase tracking-wider shadow-[4px_4px_0px_var(--color-nb-shadow)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_var(--color-nb-shadow)]"
          >
            ← Dashboard
          </Link>
          <SignedIn>
            <CreditBalance />
          </SignedIn>
        </div>
      </div>
    </div>
  );
}
