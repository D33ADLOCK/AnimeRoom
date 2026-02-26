import React from "react";
import { SidebarProvider, SidebarTrigger } from "~/components/ui/sidebar";
import AppSidebar from "../_components/sidebar";
import TopNavbar from "../_components/topNavbar";

export default function PublicLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar />
      <main className="flex-1 overflow-auto bg-[var(--color-nb-bg)]">
        <div className="flex h-16 items-center gap-2 border-b-[3px] border-[var(--color-nb-border)] px-8">
          <SidebarTrigger size={"lg"} className="rounded-none font-bold" />
          <TopNavbar />
        </div>
        <div className="p-6">{children}</div>
      </main>
    </SidebarProvider>
  );
}
