"use client";

import { SignedIn, UserButton, useUser } from "@clerk/nextjs";
import {
  Compass,
  CreditCard,
  Home,
  LifeBuoy,
  Sparkles,
  Video,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "~/components/ui/sidebar";

/* ─── Menu data ─── */

// The one accent action, kept visually prominent.
const createItem = { title: "Create", href: "/create", icon: Sparkles };

// Flat, top-level browse items (previously hidden inside a "Videos" dropdown).
const primaryItems = [
  { title: "Home", href: "/", icon: Home },
  { title: "Discover", href: "/videos/discover", icon: Compass },
  { title: "My Videos", href: "/videos", icon: Video },
];

const secondaryItems = [
  { title: "Billing", href: "/billing", icon: CreditCard },
  { title: "Support", href: "/support", icon: LifeBuoy },
];

/* ─── Component ─── */

function AppSidebar() {
  const pathName = usePathname();
  const { user } = useUser();
  const displayName = user?.fullName ?? user?.username ?? "Your Account";

  return (
    <Sidebar collapsible="offcanvas" variant="sidebar" className="border-r-0">
      {/* ─── Header ─── */}
      <SidebarHeader className="h-16 border-b-[3px] border-[var(--color-nb-border)] bg-[var(--color-nb-yellow)] px-4 py-4">
        <div className="flex items-center justify-between">
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
            <div className="flex items-center gap-2 group-data-[collapsible=icon]:hidden">
              <span className="text-lg font-extrabold tracking-tight uppercase">
                AnimeRoom
              </span>
            </div>
          </div>
        </div>
      </SidebarHeader>

      {/* ─── Primary Nav ─── */}
      <SidebarContent className="bg-white">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-3 p-2">
              {/* Create (accent) */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  className="flex gap-4"
                  size="lg"
                  asChild
                  isActive={pathName === createItem.href}
                >
                  <Link
                    href={createItem.href}
                    className="nb-btn rounded-none border-[3px] border-[var(--color-nb-border)] bg-[var(--color-nb-pink)] px-4 py-2 font-extrabold text-[var(--color-nb-text)] shadow-[4px_4px_0px_var(--color-nb-shadow)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_var(--color-nb-shadow)]"
                  >
                    <createItem.icon className="!h-5 !w-5" />
                    <span>{createItem.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Flat browse items */}
              {primaryItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathName === item.href;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      size="lg"
                      asChild
                      isActive={isActive}
                      className="rounded-none border-[3px] border-[var(--color-nb-border)] font-bold hover:bg-[var(--color-nb-yellow)]"
                    >
                      <Link href={item.href}>
                        <Icon className="!h-5 !w-5" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="border-t-[3px] border-[var(--color-nb-border)]" />

        {/* ─── Secondary Nav ─── */}
        <SidebarGroup>
          <SidebarGroupLabel className="font-extrabold tracking-widest uppercase">
            Account
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1 p-2">
              {secondaryItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathName === item.href;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      size="lg"
                      asChild
                      isActive={isActive}
                      className="rounded-none border-[3px] border-[var(--color-nb-border)] font-bold hover:bg-[var(--color-nb-blue)]"
                    >
                      <Link href={item.href}>
                        <Icon className="!h-5 !w-5" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* ─── Footer ─── */}
      <SidebarFooter className="border-t-[3px] border-[var(--color-nb-border)] bg-[var(--color-nb-lavender)] px-3 py-4">
        <div className="flex items-center gap-3">
          <SignedIn>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center border-[3px] border-[var(--color-nb-border)] bg-white shadow-[2px_2px_0px_var(--color-nb-shadow)]">
              <UserButton />
            </div>
            <div className="group-data-[collapsible=icon]:hidden">
              <p className="text-sm leading-tight font-extrabold">
                {displayName}
              </p>
              <p className="flex items-center gap-1 text-xs font-bold">
                <Sparkles className="h-3 w-3" /> Upgrade
              </p>
            </div>
          </SignedIn>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

export default AppSidebar;
