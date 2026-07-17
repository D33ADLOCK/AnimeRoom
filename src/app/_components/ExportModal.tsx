"use client";

import { useState, useEffect } from "react";
import { Download, Loader2, VideoIcon, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { api } from "~/trpc/react";

type ExportState = "idle" | "exporting" | "done" | "failed";

interface ExportModalProps {
  jobId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ExportModal({
  jobId,
  open,
  onOpenChange,
}: ExportModalProps) {
  const [exportState, setExportState] = useState<ExportState>("idle");
  const [progress, setProgress] = useState(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  const { mutate: startExport, isPending } = api.job.startExport.useMutation({
    onSuccess: () => setExportState("exporting"),
    onError: (error) => {
      setExportError(error.message);
      setExportState("failed");
    },
  });

  const { data: progressData, isError: progressError } =
    api.job.getExportProgress.useQuery(
      { jobId },
      {
        enabled: exportState === "exporting",
        refetchInterval: (query) => (query.state.data?.done ? false : 3000),
      },
    );

  useEffect(() => {
    if (!progressData) return;
    setProgress(progressData.overallProgress);
    if (progressData.done && progressData.videoUrl) {
      setVideoUrl(progressData.videoUrl);
      setExportState("done");
    }
  }, [progressData]);

  useEffect(() => {
    if (progressError) setExportState("failed");
  }, [progressError]);

  const handleStartExport = () => {
    startExport({ jobId });
  };

  const handleRetry = () => {
    setExportState("idle");
    setProgress(0);
    setVideoUrl(null);
    setExportError(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-none border-[4px] border-black bg-white p-0 shadow-[8px_8px_0px_rgba(0,0,0,1)] sm:max-w-md">
        {/* Header */}
        <DialogHeader className="border-b-[3px] border-black bg-[var(--color-nb-yellow)] px-6 py-5">
          <DialogTitle className="text-xl font-black tracking-tight uppercase">
            Export Video
          </DialogTitle>
          <DialogDescription className="text-sm font-semibold text-black/60">
            Render and download your video as an MP4.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5 px-6 py-5">
          {/* Status Card */}
          <div
            className={`flex items-center gap-4 rounded-none border-[3px] border-black p-4 shadow-[3px_3px_0px_rgba(0,0,0,1)] ${
              exportState === "done"
                ? "bg-[var(--color-nb-mint)]"
                : exportState === "failed"
                  ? "bg-[var(--color-nb-pink)]"
                  : "bg-white"
            }`}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-none border-[2px] border-black bg-white">
              {exportState === "idle" && <VideoIcon className="h-5 w-5" />}
              {exportState === "exporting" && (
                <Loader2 className="h-5 w-5 animate-spin" />
              )}
              {exportState === "done" && <Download className="h-5 w-5" />}
              {exportState === "failed" && <AlertCircle className="h-5 w-5" />}
            </div>

            <div className="flex flex-col gap-0.5">
              {exportState === "idle" && (
                <>
                  <p className="text-sm font-black">Ready to export</p>
                  <p className="text-xs font-semibold text-black/50">
                    This will take a few minutes
                  </p>
                </>
              )}
              {exportState === "exporting" && (
                <>
                  <p className="text-sm font-black">Rendering...</p>
                  <p className="text-xs font-semibold text-black/50">
                    {Math.round(progress * 100)}% complete
                  </p>
                </>
              )}
              {exportState === "done" && (
                <>
                  <p className="text-sm font-black">Export complete</p>
                  <p className="text-xs font-semibold text-black/50">
                    Your video is ready to download
                  </p>
                </>
              )}
              {exportState === "failed" && (
                <>
                  <p className="text-sm font-black">Export failed</p>
                  <p className="text-xs font-semibold text-black/50">
                    {exportError ?? "Something went wrong. Try again."}
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Progress Bar — only visible while exporting */}
          {exportState === "exporting" && (
            <div className="h-3 w-full rounded-none border-[2px] border-black bg-white">
              <div
                className="h-full bg-[var(--color-nb-yellow)] transition-all duration-500"
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </div>
          )}

          {/* CTA */}
          {exportState === "idle" && (
            <Button
              onClick={handleStartExport}
              disabled={isPending}
              className="w-full rounded-none border-[3px] border-black bg-black py-6 text-sm font-black tracking-widest text-white uppercase shadow-[4px_4px_0px_rgba(0,0,0,0.3)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_rgba(0,0,0,0.3)]"
            >
              Start Export
            </Button>
          )}

          {exportState === "exporting" && (
            <Button
              disabled
              className="w-full rounded-none border-[3px] border-black bg-black py-6 text-sm font-black tracking-widest text-white uppercase opacity-50"
            >
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Exporting...
            </Button>
          )}

          {exportState === "done" && videoUrl && (
            <a
              href={videoUrl}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-none border-[3px] border-black bg-[var(--color-nb-mint)] py-4 text-sm font-black tracking-widest text-black uppercase shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_rgba(0,0,0,1)]"
            >
              <Download className="h-4 w-4" />
              Download MP4
            </a>
          )}

          {exportState === "failed" && (
            <Button
              onClick={handleRetry}
              className="w-full rounded-none border-[3px] border-black bg-[var(--color-nb-pink)] py-6 text-sm font-black tracking-widest text-black uppercase shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_rgba(0,0,0,1)]"
            >
              Try Again
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
