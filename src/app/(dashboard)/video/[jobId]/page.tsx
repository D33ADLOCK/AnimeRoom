"use client";

import { PreviewPlayer } from "~/app/_components/previewPlayer";
import { api } from "~/trpc/react";
import { useParams } from "next/navigation";
import { useEffect, useRef } from "react";

export default function Page() {
  const STATS_DURATION = 90; // Per round

  const { jobId } = useParams<{ jobId: string }>();

  const { mutateAsync: startPipeline } = api.job.startPipeline.useMutation();
  const pipelineStarted = useRef(false);

  useEffect(() => {
    if (pipelineStarted.current) return;
    pipelineStarted.current = true;

    startPipeline({ jobId }).catch(console.error);
  }, [jobId, startPipeline]);

  const { data: status } = api.job.getStatus.useQuery(
    { jobId },
    {
      enabled: !!jobId,
      refetchInterval(query) {
        const s = query.state.data;

        if (s === "complete" || s === "failed") return false;
        return 5000;
      },
    },
  );

  const { data: manifest } = api.job.getManifest.useQuery(
    { jobId },
    { enabled: status === "complete" },
  );

  if (!manifest?.videoProps) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-muted-foreground text-lg">
          {status ? `Status: ${status}` : "Loading..."}
        </p>
      </div>
    );
  }

  const totalDurationInFrames = Math.ceil(
    Math.ceil(manifest.videoProps.audioDuration.totalDuration * 30) +
      STATS_DURATION * 2,
  );

  return (
    <div>
      <PreviewPlayer
        playerProps={manifest.videoProps}
        totalDuration={totalDurationInFrames}
      />
    </div>
  );
}
