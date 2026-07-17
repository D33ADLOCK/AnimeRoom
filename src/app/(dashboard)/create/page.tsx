"use client";

import { useState } from "react";
import {
  Crown,
  Flame,
  Loader2,
  Sparkles,
  Swords,
  Wand2,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "~/trpc/react";
import { useRouter } from "next/navigation";
import {
  createJobSchema,
  PROMPT_MAX_LENGTH,
  type CreateJobInput,
} from "~/lib/schemas/job";

const starterTemplates: {
  title: string;
  description: string;
  prompt: string;
  surface: string;
  icon: LucideIcon;
}[] = [
  {
    title: "Classic Rivalry",
    description: "Two iconic rivals turn old grudges into punchlines.",
    prompt:
      "Naruto vs Sasuke in an anime roast battle. Naruto is loud, chaotic, and keeps flexing talk-no-jutsu. Sasuke is cold, dramatic, and roasts Naruto for needing clones to have friends. Make it fast, petty, cinematic, and end with a ridiculous final insult.",
    surface:
      "bg-gradient-to-br from-[var(--color-nb-yellow)] via-[var(--color-nb-orange)] to-white",
    icon: Swords,
  },
  {
    title: "Hero vs Villain",
    description: "A final boss argument with maximum disrespect.",
    prompt:
      "Goku vs Frieza in a roast battle on a destroyed planet. Goku is cheerful but savage, roasting Frieza for losing to every hairstyle upgrade. Frieza is elegant, furious, and insults Goku's brain cells, parenting, and battle IQ. Make it dramatic with big anime reactions.",
    surface:
      "bg-gradient-to-br from-[var(--color-nb-pink)] via-[var(--color-nb-lavender)] to-white",
    icon: Flame,
  },
  {
    title: "Teacher vs Student",
    description: "Mentor energy, student chaos, no mercy.",
    prompt:
      "Gojo vs Yuji in a roast battle inside Jujutsu High. Gojo is smug, unserious, and keeps calling Yuji a walking side quest. Yuji is wholesome but accidentally brutal, roasting Gojo's blindfold, ego, and inability to explain anything normally. Keep it funny and high-energy.",
    surface:
      "bg-gradient-to-br from-[var(--color-nb-mint)] via-[var(--color-nb-blue)] to-white",
    icon: Wand2,
  },
  {
    title: "Power Scaling Debate",
    description: "Settle a toxic fandom argument as a video.",
    prompt:
      "Create an anime roast battle where Saitama and Luffy argue about who clears more universes. Saitama is bored and deadpan. Luffy is fearless, hungry, and refuses to understand power scaling. Include over-the-top announcer reactions and a punchline about comment sections.",
    surface:
      "bg-gradient-to-br from-[var(--color-nb-blue)] via-[var(--color-nb-yellow)] to-white",
    icon: Zap,
  },
  {
    title: "Original Showdown",
    description: "Use your own characters with a ready structure.",
    prompt:
      "Create an original anime roast battle between Kai, a broke lightning swordsman with too much confidence, and Mira, a rich fire mage who treats every fight like a photoshoot. Kai roasts Mira for being all budget and no aim. Mira roasts Kai for charging his sword with unpaid electricity. Make it stylish, funny, and easy to follow.",
    surface:
      "bg-gradient-to-br from-[var(--color-nb-lavender)] via-[var(--color-nb-pink)] to-white",
    icon: Crown,
  },
];

export default function CreatePage() {
  const utils = api.useUtils();
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null);

  const { mutateAsync: startJob } = api.job.createJob.useMutation({
    onSuccess: () => utils.credit.getBalance.invalidate(),
  });

  const router = useRouter();

  const {
    handleSubmit,
    register,
    setError,
    setFocus,
    setValue,
    watch,
    formState: { isSubmitting, errors },
  } = useForm<CreateJobInput>({
    resolver: zodResolver(createJobSchema),
    defaultValues: {
      prompt: "",
      requestId: crypto.randomUUID(),
    },
  });

  const userPrompt = watch("prompt");

  const applyTemplate = (template: (typeof starterTemplates)[number]) => {
    setActiveTemplate(template.title);
    setValue("prompt", template.prompt, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
    setFocus("prompt");
  };

  const onSubmit = async (values: CreateJobInput) => {
    try {
      const result = await startJob(values);

      if (!result) throw new Error("Job creation failed");

      router.push(`/videos/${result.jobId}`);

      return result.jobId;
    } catch (error) {
      setError("root", {
        message:
          error instanceof Error
            ? error.message
            : "Could not start generation. Please try again.",
      });
    }
  };

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-7 py-8">
      <div className="mx-auto w-full max-w-2xl">
        <h1 className="text-3xl font-extrabold tracking-tight uppercase">
          Create a Video
        </h1>
        <p className="mt-2 text-sm font-semibold text-[var(--color-nb-text)]/70">
          Describe your anime roast battle and we&apos;ll generate it for you.
        </p>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mx-auto flex w-full max-w-2xl flex-col gap-4"
      >
        <div className="flex flex-col gap-3">
          <Textarea
            maxLength={PROMPT_MAX_LENGTH}
            placeholder="e.g. Goku vs Vegeta in a roast battle. Goku is cocky and keeps flexing his Ultra Instinct. Vegeta is furious and roasts Goku's parenting skills..."
            {...register("prompt")}
            className="nb-input min-h-[230px] resize-none rounded-none border-[3px] border-[var(--color-nb-border)] bg-white px-4 py-4 text-base leading-relaxed font-semibold shadow-[3px_3px_0px_var(--color-nb-shadow)] placeholder:font-normal placeholder:text-[var(--color-nb-text)]/40 focus:translate-x-[2px] focus:translate-y-[2px] focus:shadow-[1px_1px_0px_var(--color-nb-shadow)] focus-visible:ring-0"
          />
          {errors.prompt && (
            <p className="text-sm font-bold text-red-600">
              {errors.prompt.message}
            </p>
          )}
          <p className="text-right text-xs font-bold text-[var(--color-nb-text)]/50">
            {userPrompt.length}/{PROMPT_MAX_LENGTH} characters
          </p>
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          size="lg"
          className="nb-btn w-full cursor-pointer rounded-none border-[3px] border-[var(--color-nb-border)] bg-[var(--color-nb-pink)] py-6 text-base font-extrabold tracking-wider text-[var(--color-nb-text)] uppercase shadow-[4px_4px_0px_var(--color-nb-shadow)] hover:translate-x-[2px] hover:translate-y-[2px] hover:bg-[var(--color-nb-pink)] hover:shadow-[2px_2px_0px_var(--color-nb-shadow)] disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-5 w-5" />
              Generate Video
            </>
          )}
        </Button>
        {errors.root?.message && (
          <p className="text-sm font-bold text-red-600">
            {errors.root.message}
          </p>
        )}
      </form>

      <section className="mt-2 flex flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-extrabold tracking-[0.18em] text-[var(--color-nb-text)]/55 uppercase">
              Starter templates
            </p>
            <h2 className="text-xl font-extrabold uppercase">
              Need a launch point?
            </h2>
          </div>
          {activeTemplate && (
            <p className="border-[2px] border-[var(--color-nb-border)] bg-white px-3 py-1 text-xs font-extrabold uppercase shadow-[2px_2px_0px_var(--color-nb-shadow)]">
              {activeTemplate} loaded
            </p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {starterTemplates.map((template) => {
            const Icon = template.icon;
            const isActive = activeTemplate === template.title;

            return (
              <button
                key={template.title}
                type="button"
                onClick={() => applyTemplate(template)}
                className={`nb-card group relative flex min-h-[205px] cursor-pointer flex-col justify-between overflow-hidden p-4 text-left transition-transform hover:-translate-y-1 ${template.surface} ${
                  isActive
                    ? "translate-x-[3px] translate-y-[3px] shadow-[3px_3px_0px_var(--color-nb-shadow)]"
                    : ""
                }`}
                aria-pressed={isActive}
              >
                <span className="absolute top-3 right-3 h-14 w-14 rotate-12 border-[3px] border-[var(--color-nb-border)] bg-white/55 transition-transform group-hover:rotate-45" />
                <span className="absolute right-12 bottom-6 h-8 w-8 border-[3px] border-[var(--color-nb-border)] bg-white/45 transition-transform group-hover:-rotate-12" />
                <span className="relative flex items-start justify-between gap-3">
                  <span className="rounded-none border-[3px] border-[var(--color-nb-border)] bg-white p-2 shadow-[2px_2px_0px_var(--color-nb-shadow)]">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="border-[2px] border-[var(--color-nb-border)] bg-white px-2 py-1 text-[10px] font-extrabold uppercase shadow-[2px_2px_0px_var(--color-nb-shadow)]">
                    Use
                  </span>
                </span>
                <span className="relative flex flex-col gap-2">
                  <span className="text-base leading-tight font-extrabold uppercase">
                    {template.title}
                  </span>
                  <span className="text-xs leading-snug font-bold text-[var(--color-nb-text)]/75">
                    {template.description}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
