import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    DATABASE_URL: z.string().url(),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),

    // Clerk Auth
    CLERK_SECRET_KEY: z.string(),

    // Upstash Redis
    UPSTASH_REDIS_REST_URL: z.string().url(),
    UPSTASH_REDIS_REST_TOKEN: z.string(),

    // Cloudflare R2 Storage
    R2_Access_Key_ID: z.string(),
    R2_Secret_Access_Key: z.string(),
    R2_BUCKET_NAME: z.string(),
    R2_PUBLIC_BASE_URL: z.string().url(),

    // Replicate (images + audio)
    REPLICATE_IMAGE_API_TOKEN: z.string(),

    // Google AI (Gemini — used by @ai-sdk/google)
    GOOGLE_GENERATIVE_AI_API_KEY: z.string(),

    // Inngest (required in production)
    INNGEST_SIGNING_KEY: z.string().optional(),
    INNGEST_EVENT_KEY: z.string().optional(),
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string(),
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    NODE_ENV: process.env.NODE_ENV,

    // Clerk
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,

    // Upstash Redis
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,

    // Cloudflare R2
    R2_Access_Key_ID: process.env.R2_Access_Key_ID,
    R2_Secret_Access_Key: process.env.R2_Secret_Access_Key,
    R2_BUCKET_NAME: process.env.R2_BUCKET_NAME,
    R2_PUBLIC_BASE_URL: process.env.R2_PUBLIC_BASE_URL,

    // Replicate
    REPLICATE_IMAGE_API_TOKEN: process.env.REPLICATE_IMAGE_API_TOKEN,

    // Google AI
    GOOGLE_GENERATIVE_AI_API_KEY: process.env.GOOGLE_GENERATIVE_AI_API_KEY,

    // Inngest
    INNGEST_SIGNING_KEY: process.env.INNGEST_SIGNING_KEY,
    INNGEST_EVENT_KEY: process.env.INNGEST_EVENT_KEY,
  },
  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
   * useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  /**
   * Makes it so that empty strings are treated as undefined. `SOME_VAR: z.string()` and
   * `SOME_VAR=''` will throw an error.
   */
  emptyStringAsUndefined: true,
});
