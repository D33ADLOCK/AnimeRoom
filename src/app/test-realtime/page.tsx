"use client";

import { useState } from "react";
import { useRealtime } from "~/lib/redis/realtime-client";
import { api } from "~/trpc/react";
import type { LivePreviewStateSchema } from "~/lib/realtime/job-event";

export default function Page() {
  const [liveState, setLiveState] = useState<LivePreviewStateSchema | null>(
    null,
  );

  const mutation = api.job.createLivePipeline.useMutation();

  useRealtime({
    events: ["pipeline-events"],
    onData: ({ event, data }) => {
      console.log(`Received ${event}:`, data);

      // We expect the data to be the LiveStateType (which matches LivePreviewStateSchema)
      if (data && (data as any).type === "previewUpdate") {
        setLiveState(data as LivePreviewStateSchema);
      }
    },
  });

  return (
    <div className="p-8">
      <h1 className="mb-4 text-2xl font-bold">Pipeline Streaming Test</h1>

      <button
        onClick={() => {
          setLiveState(null);
          mutation.mutate({
            jobId: "123456",
            prompt: "Generate a roast battle between goku and freeza",
          });
        }}
        disabled={mutation.isPending}
        className="rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {mutation.isPending ? "Starting..." : "Start Pipeline"}
      </button>

      <div className="mt-8">
        <h2 className="mb-2 text-xl font-semibold">Live State Stream</h2>
        <pre className="max-h-[800px] overflow-auto rounded-lg bg-gray-100 p-4 text-sm dark:bg-zinc-900">
          {liveState
            ? JSON.stringify(liveState, null, 2)
            : "Waiting for pipeline to start..."}
        </pre>
      </div>
    </div>
  );
}
