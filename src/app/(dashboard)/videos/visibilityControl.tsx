"use client";

import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import type { JobVisibilityType } from "~/server/db/schema";

type VisibilityControlProps = {
  jobId: string;
  visibility: JobVisibilityType;
};

export function VisibilityControl({
  jobId,
  visibility,
}: VisibilityControlProps) {
  const router = useRouter();
  const isPublished = visibility === "published";
  const setVisibility = api.job.setVisibility.useMutation({
    onSuccess: (job) => {
      toast.success(
        job.visibility === "published"
          ? "Video is now listed publicly."
          : "Video is no longer listed publicly.",
      );
      router.refresh();
    },
    onError: (error) => {
      toast.error(error.message || "Could not update video visibility.");
    },
  });

  return (
    <div className="mt-3 border-t-2 border-black/20 pt-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-black tracking-wide uppercase sm:text-xs">
          {isPublished ? "Listed publicly" : "Not listed publicly"}
        </span>
        <button
          type="button"
          className="nb-btn cursor-pointer bg-white px-2 py-1 text-[10px] sm:text-xs"
          disabled={setVisibility.isPending}
          onClick={() =>
            setVisibility.mutate({
              jobId,
              visibility: isPublished ? "private" : "published",
            })
          }
        >
          {setVisibility.isPending
            ? "Saving..."
            : isPublished
              ? "Unpublish"
              : "Publish"}
        </button>
      </div>
      <p className="mt-2 text-[10px] leading-snug font-semibold text-black/60 sm:text-xs">
        Unpublishing removes this video from Discover and public manifest
        access. Already shared media URLs are not revoked.
      </p>
    </div>
  );
}
