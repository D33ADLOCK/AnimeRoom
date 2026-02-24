"use client";

import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "~/trpc/react";

export default function CreatePage() {
  const userPromptSchema = z.object({
    prompt: z.string().min(6, "Prompt must be 6 character long"),
  });

  type formType = z.infer<typeof userPromptSchema>;

  const { mutateAsync } = api.job.createJob.useMutation();

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
    console.log("OnSubmut Called");
    const jobId = await mutateAsync({ prompt: values.prompt });
    console.log("Created", jobId);

    return jobId;
  };

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 py-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Create a Video</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Describe your anime roast battle and we&apos;ll generate it for you.
        </p>
      </div>

      {/* Prompt Input */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="flex flex-col gap-3">
          <Textarea
            placeholder="e.g. Goku vs Vegeta in a roast battle. Goku is cocky and keeps flexing his Ultra Instinct. Vegeta is furious and roasts Goku's parenting skills..."
            {...register("prompt")}
            className="border-border/60 bg-muted/30 placeholder:text-muted-foreground/50 min-h-[200px] resize-none rounded-xl px-4 py-4 text-base leading-relaxed focus-visible:ring-purple-500"
          />
          <p className="text-muted-foreground text-right text-xs">
            {userPrompt.length} characters
          </p>
        </div>

        {/* Generate Button */}
        <Button
          type={"submit"}
          // disabled={!prompt.trim()}
          size="lg"
          className="w-full rounded-xl bg-purple-600 py-6 text-base font-semibold hover:bg-purple-700 disabled:opacity-50"
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
