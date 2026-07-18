import { z } from "zod";

const nonempty = z.string().trim().min(1);

export const serverEnvShape = {
  DATABASE_URL: z.string().url(),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  CLERK_SECRET_KEY: nonempty,
  CLERK_WEBHOOK_SIGNING_SECRET: z.string().startsWith("whsec_"),
  UPSTASH_REDIS_REST_URL: z.string().url(),
  UPSTASH_REDIS_REST_TOKEN: nonempty,
  R2_Access_Key_ID: nonempty,
  R2_Secret_Access_Key: nonempty,
  R2_BUCKET_NAME: nonempty,
  R2_PUBLIC_BASE_URL: z.string().url(),
  REPLICATE_IMAGE_API_TOKEN: nonempty,
  GOOGLE_GENERATIVE_AI_API_KEY: nonempty,
  INNGEST_SIGNING_KEY: nonempty.optional(),
  INNGEST_EVENT_KEY: nonempty.optional(),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith("whsec_"),
  STRIPE_SECRET_KEY: z.string().startsWith("sk_"),
  STRIPE_STARTER_PACK_PRICE_ID: z.string().startsWith("price_"),
  ADMIN_USER: nonempty,
  REMOTION_FUNCTION_NAME: nonempty,
  REMOTION_SERVE_URL: z.string().url(),
};

export const clientEnvShape = {
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: nonempty,
  NEXT_PUBLIC_APP_URL: z.string().url(),
};

export const applicationEnvSchema = z
  .object({ ...serverEnvShape, ...clientEnvShape })
  .superRefine((value, ctx) => {
    if (value.NODE_ENV !== "production") return;

    if (!value.INNGEST_SIGNING_KEY) {
      ctx.addIssue({
        code: "custom",
        path: ["INNGEST_SIGNING_KEY"],
        message: "INNGEST_SIGNING_KEY is required in production",
      });
    }
    if (!value.INNGEST_EVENT_KEY) {
      ctx.addIssue({
        code: "custom",
        path: ["INNGEST_EVENT_KEY"],
        message: "INNGEST_EVENT_KEY is required in production",
      });
    }
  });

/** @param {Record<string, unknown>} value */
export function validateApplicationEnv(value) {
  return applicationEnvSchema.parse(value);
}
