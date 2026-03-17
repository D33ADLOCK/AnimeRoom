import { generateText, Output } from "ai";
import "dotenv/config";
import type { z } from "zod";
import { google } from "@ai-sdk/google";

export async function generateScript<TSchema>(
  userPrompt: string,
  schema: z.ZodType<TSchema>,
) {
  const { output } = await generateText({
    model: google("gemini-2.5-flash"),
    output: Output.object({
      schema,
    }),
    prompt: userPrompt,
  });

  return output;
}
