"use client";

import { SignedOut, SignInButton } from "@clerk/nextjs";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Button } from "~/components/ui/button";
import { useSidebar } from "~/components/ui/sidebar";

function TopNavbar() {
  const { open } = useSidebar();
  const pathname = usePathname();
  const isAuthPage = pathname.startsWith("/login");

  return (
    <div className="relative flex w-full justify-between">
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
          <span className="text-lg font-semibold tracking-tight">
            AnimeRoom
          </span>
        </div>
      )}

      {!isAuthPage && (
        <div className="ml-auto">
          <SignedOut>
            <SignInButton mode="redirect" forceRedirectUrl={"/login"}>
              <Button className="bg-black text-white hover:bg-white hover:text-black">
                Get Started
              </Button>
            </SignInButton>
          </SignedOut>
        </div>
      )}
    </div>
  );
}

export default TopNavbar;
