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
      <SidebarHeader className="h-16 border-b border-gray-300 px-4 py-4">
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
              <span className="text-lg font-semibold tracking-tight">
                AnimeRoom
              </span>
            </div>
          </div>
        </div>
      </SidebarHeader>

      {/* ─── Primary Nav ─── */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-3">
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
                        className="font-semibold text-purple-600 hover:text-purple-700"
                      >
                        <Icon className="!h-5 !w-5 text-purple-600" />
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
                    <SidebarMenuButton size="lg" isActive={isVideosActive}>
                      <Video className="h-5 w-5" />
                      <span>Videos</span>
                      <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {videosSubItems.map((sub) => {
                        const SubIcon = sub.icon;
                        const isSubActive = pathName === sub.href;
                        return (
                          <SidebarMenuSubItem key={sub.href}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={isSubActive}
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
                    <SidebarMenuButton size="lg" asChild isActive={isActive}>
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

        <SidebarSeparator className="opacity-50" />

        {/* ─── Secondary Nav ─── */}
        <SidebarGroup>
          <SidebarGroupLabel>Account</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {secondaryItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathName === item.href;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton size="lg" asChild isActive={isActive}>
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
      <SidebarFooter className="border-border/50 border-t px-3 py-4">
        <div className="flex items-center gap-3">
          <SignedIn>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-purple-100 ring-2 ring-purple-400">
              <UserButton />
            </div>
            <div className="group-data-[collapsible=icon]:hidden">
              <p className="text-sm leading-tight font-semibold">
                Rishabh Singh
              </p>
              <p className="flex items-center gap-1 text-xs text-purple-500">
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
