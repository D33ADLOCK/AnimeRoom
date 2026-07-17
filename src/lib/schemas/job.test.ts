import { describe, expect, it } from "vitest";
import { createJobSchema, PROMPT_MAX_LENGTH, PROMPT_MIN_LENGTH } from "./job";

const requestId = "04c8837b-39f2-4cbe-a953-2cf0d1db3018";

describe("createJobSchema", () => {
  it("accepts a bounded prompt and UUID request key", () => {
    expect(
      createJobSchema.safeParse({ prompt: "Anime roast", requestId }).success,
    ).toBe(true);
  });

  it("rejects prompt underflow", () => {
    expect(
      createJobSchema.safeParse({
        prompt: "x".repeat(PROMPT_MIN_LENGTH - 1),
        requestId,
      }).success,
    ).toBe(false);
  });

  it("rejects prompt overflow", () => {
    expect(
      createJobSchema.safeParse({
        prompt: "x".repeat(PROMPT_MAX_LENGTH + 1),
        requestId,
      }).success,
    ).toBe(false);
  });

  it("rejects a non-UUID request key", () => {
    expect(
      createJobSchema.safeParse({ prompt: "Anime roast", requestId: "retry" })
        .success,
    ).toBe(false);
  });
});
