import { createEnv } from "@t3-oss/env-nextjs";
import {
  clientEnvShape,
  serverEnvShape,
  validateApplicationEnv,
} from "./env.schema.js";

const skipValidation = !!process.env.SKIP_ENV_VALIDATION;
const runtimeEnv = {
  DATABASE_URL: process.env.DATABASE_URL,
  NODE_ENV: process.env.NODE_ENV,
  CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
  CLERK_WEBHOOK_SIGNING_SECRET: process.env.CLERK_WEBHOOK_SIGNING_SECRET,
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
  UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
  R2_Access_Key_ID: process.env.R2_Access_Key_ID,
  R2_Secret_Access_Key: process.env.R2_Secret_Access_Key,
  R2_BUCKET_NAME: process.env.R2_BUCKET_NAME,
  R2_PUBLIC_BASE_URL: process.env.R2_PUBLIC_BASE_URL,
  REPLICATE_IMAGE_API_TOKEN: process.env.REPLICATE_IMAGE_API_TOKEN,
  GOOGLE_GENERATIVE_AI_API_KEY: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
  INNGEST_SIGNING_KEY: process.env.INNGEST_SIGNING_KEY,
  INNGEST_EVENT_KEY: process.env.INNGEST_EVENT_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_STARTER_PACK_PRICE_ID: process.env.STRIPE_STARTER_PACK_PRICE_ID,
  ADMIN_USER: process.env.ADMIN_USER,
  REMOTION_FUNCTION_NAME: process.env.REMOTION_FUNCTION_NAME,
  REMOTION_SERVE_URL: process.env.REMOTION_SERVE_URL,
};

if (!skipValidation && typeof window === "undefined") {
  validateApplicationEnv(runtimeEnv);
}

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: serverEnvShape,

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: clientEnvShape,

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv,
  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
   * useful for Docker builds.
   */
  skipValidation,
  /**
   * Makes it so that empty strings are treated as undefined. `SOME_VAR: z.string()` and
   * `SOME_VAR=''` will throw an error.
   */
  emptyStringAsUndefined: true,
});
