import { TRPCError } from "@trpc/server";
import { redis } from "~/lib/redis/redis";

export const COST_GUARDRAILS = {
  createJob: { limit: 3, windowSeconds: 60 },
  export: { limit: 5, windowSeconds: 60 },
  generationConcurrency: 3,
} as const;

const fixedWindowScript = `
local count = redis.call("INCR", KEYS[1])
if count == 1 then redis.call("EXPIRE", KEYS[1], ARGV[1]) end
return count
`;

export async function enforceRateLimit({
  action,
  userId,
}: {
  action: "createJob" | "export";
  userId: string;
}) {
  const policy = COST_GUARDRAILS[action];

  try {
    const window = Math.floor(Date.now() / (policy.windowSeconds * 1_000));
    const count = await redis.eval<[number], number>(
      fixedWindowScript,
      [`ratelimit:${action}:${userId}:${window}`],
      [policy.windowSeconds],
    );

    if (count > policy.limit) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: `Too many ${action === "createJob" ? "generation" : "export"} requests. Please wait and try again.`,
      });
    }
  } catch (error) {
    if (error instanceof TRPCError) throw error;

    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message:
        "We could not safely authorize this paid operation. Please try again shortly.",
      cause: error,
    });
  }
}
