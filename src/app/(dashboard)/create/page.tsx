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
import { z } from "zod";
import { api } from "~/trpc/react";
import { useRouter } from "next/navigation";

const starterTemplates: {
  title: string;
  description: string;
  prompt: string;
  color: string;
  icon: LucideIcon;
}[] = [
  {
    title: "Classic Rivalry",
    description: "Two iconic rivals turn old grudges into punchlines.",
    prompt:
      "Naruto vs Sasuke in an anime roast battle. Naruto is loud, chaotic, and keeps flexing talk-no-jutsu. Sasuke is cold, dramatic, and roasts Naruto for needing clones to have friends. Make it fast, petty, cinematic, and end with a ridiculous final insult.",
    color: "bg-[var(--color-nb-yellow)]",
    icon: Swords,
  },
  {
    title: "Hero vs Villain",
    description: "A final boss argument with maximum disrespect.",
    prompt:
      "Goku vs Frieza in a roast battle on a destroyed planet. Goku is cheerful but savage, roasting Frieza for losing to every hairstyle upgrade. Frieza is elegant, furious, and insults Goku's brain cells, parenting, and battle IQ. Make it dramatic with big anime reactions.",
    color: "bg-[var(--color-nb-pink)]",
    icon: Flame,
  },
  {
    title: "Teacher vs Student",
    description: "Mentor energy, student chaos, no mercy.",
    prompt:
      "Gojo vs Yuji in a roast battle inside Jujutsu High. Gojo is smug, unserious, and keeps calling Yuji a walking side quest. Yuji is wholesome but accidentally brutal, roasting Gojo's blindfold, ego, and inability to explain anything normally. Keep it funny and high-energy.",
    color: "bg-[var(--color-nb-mint)]",
    icon: Wand2,
  },
  {
    title: "Power Scaling Debate",
    description: "Settle a toxic fandom argument as a video.",
    prompt:
      "Create an anime roast battle where Saitama and Luffy argue about who clears more universes. Saitama is bored and deadpan. Luffy is fearless, hungry, and refuses to understand power scaling. Include over-the-top announcer reactions and a punchline about comment sections.",
    color: "bg-[var(--color-nb-blue)]",
    icon: Zap,
  },
  {
    title: "Original Showdown",
    description: "Use your own characters with a ready structure.",
    prompt:
      "Create an original anime roast battle between Kai, a broke lightning swordsman with too much confidence, and Mira, a rich fire mage who treats every fight like a photoshoot. Kai roasts Mira for being all budget and no aim. Mira roasts Kai for charging his sword with unpaid electricity. Make it stylish, funny, and easy to follow.",
    color: "bg-[var(--color-nb-lavender)]",
    icon: Crown,
  },
];

export default function CreatePage() {
  const utils = api.useUtils();
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null);

  const userPromptSchema = z.object({
    prompt: z.string().min(6, "Prompt must be 6 character long"),
  });

  type formType = z.infer<typeof userPromptSchema>;

  const { mutateAsync: startJob } = api.job.createJob.useMutation({
    onSuccess: () => utils.credit.getBalance.invalidate(),
  });

  const router = useRouter();

  const {
    handleSubmit,
    register,
    setFocus,
    setValue,
    watch,
    formState: { isSubmitting, errors },
  } = useForm<formType>({
    resolver: zodResolver(userPromptSchema),
    defaultValues: {
      prompt: "",
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

  const onSubmit = async (values: formType) => {
    const result = await startJob({ prompt: values.prompt });

    if (!result) throw new Error("Job Creating failed");

    router.push(`/videos/${result.jobId}`);

    return result.jobId;
  };

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 py-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight uppercase">
          Create a Video
        </h1>
        <p className="mt-2 text-sm font-semibold text-[var(--color-nb-text)]/70">
          Describe your anime roast battle and we&apos;ll generate it for you.
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {starterTemplates.map((template) => {
          const Icon = template.icon;
          const isActive = activeTemplate === template.title;

          return (
            <button
              key={template.title}
              type="button"
              onClick={() => applyTemplate(template)}
              className={`nb-card flex min-h-[190px] cursor-pointer flex-col justify-between p-4 text-left transition-transform hover:-translate-y-1 ${template.color} ${
                isActive
                  ? "translate-x-[3px] translate-y-[3px] shadow-[3px_3px_0px_var(--color-nb-shadow)]"
                  : ""
              }`}
              aria-pressed={isActive}
            >
              <span className="flex items-start justify-between gap-3">
                <span className="rounded-none border-[3px] border-[var(--color-nb-border)] bg-white p-2 shadow-[2px_2px_0px_var(--color-nb-shadow)]">
                  <Icon className="h-5 w-5" />
                </span>
                {isActive && (
                  <span className="border-[2px] border-[var(--color-nb-border)] bg-white px-2 py-1 text-[10px] font-extrabold uppercase">
                    Loaded
                  </span>
                )}
              </span>
              <span className="flex flex-col gap-2">
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
      </section>

      {/* Prompt Input */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mx-auto w-full max-w-2xl"
      >
        <div className="flex flex-col gap-3">
          <Textarea
            placeholder="e.g. Goku vs Vegeta in a roast battle. Goku is cocky and keeps flexing his Ultra Instinct. Vegeta is furious and roasts Goku's parenting skills..."
            {...register("prompt")}
            className="nb-input min-h-[200px] resize-none rounded-none border-[3px] border-[var(--color-nb-border)] bg-white px-4 py-4 text-base leading-relaxed font-semibold shadow-[3px_3px_0px_var(--color-nb-shadow)] placeholder:font-normal placeholder:text-[var(--color-nb-text)]/40 focus:translate-x-[2px] focus:translate-y-[2px] focus:shadow-[1px_1px_0px_var(--color-nb-shadow)] focus-visible:ring-0"
          />
          {errors.prompt && (
            <p className="text-sm font-bold text-red-600">
              {errors.prompt.message}
            </p>
          )}
          <p className="text-right text-xs font-bold text-[var(--color-nb-text)]/50">
            {userPrompt.length} characters
          </p>
        </div>

        {/* Generate Button */}
        <Button
          type={"submit"}
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
      </form>
    </div>
  );
}
