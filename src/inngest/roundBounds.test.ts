import { describe, expect, it } from "vitest";
import { assertCanGenerateRound, assertExactRoundCount } from "./roundBounds";

describe("paid round bounds", () => {
  it("allows indexes inside the six-round allocation", () => {
    expect(() => assertCanGenerateRound(5, 6)).not.toThrow();
  });

  it("rejects a seventh round before vendor generation", () => {
    expect(() => assertCanGenerateRound(6, 6)).toThrow("more than 6 rounds");
  });

  it("rejects underflow before completion", () => {
    expect(() => assertExactRoundCount(5, 6)).toThrow("exactly 6 are required");
  });
});
