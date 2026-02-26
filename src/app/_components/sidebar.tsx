"use client";

import { SignedIn, UserButton } from "@clerk/nextjs";
import {
  ChevronDown,
  CreditCard,
  Compass,
  Info,
  LifeBuoy,
  Palette,
  Settings,
  Smile,
  Sparkles,
  Trash2,
  User2,
  Video,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/ui/collapsible";
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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarSeparator,
  SidebarTrigger,
} from "~/components/ui/sidebar";

/* ─── Menu data ─── */

const topItems = [
  { title: "Create", href: "/create", icon: Sparkles, accent: true },
];

const videosSubItems = [
  { title: "Discover", href: "/videos/discover", icon: Compass },
  { title: "My Videos", href: "/videos", icon: Video },
];

const navItems = [
  { title: "Characters", href: "/characters", icon: Smile },
  { title: "Themes", href: "/themes", icon: Palette },
  { title: "Deleted", href: "/deleted", icon: Trash2 },
  { title: "About", href: "/about", icon: Info },
];

const secondaryItems = [
  { title: "Billing", href: "/billing", icon: CreditCard },
  { title: "Support", href: "/support", icon: LifeBuoy },
  { title: "Settings", href: "/settings", icon: Settings },
];

/* ─── Component ─── */

function AppSidebar() {
  const pathName = usePathname();
  const isVideosActive = pathName.startsWith("/videos");

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
              {topItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathName === item.href;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      className="flex gap-4"
                      size="lg"
                      asChild
                      isActive={isActive}
                    >
                      <Link
                        href={item.href}
                        className="nb-btn rounded-none border-[3px] border-[var(--color-nb-border)] bg-[var(--color-nb-pink)] px-4 py-2 font-extrabold text-[var(--color-nb-text)] shadow-[4px_4px_0px_var(--color-nb-shadow)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_var(--color-nb-shadow)]"
                      >
                        <Icon className="!h-5 !w-5" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}

              {/* Videos (collapsible dropdown) */}
              <Collapsible
                defaultOpen={isVideosActive}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      size="lg"
                      isActive={isVideosActive}
                      className="rounded-none border-[3px] border-[var(--color-nb-border)] font-bold hover:bg-[var(--color-nb-yellow)]"
                    >
                      <Video className="h-5 w-5" />
                      <span>Videos</span>
                      <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub className="border-l-[3px] border-[var(--color-nb-border)]">
                      {videosSubItems.map((sub) => {
                        const SubIcon = sub.icon;
                        const isSubActive = pathName === sub.href;
                        return (
                          <SidebarMenuSubItem key={sub.href}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={isSubActive}
                              className="rounded-none font-semibold hover:bg-[var(--color-nb-lavender)]"
                            >
                              <Link href={sub.href}>
                                <SubIcon className="h-4 w-4" />
                                <span>{sub.title}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        );
                      })}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>

              {/* Rest of nav items */}
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathName === item.href;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      size="lg"
                      asChild
                      isActive={isActive}
                      className="rounded-none border-[3px] border-[var(--color-nb-border)] font-bold hover:bg-[var(--color-nb-mint)]"
                    >
                      <Link href={item.href}>
                        <Icon className="h-5 w-5!" />
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
                Rishabh Singh
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
