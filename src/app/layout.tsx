import "~/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";

import { ClerkProvider } from "@clerk/nextjs";
import { TRPCReactProvider } from "~/trpc/react";

import AppSidebar from "./_components/sidebar";
import { SidebarProvider, SidebarTrigger } from "~/components/ui/sidebar";

export const metadata: Metadata = {
  title: "Anime Room",
  description:
    "Create Roast battle videos with your favourite anime characters",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable}`}>
      <body>
        <ClerkProvider>
          <TRPCReactProvider>
            <SidebarProvider defaultOpen={true}>
              <AppSidebar />
              <main className="flex-1 overflow-auto">
                <div className="flex h-18 items-center gap-2 border-b px-4">
                  <SidebarTrigger size={"lg"} />
                  {/* put page title / search / etc here */}
                </div>
                <div className="p-4">{children}</div>
              </main>
            </SidebarProvider>
          </TRPCReactProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
