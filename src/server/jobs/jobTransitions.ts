import type { JobStatusType } from "~/server/db/schema";

export const TERMINAL_REFUND_SUFFIX = "terminal_refund";
export const terminalRefundSourceId = (jobId: string) =>
  `${jobId}_${TERMINAL_REFUND_SUFFIX}`;

export const allowedJobTransitions: Record<
  JobStatusType,
  readonly JobStatusType[]
> = {
  queued: ["generating", "failed"],
  generating: ["complete", "failed"],
  complete: [],
  failed: [],
};

export function canTransition(from: JobStatusType, to: JobStatusType): boolean {
  return allowedJobTransitions[from].includes(to);
}
