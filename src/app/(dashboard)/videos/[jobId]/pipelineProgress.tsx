"use client";

import { Loader2 } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { JobStatusType } from "~/server/db/schema";
import { api } from "~/trpc/react";
import { UploadAssetField } from "./_components/uploadAssetField";
import { VideoPlayer } from "./videoPlayer";

type PipelineProgressProps = {
  jobId: string;
};

export const PipelineProgress = ({ jobId }: PipelineProgressProps) => {
  const [pageStatus, setPageStatus] = useState<JobStatusType | null>(null);

  const { mutateAsync: generateScript } = api.job.generateScript.useMutation();
  const pipelineStarted = useRef(false);

  useEffect(() => {
    if (pipelineStarted.current) return;
    pipelineStarted.current = true;

    void generateScript({ jobId }).catch(console.error);
  }, [jobId, generateScript]);

  const { data: genScript } = api.job.getScript.useQuery(
    { jobId },
    { enabled: pageStatus === "complete" || pageStatus === "script_generated" },
  );

  useEffect(() => {
    console.log("pageStatus: ", pageStatus);

    const source = new EventSource(`/videos/${jobId}/progress`);

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

  // ─── Stage 1: Script is being generated ───

  if (
    !pageStatus ||
    pageStatus === "queued" ||
    pageStatus === "generating_script"
  ) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6">
        <div className="nb-card flex flex-col items-center gap-4 bg-white p-8">
          <Loader2 className="h-10 w-10 animate-spin text-[var(--color-nb-text)]" />
          <div className="text-center">
            <span className="nb-border mb-3 inline-block bg-[var(--color-nb-yellow)] px-4 py-1 text-sm font-extrabold uppercase">
              Writing Script
            </span>
            <p className="text-lg font-extrabold uppercase">
              Crafting your roast battle...
            </p>
            <p className="mt-1 text-sm font-semibold text-[var(--color-nb-text)]/60">
              This may take a moment
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ─── Stage 2: Script generated, user selects assets ───
  if (pageStatus === "script_generated") {
    return (
      <UploadAssetField
        jobId={jobId}
        character1Name={genScript?.script?.character1?.name ?? "Character 1"}
        character2Name={genScript?.script?.character2?.name ?? "Character 2"}
      />
    );
  }

  // ─── Stage 3: Pipeline running (generating assets → complete) ───
  if (
    pageStatus === "generating_assets" ||
    pageStatus === "saving_manifest" ||
    pageStatus === "transforming_props"
  ) {
    const statusLabels: Record<string, { label: string; color: string }> = {
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
    };

    const current = statusLabels[pageStatus];

    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6">
        <div className="nb-card flex flex-col items-center gap-4 bg-white p-8">
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
        </div>
      </div>
    );
  }

  // ─── Stage 4: Failed ───
  if (pageStatus === "failed") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6">
        <div className="nb-card flex flex-col items-center gap-4 bg-white p-8">
          <div className="text-center">
            <p className="text-xl font-extrabold text-red-600 uppercase">
              Generation Failed
            </p>
            <p className="mt-2 text-sm font-semibold">
              Something went wrong. Please try again.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!manifest?.videoProps) return;

  return <VideoPlayer videoProps={manifest.videoProps} jobId={jobId} />;
};
