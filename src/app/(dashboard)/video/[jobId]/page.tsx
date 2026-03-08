"use client";

import { PreviewPlayer } from "~/app/_components/previewPlayer";
import { VideoAssetsEditor } from "~/app/(dashboard)/video/_components/videoAssetsEditor";
import { api } from "~/trpc/react";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

export default function Page() {
  const STATS_DURATION = 90; // Per round

  const [pageStatus, setPageStatus] = useState("");
  const { jobId } = useParams<{ jobId: string }>();

  const { mutateAsync: startPipeline } = api.job.startPipeline.useMutation();
  const pipelineStarted = useRef(false);

  useEffect(() => {
    if (pipelineStarted.current) return;
    pipelineStarted.current = true;

    startPipeline({ jobId }).catch(console.error);
  }, [jobId, startPipeline]);

  useEffect(() => {
    console.log("Page status:", pageStatus);
    const source = new EventSource(`/video/${jobId}/progress`);

    source.onmessage = (event) => {
      const status = JSON.parse(event.data);

      setPageStatus(status);
      console.log(status);

      if (status === "complete" || status === "failed") source.close();
    };

    return () => source.close();
  }, [jobId]);

  const { data: manifest } = api.job.getManifest.useQuery(
    { jobId },
    { enabled: pageStatus === "complete" },
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

    const current = pageStatus ? statusLabels[pageStatus] : null;

    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6">
        <div className="nb-card flex flex-col items-center gap-4 bg-white p-8">
          {pageStatus === "failed" ? (
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
    <div className="flex gap-4 px-8">
      {/* Editor Area */}
      <VideoAssetsEditor videoProps={manifest.videoProps} jobId={jobId} />

      {/* Preview Player - sticky on the right */}
      <div className="top-4 h-fit w-1/3 shrink">
        <div className="border-[3px] border-[var(--color-nb-border)] bg-white p-2 shadow-[6px_6px_0px_var(--color-nb-shadow)]">
          <PreviewPlayer
            playerProps={manifest.videoProps}
            totalDuration={totalDurationInFrames}
          />
        </div>
      </div>
    </div>
  );
}
