import { describe, expect, it } from "vitest";
import {
  allowedJobTransitions,
  canTransition,
  terminalRefundSourceId,
} from "./jobTransitions";

describe("job lifecycle transitions", () => {
  it.each([
    ["queued", "generating"],
    ["queued", "failed"],
    ["generating", "complete"],
    ["generating", "failed"],
  ] as const)("allows %s -> %s", (from, to) => {
    expect(canTransition(from, to)).toBe(true);
  });

  it.each([
    ["queued", "complete"],
    ["complete", "failed"],
    ["failed", "generating"],
    ["failed", "complete"],
  ] as const)("rejects %s -> %s", (from, to) => {
    expect(canTransition(from, to)).toBe(false);
  });

  it("keeps terminal states terminal", () => {
    expect(allowedJobTransitions.complete).toEqual([]);
    expect(allowedJobTransitions.failed).toEqual([]);
  });

  it("uses one canonical terminal refund identity", () => {
    expect(terminalRefundSourceId("job-123")).toBe("job-123_terminal_refund");
  });
});
