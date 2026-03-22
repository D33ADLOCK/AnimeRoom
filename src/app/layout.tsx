import "~/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";

import { ClerkProvider } from "@clerk/nextjs";
import { TRPCReactProvider } from "~/trpc/react";
import { Toaster } from "sonner";
import { Providers } from "./provider";

// Vercel
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

export const metadata: Metadata = {
  title: "Anime Room",
  description:
    "Create Roast battle videos with your favourite anime characters",
  icons: [{ rel: "icon", url: "/icon.png" }],
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
            <Providers>
              {children}
              <Toaster />
              <Analytics />
              <SpeedInsights />
            </Providers>
          </TRPCReactProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
