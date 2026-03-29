"use client";

import { SignedIn, SignedOut, SignIn, SignInButton } from "@clerk/nextjs";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Button } from "~/components/ui/button";
import { useSidebar } from "~/components/ui/sidebar";
import CreditBalance from "../(dashboard)/_components/creditBalance";

function TopNavbar() {
  const { open } = useSidebar();
  const pathname = usePathname();
  const isAuthPage = pathname.startsWith("/login");

  return (
    <div className="relative flex w-full items-center">
      {!open && (
        <div className="flex items-center gap-3">
          <div className="relative h-8 w-8 shrink-0">
            <Image
              src="/website/logo-trimmed.png"
              alt="logo"
              className="object-contain"
              fill
              priority
            />
          </div>
          <span className="text-lg font-extrabold tracking-tight uppercase">
            AnimeRoom
          </span>
        </div>
      )}

      <div className="ml-auto flex items-center gap-3">
        <SignedIn>
          <CreditBalance />
        </SignedIn>

        {!isAuthPage && (
          <SignedOut>
            <SignInButton mode="redirect" forceRedirectUrl={"/login"}>
              <Button className="nb-btn cursor-pointer rounded-none border-[3px] border-[var(--color-nb-border)] bg-[var(--color-nb-yellow)] px-6 py-2 font-extrabold tracking-wider text-[var(--color-nb-text)] uppercase shadow-[4px_4px_0px_var(--color-nb-shadow)] hover:translate-x-[2px] hover:translate-y-[2px] hover:bg-[var(--color-nb-yellow)] hover:shadow-[2px_2px_0px_var(--color-nb-shadow)]">
                Get Started
              </Button>
            </SignInButton>
          </SignedOut>
        )}
      </div>
    </div>
  );
}

export default TopNavbar;
