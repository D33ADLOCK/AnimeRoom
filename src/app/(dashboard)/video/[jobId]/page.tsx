"use client";

import { PreviewPlayer } from "~/app/_components/previewPlayer";
import { api } from "~/trpc/react";
import { useParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";

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
    const statusLabels: Record<string, { label: string; color: string }> = {
      queued: { label: "Queued", color: "bg-[var(--color-nb-blue)]" },
      generating_script: {
        label: "Writing Script",
        color: "bg-[var(--color-nb-yellow)]",
      },
      generating_assets: {
        label: "Generating Assets",
        color: "bg-[var(--color-nb-orange)]",
      },
      saving_manifest: {
        label: "Saving Manifest",
        color: "bg-[var(--color-nb-mint)]",
      },
      transforming_props: {
        label: "Transforming",
        color: "bg-[var(--color-nb-lavender)]",
      },
      failed: { label: "Failed", color: "bg-red-400" },
    };

    const current = status ? statusLabels[status] : null;

    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6">
        <div className="nb-card flex flex-col items-center gap-4 bg-white p-8">
          {status === "failed" ? (
            <div className="text-center">
              <p className="text-xl font-extrabold text-red-600 uppercase">
                Generation Failed
              </p>
              <p className="mt-2 text-sm font-semibold">
                Something went wrong. Please try again.
              </p>
            </div>
          ) : (
            <>
              <Loader2 className="h-10 w-10 animate-spin text-[var(--color-nb-text)]" />
              <div className="text-center">
                {current && (
                  <span
                    className={`${current.color} nb-border mb-3 inline-block px-4 py-1 text-sm font-extrabold uppercase`}
                  >
                    {current.label}
                  </span>
                )}
                <p className="text-lg font-extrabold uppercase">
                  Generating your video...
                </p>
                <p className="mt-1 text-sm font-semibold text-[var(--color-nb-text)]/60">
                  This may take a few minutes
                </p>
              </div>
            </>
          )}
        </div>
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
