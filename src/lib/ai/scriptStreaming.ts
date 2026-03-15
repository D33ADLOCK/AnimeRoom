import { google } from "@ai-sdk/google";
import { streamText, Output, type AsyncIterableStream } from "ai";
import type { z, ZodTypeAny } from "zod";

export function streamStructuredArray<TSchema extends ZodTypeAny>({
  prompt,
  schema,
}: {
  prompt: string;
  schema: TSchema;
}): AsyncIterableStream<z.infer<TSchema>> {
  const { elementStream } = streamText({
    model: google("gemini-2.5-flash"),
    output: Output.array({
      element: schema,
    }),
    prompt,
  });

  return elementStream as AsyncIterableStream<z.infer<TSchema>>;
}
