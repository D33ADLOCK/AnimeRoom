import { LifeBuoy, Mail, CreditCard, ShieldCheck } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Support — AnimeRoom",
};

const quickLinks = [
  {
    icon: CreditCard,
    title: "Billing & credits",
    desc: "Buy credits, check your balance, or see the refund policy.",
    href: "/billing",
    color: "bg-[var(--color-nb-mint)]",
  },
  {
    icon: ShieldCheck,
    title: "Refund policy",
    desc: "When credits are refunded automatically vs. manually.",
    href: "/legal/refund",
    color: "bg-[var(--color-nb-yellow)]",
  },
  {
    icon: LifeBuoy,
    title: "Privacy policy",
    desc: "What data we collect and how deletion works today.",
    href: "/legal/privacy",
    color: "bg-[var(--color-nb-lavender)]",
  },
];

export default function SupportPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-4 sm:px-6 sm:py-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight uppercase sm:text-4xl">
          Support
        </h1>
        <p className="mt-2 max-w-xl text-sm font-bold text-[var(--color-nb-text)]/70">
          AnimeRoom is a small, early-stage team. Reach out and a real person
          will get back to you — usually within 2 business days.
        </p>
      </div>

      <a
        href="mailto:support@animeroom.space"
        className="nb-btn flex w-full items-center justify-center gap-3 rounded-none border-[3px] border-[var(--color-nb-border)] bg-[var(--color-nb-pink)] px-6 py-4 font-extrabold text-[var(--color-nb-text)] shadow-[4px_4px_0px_var(--color-nb-shadow)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_var(--color-nb-shadow)] sm:w-auto"
      >
        <Mail className="h-5 w-5" />
        support@animeroom.space
      </a>

      <div>
        <h2 className="mb-3 text-lg font-extrabold tracking-widest uppercase">
          Quick links
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="group flex flex-col gap-2 rounded-none border-[3px] border-[var(--color-nb-border)] bg-white p-4 shadow-[4px_4px_0px_var(--color-nb-shadow)] transition-all hover:-translate-y-0.5"
              >
                <div
                  className={`flex h-9 w-9 items-center justify-center border-[2px] border-[var(--color-nb-border)] ${link.color}`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <p className="text-sm font-extrabold">{link.title}</p>
                <p className="text-xs font-medium text-[var(--color-nb-text)]/60">
                  {link.desc}
                </p>
              </Link>
            );
          })}
        </div>
      </div>

      <p className="text-xs font-bold text-[var(--color-nb-text)]/50">
        Found a bug, or content that shouldn&apos;t be on AnimeRoom? Email us at
        the address above — include a link or screenshot if you can.
      </p>
    </div>
  );
}
