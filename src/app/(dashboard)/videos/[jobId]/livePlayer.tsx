"use client";

import { useEffect, useState } from "react";
import type { LiveStateType } from "~/lib/pipeline/helper/createEmptyPreviewState";
import { LivePreview } from "./_components/live/livePreview";
import { useRealtime } from "~/lib/redis/realtime-client";
import LiveEditor from "./_components/live/liveEditor";
import { api, type RouterOutputs } from "~/trpc/react";

type JobStatus = RouterOutputs["job"]["getStatus"];

const terminalStatuses = new Set(["complete", "failed"]);

export default function LivePlayer({
  jobId,
  initialLiveState,
  initialManifest,
  initialStatus,
}: {
  jobId: string;
  initialLiveState: LiveStateType;
  initialManifest: LiveStateType | null;
  initialStatus: JobStatus;
}) {
  const [liveState, setLiveState] = useState<LiveStateType>(initialLiveState);

  const statusQuery = api.job.getStatus.useQuery(
    { jobId },
    {
      initialData: initialStatus,
      refetchInterval: (query) =>
        terminalStatuses.has(query.state.data?.jobStatus ?? "") ? false : 3_000,
      refetchOnReconnect: true,
      refetchOnWindowFocus: true,
    },
  );

  const status = statusQuery.data;
  const manifestQuery = api.job.getManifest.useQuery(
    { jobId },
    {
      enabled: status?.jobStatus === "complete",
      initialData: initialManifest,
    },
  );

  useEffect(() => {
    if (manifestQuery.data) setLiveState(manifestQuery.data);
  }, [manifestQuery.data]);

  const isTerminal = terminalStatuses.has(status?.jobStatus ?? "");

  useRealtime({
    enabled: !isTerminal,
    channels: [`job:${jobId}`],
    events: ["pipeline-events"],
    onData: ({ data }) => {
      if (data.type === "previewUpdate") setLiveState(data);
      void statusQuery.refetch();
      if (data.type === "completed") void manifestQuery.refetch();
    },
  });

  const title =
    status?.jobStatus === "queued"
      ? "Queued"
      : status?.jobStatus === "generating"
        ? `Generating · ${status.currentStage}`
        : status?.jobStatus === "complete"
          ? "Complete"
          : status?.refundedAt
            ? "Generation failed · Credit refunded"
            : "Generation failed";

  return (
    <div className="px-4 py-6 sm:px-8">
      <section
        className={`mb-5 border-[3px] border-black p-4 font-bold shadow-[4px_4px_0_black] ${
          status?.jobStatus === "failed"
            ? "bg-[var(--color-nb-pink)]"
            : status?.jobStatus === "complete"
              ? "bg-[var(--color-nb-mint)]"
              : "bg-[var(--color-nb-yellow)]"
        }`}
        aria-live="polite"
      >
        <p className="text-lg font-black uppercase">{title}</p>
        {status?.jobStatus === "queued" && (
          <p className="text-sm">Your generation is waiting to start.</p>
        )}
        {status?.jobStatus === "generating" && (
          <p className="text-sm">
            This page recovers from refreshes and keeps checking durable status.
          </p>
        )}
        {status?.jobStatus === "failed" && (
          <div className="text-sm">
            <p>{status.safeError ?? "Video generation did not complete."}</p>
            {status.retryable && <p>You can safely create a new generation.</p>}
          </div>
        )}
      </section>

      {status?.jobStatus === "complete" && !manifestQuery.data ? (
        <p className="font-bold">Loading completed video…</p>
      ) : (
        <div className="flex flex-col gap-4 lg:flex-row">
          <div className="min-w-0 flex-1">
            <LiveEditor liveState={liveState} />
          </div>
          <div className="top-4 h-fit w-full shrink-0 lg:sticky lg:w-1/3">
            <div className="border-[3px] border-[var(--color-nb-border)] bg-white p-2 shadow-[6px_6px_0px_var(--color-nb-shadow)]">
              <LivePreview liveState={liveState} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
