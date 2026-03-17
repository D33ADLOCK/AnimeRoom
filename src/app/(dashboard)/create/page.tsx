"use client";

import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "~/trpc/react";
import { useRouter } from "next/navigation";

export default function CreatePage() {
  const userPromptSchema = z.object({
    prompt: z.string().min(6, "Prompt must be 6 character long"),
  });

  type formType = z.infer<typeof userPromptSchema>;

  const { mutateAsync: startJob } = api.job.createJob.useMutation();

  const router = useRouter();

  const {
    handleSubmit,
    register,
    watch,
    formState: { isSubmitting, errors },
  } = useForm<formType>({
    resolver: zodResolver(userPromptSchema),
    defaultValues: {
      prompt: "",
    },
  });

  const userPrompt = watch("prompt");

  const onSubmit = async (values: formType) => {
    const [result] = await startJob({ prompt: values.prompt });

    if (!result) throw new Error("Job Creating failed");

    router.push(`/videos/${result.jobId}`);

    return result.jobId;
  };

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 py-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight uppercase">
          Create a Video
        </h1>
        <p className="mt-2 text-sm font-semibold text-[var(--color-nb-text)]/70">
          Describe your anime roast battle and we&apos;ll generate it for you.
        </p>
      </div>

      {/* Prompt Input */}
      <form onSubmit={handleSubmit(onSubmit)}>
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
