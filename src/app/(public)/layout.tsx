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
      <main className="flex-1 overflow-auto">
        <div className="flex h-16 items-center gap-2 px-8">
          <SidebarTrigger size={"lg"} />
          <TopNavbar />
        </div>
        <div className="p-4">{children}</div>
      </main>
    </SidebarProvider>
  );
}
