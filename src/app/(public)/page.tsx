import Image from "next/image";
import Link from "next/link";
import { Sparkles, Swords, Zap, Film, Wand2, Trophy } from "lucide-react";

const features = [
  {
    icon: Swords,
    title: "AI Roast Battles",
    desc: "Pit any two anime characters against each other in a savage roast battle — scripted entirely by AI.",
    color: "bg-[var(--color-nb-pink)]",
  },
  {
    icon: Zap,
    title: "Live Generation",
    desc: "Watch your video come alive in real-time. No waiting — see rounds stream in as they're created.",
    color: "bg-[var(--color-nb-yellow)]",
  },
  {
    icon: Film,
    title: "Cinematic Output",
    desc: "Full 9:16 vertical videos with character intros, stat screens, battle rounds, and dynamic audio.",
    color: "bg-[var(--color-nb-mint)]",
  },
  {
    icon: Wand2,
    title: "AI Image Generation",
    desc: "Every character pose and expression is generated uniquely per round using Replicate's fast inference.",
    color: "bg-[var(--color-nb-lavender)]",
  },
  {
    icon: Trophy,
    title: "Full Editor",
    desc: "Regenerate any image, rewrite any dialogue, re-record any audio clip — total creative control.",
    color: "bg-[var(--color-nb-orange)]",
  },
  {
    icon: Sparkles,
    title: "One Prompt Away",
    desc: 'Just type "Goku vs Frieza" and let the AI handle everything — script, images, voice, and video.',
    color: "bg-[var(--color-nb-blue)]",
  },
];

const steps = [
  {
    num: "01",
    title: "Type a Prompt",
    desc: 'Enter something like "Naruto vs Sasuke roast battle" and hit create.',
    color: "bg-[var(--color-nb-yellow)]",
  },
  {
    num: "02",
    title: "Watch it Generate",
    desc: "See characters, stats, rounds, images, and audio stream in live — one piece at a time.",
    color: "bg-[var(--color-nb-pink)]",
  },
  {
    num: "03",
    title: "Edit & Export",
    desc: "Fine-tune any part in the editor, then export your polished anime roast battle video.",
    color: "bg-[var(--color-nb-mint)]",
  },
];

export default function Home() {
  return (
    <div className="flex flex-col gap-16 pb-16">
      {/* ─── Hero Section ─── */}
      <section className="flex flex-col items-center gap-8 pt-8 text-center">
        {/* Logo */}
        <div className="nb-card inline-flex items-center gap-4 bg-[var(--color-nb-yellow)] px-6 py-3">
          <div className="relative h-12 w-12 shrink-0">
            <Image
              src="/website/logo-trimmed.png"
              alt="AnimeRoom logo"
              className="object-contain"
              fill
              priority
            />
          </div>
          <span className="text-2xl font-black tracking-tight uppercase">
            AnimeRoom
          </span>
        </div>

        {/* Headline */}
        <div className="flex max-w-2xl flex-col gap-4">
          <h1 className="text-5xl leading-tight font-black tracking-tight uppercase">
            AI-Powered{" "}
            <span className="inline-block -rotate-1 border-[3px] border-[var(--color-nb-border)] bg-[var(--color-nb-pink)] px-3 py-1 shadow-[4px_4px_0px_var(--color-nb-shadow)]">
              Anime Roast
            </span>{" "}
            Battle Videos
          </h1>
          <p className="text-lg font-semibold text-[var(--color-nb-text)]/70">
            Type a prompt. Watch an entire anime roast battle video generate
            live — characters, dialogue, images, voice acting, and all.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/create"
            className="nb-btn flex items-center gap-2 bg-[var(--color-nb-pink)] px-8 py-3 text-lg"
          >
            <Sparkles className="h-5 w-5" />
            Start Creating
          </Link>
          <Link
            href="/videos"
            className="nb-btn flex items-center gap-2 bg-white px-8 py-3 text-lg"
          >
            <Film className="h-5 w-5" />
            Browse Videos
          </Link>
        </div>

        {/* Decorative tag */}
        <div className="flex items-center gap-2">
          <span className="nb-border inline-block bg-[var(--color-nb-lavender)] px-3 py-1 text-xs font-extrabold uppercase">
            Free to try
          </span>
          <span className="nb-border inline-block bg-[var(--color-nb-mint)] px-3 py-1 text-xs font-extrabold uppercase">
            No login required to browse
          </span>
        </div>
      </section>

      {/* ─── Features Grid ─── */}
      <section className="flex flex-col gap-6">
        <div className="text-center">
          <span className="nb-border mb-3 inline-block bg-[var(--color-nb-orange)] px-4 py-1 text-sm font-extrabold uppercase">
            Features
          </span>
          <h2 className="text-3xl font-black tracking-tight uppercase">
            Everything You Need
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="nb-card flex flex-col gap-3 p-5 transition-transform hover:-translate-y-1"
              >
                <div
                  className={`${f.color} nb-border nb-shadow-sm inline-flex h-12 w-12 items-center justify-center`}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-extrabold uppercase">{f.title}</h3>
                <p className="text-sm leading-relaxed font-semibold text-[var(--color-nb-text)]/60">
                  {f.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section className="flex flex-col gap-6">
        <div className="text-center">
          <span className="nb-border mb-3 inline-block bg-[var(--color-nb-blue)] px-4 py-1 text-sm font-extrabold uppercase">
            How It Works
          </span>
          <h2 className="text-3xl font-black tracking-tight uppercase">
            Three Simple Steps
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {steps.map((s) => (
            <div key={s.num} className="nb-card flex flex-col gap-4 p-6">
              <div
                className={`${s.color} nb-border nb-shadow-sm inline-flex h-14 w-14 items-center justify-center text-2xl font-black`}
              >
                {s.num}
              </div>
              <h3 className="text-xl font-extrabold uppercase">{s.title}</h3>
              <p className="text-sm leading-relaxed font-semibold text-[var(--color-nb-text)]/60">
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Bottom CTA ─── */}
      <section className="flex flex-col items-center gap-6 text-center">
        <div className="nb-card inline-flex max-w-xl flex-col items-center gap-5 bg-[var(--color-nb-yellow)] p-8">
          <h2 className="text-3xl font-black tracking-tight uppercase">
            Ready to Roast?
          </h2>
          <p className="font-semibold text-[var(--color-nb-text)]/70">
            Pick two characters, hit create, and watch AI generate an entire
            cinematic roast battle in real-time.
          </p>
          <Link
            href="/create"
            className="nb-btn flex items-center gap-2 bg-[var(--color-nb-pink)] px-8 py-3 text-lg"
          >
            <Sparkles className="h-5 w-5" />
            Create Your Battle
          </Link>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="flex flex-col items-center gap-2 border-t-[3px] border-[var(--color-nb-border)] pt-6 text-center">
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs font-bold text-[var(--color-nb-text)]/60 uppercase">
          <Link
            href="/legal/terms"
            className="hover:text-[var(--color-nb-text)] hover:underline"
          >
            Terms
          </Link>
          <Link
            href="/legal/privacy"
            className="hover:text-[var(--color-nb-text)] hover:underline"
          >
            Privacy
          </Link>
          <Link
            href="/legal/refund"
            className="hover:text-[var(--color-nb-text)] hover:underline"
          >
            Refunds
          </Link>
          <Link
            href="/support"
            className="hover:text-[var(--color-nb-text)] hover:underline"
          >
            Support
          </Link>
        </div>
        <p className="text-[11px] font-semibold text-[var(--color-nb-text)]/40">
          AnimeRoom is a fan-made, independent project. Not affiliated with,
          endorsed by, or sponsored by any anime studio or rights holder.
        </p>
      </footer>
    </div>
  );
}
