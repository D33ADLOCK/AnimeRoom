import Link from "next/link";
import React from "react";

const tabs = [
  { title: "Terms of Service", href: "/legal/terms" },
  { title: "Privacy Policy", href: "/legal/privacy" },
  { title: "Refund Policy", href: "/legal/refund" },
];

export default function LegalLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-4 sm:px-6 sm:py-8">
      <nav className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className="rounded-none border-[3px] border-[var(--color-nb-border)] bg-white px-3 py-1.5 text-xs font-bold uppercase shadow-[3px_3px_0px_var(--color-nb-shadow)] transition-all hover:-translate-y-0.5 hover:bg-[var(--color-nb-yellow)] sm:text-sm"
          >
            {tab.title}
          </Link>
        ))}
      </nav>
      <article className="flex flex-col gap-6 [&_h2]:mt-2 [&_h2]:text-xl [&_h2]:font-extrabold [&_h2]:tracking-tight [&_h2]:uppercase [&_li]:ml-5 [&_li]:list-disc [&_p]:text-sm [&_p]:leading-relaxed [&_p]:font-medium [&_p]:text-[var(--color-nb-text)]/80 [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-1.5">
        {children}
      </article>
    </div>
  );
}
