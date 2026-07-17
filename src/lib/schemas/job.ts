import { z } from "zod";

export const PROMPT_MIN_LENGTH = 6;
export const PROMPT_MAX_LENGTH = 1_000;

export const jobIdSchema = z.string().uuid("Job ID must be a valid UUID");

export const promptSchema = z
  .string()
  .trim()
  .min(
    PROMPT_MIN_LENGTH,
    `Prompt must be at least ${PROMPT_MIN_LENGTH} characters`,
  )
  .max(
    PROMPT_MAX_LENGTH,
    `Prompt must be at most ${PROMPT_MAX_LENGTH} characters`,
  );

export const createJobSchema = z.object({
  prompt: promptSchema,
  requestId: z.string().uuid("Request ID must be a valid UUID"),
});

export type CreateJobInput = z.infer<typeof createJobSchema>;
