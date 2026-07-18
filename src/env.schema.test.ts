import { describe, expect, it } from "vitest";
import { applicationEnvSchema } from "./env.schema.js";

const validEnv = {
  DATABASE_URL: "postgresql://user:pass@localhost:5432/animeroom",
  NODE_ENV: "test",
  CLERK_SECRET_KEY: "clerk-secret",
  CLERK_WEBHOOK_SIGNING_SECRET: "whsec_test",
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_clerk",
  NEXT_PUBLIC_APP_URL: "https://preview.animeroom.example",
  UPSTASH_REDIS_REST_URL: "https://redis.example.com",
  UPSTASH_REDIS_REST_TOKEN: "redis-token",
  R2_Access_Key_ID: "r2-access",
  R2_Secret_Access_Key: "r2-secret",
  R2_BUCKET_NAME: "animeroom-test",
  R2_PUBLIC_BASE_URL: "https://cdn.example.com",
  REPLICATE_IMAGE_API_TOKEN: "replicate-token",
  GOOGLE_GENERATIVE_AI_API_KEY: "google-key",
  STRIPE_WEBHOOK_SECRET: "whsec_test",
  STRIPE_SECRET_KEY: "sk_test_placeholder",
  STRIPE_STARTER_PACK_PRICE_ID: "price_test_placeholder",
  ADMIN_USER: "user_test_admin",
  REMOTION_FUNCTION_NAME: "remotion-render-test",
  REMOTION_SERVE_URL: "https://remotion.example.com/site.zip",
};

describe("applicationEnvSchema", () => {
  it("accepts a complete non-production environment", () => {
    expect(applicationEnvSchema.safeParse(validEnv).success).toBe(true);
  });

  it("requires Inngest credentials in production", () => {
    const result = applicationEnvSchema.safeParse({
      ...validEnv,
      NODE_ENV: "production",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.path[0])).toEqual(
        expect.arrayContaining(["INNGEST_SIGNING_KEY", "INNGEST_EVENT_KEY"]),
      );
    }
  });

  it.each([
    ["STRIPE_SECRET_KEY", "secret"],
    ["STRIPE_WEBHOOK_SECRET", "secret"],
    ["CLERK_WEBHOOK_SIGNING_SECRET", "not-a-secret"],
    ["STRIPE_STARTER_PACK_PRICE_ID", "starter"],
    ["NEXT_PUBLIC_APP_URL", "not-a-url"],
    ["REMOTION_SERVE_URL", "not-a-url"],
  ])("rejects malformed %s", (key, value) => {
    expect(
      applicationEnvSchema.safeParse({ ...validEnv, [key]: value }).success,
    ).toBe(false);
  });
});
